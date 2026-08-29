import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "registrations.json");

// -----------------------------------------------------------------------
// CHANGE THIS before you deploy anywhere real. This is the passcode the
// admin page asks for. You can also set it via an ADMIN_KEY environment
// variable instead of editing this file (env var wins if set).
// -----------------------------------------------------------------------
const ADMIN_KEY = process.env.ADMIN_KEY || "ballers-admin-2026";

// Make sure the data folder + file exist before we try to use them
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readRegistrations() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeRegistrations(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
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
app.post("/api/register", (req, res) => {
  const { name, email, phone, game, teamName, teammates } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!game || !VALID_GAMES.includes(game)) {
    return res.status(400).json({ error: "A valid game selection is required." });
  }

  const registrations = readRegistrations();

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
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

  registrations.push(entry);
  writeRegistrations(registrations);

  return res.status(201).json({ success: true, registration: entry });
});

// GET /api/registrations -> admin-only: full list with contact details
app.get("/api/registrations", requireAdmin, (req, res) => {
  const registrations = readRegistrations();
  registrations.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  return res.json(registrations);
});

// GET /api/registrations/count -> public: quick counts per game (no personal info)
app.get("/api/registrations/count", (req, res) => {
  const registrations = readRegistrations();
  const counts = {};
  for (const game of VALID_GAMES) counts[game] = { pending: 0, confirmed: 0 };
  for (const r of registrations) {
    if (!counts[r.game]) counts[r.game] = { pending: 0, confirmed: 0 };
    counts[r.game][r.status] = (counts[r.game][r.status] || 0) + 1;
  }
  return res.json(counts);
});

// GET /api/registrations/lookup/:code -> public: a registrant can check their own status
app.get("/api/registrations/lookup/:code", (req, res) => {
  const registrations = readRegistrations();
  const entry = registrations.find(
    (r) => r.confirmationCode.toLowerCase() === req.params.code.toLowerCase()
  );
  if (!entry) {
    return res.status(404).json({ error: "No registration found with that code." });
  }
  return res.json({
    name: entry.name,
    game: entry.game,
    teamName: entry.teamName,
    status: entry.status,
    confirmationCode: entry.confirmationCode,
  });
});

// PATCH /api/registrations/:id/confirm -> admin-only: officially confirm a registrant
app.patch("/api/registrations/:id/confirm", requireAdmin, (req, res) => {
  const registrations = readRegistrations();
  const entry = registrations.find((r) => r.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "Registration not found." });
  }
  entry.status = "confirmed";
  entry.confirmedAt = new Date().toISOString();
  writeRegistrations(registrations);
  return res.json({ success: true, registration: entry });
});

// PATCH /api/registrations/:id/unconfirm -> admin-only: revert to pending
app.patch("/api/registrations/:id/unconfirm", requireAdmin, (req, res) => {
  const registrations = readRegistrations();
  const entry = registrations.find((r) => r.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "Registration not found." });
  }
  entry.status = "pending";
  entry.confirmedAt = null;
  writeRegistrations(registrations);
  return res.json({ success: true, registration: entry });
});

// DELETE /api/registrations/:id -> admin-only: remove a bad/duplicate entry
app.delete("/api/registrations/:id", requireAdmin, (req, res) => {
  const registrations = readRegistrations();
  const next = registrations.filter((r) => r.id !== req.params.id);
  if (next.length === registrations.length) {
    return res.status(404).json({ error: "Registration not found." });
  }
  writeRegistrations(next);
  return res.json({ success: true });
});

// POST /api/admin/verify -> lets the admin page check a key before showing the dashboard
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