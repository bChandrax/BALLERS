import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "registrations.json");

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
  const { name, email, phone, game } = req.body || {};

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
    registeredAt: new Date().toISOString(),
  };

  registrations.push(entry);
  writeRegistrations(registrations);

  return res.status(201).json({ success: true, registration: entry });
});

// GET /api/registrations -> list everyone who registered (simple admin view)
app.get("/api/registrations", (req, res) => {
  const registrations = readRegistrations();
  return res.json(registrations);
});

// GET /api/registrations/count -> quick counts per game
app.get("/api/registrations/count", (req, res) => {
  const registrations = readRegistrations();
  const counts = {};
  for (const game of VALID_GAMES) counts[game] = 0;
  for (const r of registrations) {
    counts[r.game] = (counts[r.game] || 0) + 1;
  }
  return res.json(counts);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`BALLERS backend running at http://localhost:${PORT}`);
});
