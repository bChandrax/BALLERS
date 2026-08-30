import "dotenv/config";
import express from "express";
import cors from "cors";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// -----------------------------------------------------------------------
// CHANGE THIS before you deploy anywhere real. This is the passcode the
// admin page asks for. You can also set it via an ADMIN_KEY environment
// variable instead of editing this file (env var wins if set).
// -----------------------------------------------------------------------
const ADMIN_KEY = process.env.ADMIN_KEY || "ballers-admin-2026";

const REGISTRATIONS_COLLECTION = "registrations";

// -----------------------------------------------------------------------
// Firestore setup
//
// Paste your full Firebase service account JSON (Project Settings ->
// Service Accounts -> Generate new private key) as the value of the
// FIREBASE_SERVICE_ACCOUNT_KEY environment variable. Render's env var
// editor accepts multi-line values, so you can paste the whole JSON
// blob in as-is.
//
// This is intentionally lazy/non-fatal: if the env var isn't set yet
// (e.g. you're linking the DB later), the server still boots and every
// DB-backed route responds with a clear 503 instead of crashing.
// -----------------------------------------------------------------------
let db = null;
let firebaseInitError = null;

function initFirebase() {
  if (db || firebaseInitError) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    firebaseInitError =
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Add it in Render's environment variables.";
    console.warn(`[firebase] ${firebaseInitError}`);
    return;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    db = getFirestore();
    console.log("[firebase] Connected to Firestore.");
  } catch (err) {
    firebaseInitError = `Failed to initialize Firebase: ${err.message}`;
    console.error(`[firebase] ${firebaseInitError}`);
  }
}

initFirebase();

// Blocks DB-backed routes with a clear error until Firebase is wired up.
function requireDb(req, res, next) {
  if (!db) {
    initFirebase(); // retry, in case the env var was added after boot
    if (!db) {
      return res.status(503).json({
        error: firebaseInitError || "Database not configured yet.",
      });
    }
  }
  next();
}

// Wraps an async route handler so rejected promises become clean 500s
// instead of crashing the process or hanging the request.
function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    });
}

function generateConfirmationCode() {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BALL-${code}`;
}

// Simple gate for admin-only routes. The admin page sends the key back
// as an "x-admin-key" header on every request.
function requireAdmin(req, res, next) {
  const key = req.header("x-admin-key");
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid or missing admin key." });
  }
  next();
}

const app = express();
app.use(cors());
app.use(express.json());

// The list of valid games - keep this in sync with src/components/Games.jsx
const VALID_GAMES = [
  "3v3-teams",
  "three-point",
  "half-court",
  "girls-3v3",
];

// POST /api/register  -> save a new registration
app.post(
  "/api/register",
  requireDb,
  asyncHandler(async (req, res) => {
    const { name, email, phone, game, teamName, teammates } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!game || !VALID_GAMES.includes(game)) {
      return res.status(400).json({ error: "A valid game selection is required." });
    }

    const entry = {
      name: name.trim(),
      email: email ? email.trim() : "",
      phone: phone ? phone.trim() : "",
      game,
      teamName: teamName ? teamName.trim() : "",
      teammates: teammates
        ? String(teammates)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      status: "pending", // pending | confirmed
      confirmationCode: generateConfirmationCode(),
      registeredAt: new Date().toISOString(),
      confirmedAt: null,
    };

    const docRef = await db.collection(REGISTRATIONS_COLLECTION).add(entry);
    const saved = { id: docRef.id, ...entry };

    return res.status(201).json({ success: true, registration: saved });
  })
);

// GET /api/registrations -> admin-only: full list with contact details
app.get(
  "/api/registrations",
  requireDb,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const snapshot = await db.collection(REGISTRATIONS_COLLECTION).get();
    const registrations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    registrations.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    return res.json(registrations);
  })
);

// GET /api/registrations/count -> public: quick counts per game (no personal info)
app.get(
  "/api/registrations/count",
  requireDb,
  asyncHandler(async (req, res) => {
    const snapshot = await db.collection(REGISTRATIONS_COLLECTION).get();
    const counts = {};
    for (const game of VALID_GAMES) counts[game] = { pending: 0, confirmed: 0 };
    snapshot.forEach((doc) => {
      const r = doc.data();
      if (!counts[r.game]) counts[r.game] = { pending: 0, confirmed: 0 };
      counts[r.game][r.status] = (counts[r.game][r.status] || 0) + 1;
    });
    return res.json(counts);
  })
);

// GET /api/registrations/lookup/:code -> public: a registrant can check their own status
app.get(
  "/api/registrations/lookup/:code",
  requireDb,
  asyncHandler(async (req, res) => {
    const code = req.params.code.toUpperCase();
    const snapshot = await db
      .collection(REGISTRATIONS_COLLECTION)
      .where("confirmationCode", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No registration found with that code." });
    }

    const entry = snapshot.docs[0].data();
    return res.json({
      name: entry.name,
      game: entry.game,
      teamName: entry.teamName,
      status: entry.status,
      confirmationCode: entry.confirmationCode,
    });
  })
);

// PATCH /api/registrations/:id/confirm -> admin-only: officially confirm a registrant
app.patch(
  "/api/registrations/:id/confirm",
  requireDb,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = db.collection(REGISTRATIONS_COLLECTION).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Registration not found." });
    }

    const confirmedAt = new Date().toISOString();
    await ref.update({ status: "confirmed", confirmedAt });

    return res.json({
      success: true,
      registration: { id: doc.id, ...doc.data(), status: "confirmed", confirmedAt },
    });
  })
);

// PATCH /api/registrations/:id/unconfirm -> admin-only: revert to pending
app.patch(
  "/api/registrations/:id/unconfirm",
  requireDb,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = db.collection(REGISTRATIONS_COLLECTION).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Registration not found." });
    }

    await ref.update({ status: "pending", confirmedAt: null });

    return res.json({
      success: true,
      registration: { id: doc.id, ...doc.data(), status: "pending", confirmedAt: null },
    });
  })
);

// DELETE /api/registrations/:id -> admin-only: remove a bad/duplicate entry
app.delete(
  "/api/registrations/:id",
  requireDb,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ref = db.collection(REGISTRATIONS_COLLECTION).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Registration not found." });
    }

    await ref.delete();
    return res.json({ success: true });
  })
);

// POST /api/admin/verify -> lets the admin page check a key before showing the dashboard
// (No DB needed here - the key is checked against the env var directly.)
app.post("/api/admin/verify", (req, res) => {
  const { key } = req.body || {};
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Incorrect admin key." });
  }
  return res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`BALLERS backend running at http://localhost:${PORT}`);
});