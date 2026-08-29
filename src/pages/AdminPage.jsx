import { useEffect, useState } from "react";
import "./AdminPage.css";

const API_BASE = "http://localhost:4000/api";

const GAME_LABELS = {
  "3v3-teams": "3v3 Teams Tournament",
  "three-point": "Three-Point Shootout",
  "half-court": "Half Court / Lottery Shot",
  "girls-3v3": "Girls 3v3",
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("ballersAdminKey") || "");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function verifyKey(key) {
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Incorrect key.");
      }
      sessionStorage.setItem("ballersAdminKey", key);
      setAdminKey(key);
      setAuthed(true);
    } catch (err) {
      setAuthError(err.message);
      setAuthed(false);
    }
  }

  // If a key is already saved in this browser session, try it automatically.
  useEffect(() => {
    if (adminKey) verifyKey(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRegistrations() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) {
        throw new Error("Could not load registrations. Check your admin key.");
      }
      const data = await res.json();
      setRegistrations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function handleConfirm(id) {
    await fetch(`${API_BASE}/registrations/${id}/confirm`, {
      method: "PATCH",
      headers: { "x-admin-key": adminKey },
    });
    loadRegistrations();
  }

  async function handleUnconfirm(id) {
    await fetch(`${API_BASE}/registrations/${id}/unconfirm`, {
      method: "PATCH",
      headers: { "x-admin-key": adminKey },
    });
    loadRegistrations();
  }

  async function handleDelete(id) {
    if (!confirm("Remove this registration? This cannot be undone.")) return;
    await fetch(`${API_BASE}/registrations/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });
    loadRegistrations();
  }

  function handleLogout() {
    sessionStorage.removeItem("ballersAdminKey");
    setAdminKey("");
    setAuthed(false);
    setRegistrations([]);
  }

  if (!authed) {
    return (
      <div className="admin admin--gate">
        <h1>Admin Login</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyKey(keyInput);
          }}
        >
          <input
            type="password"
            placeholder="Admin key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button type="submit">Enter</button>
        </form>
        {authError && <p className="admin__error">{authError}</p>}
      </div>
    );
  }

  const filtered = registrations.filter((r) => {
    const matchesGame = gameFilter === "all" || r.game === gameFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.teamName.toLowerCase().includes(q) ||
      r.confirmationCode.toLowerCase().includes(q);
    return matchesGame && matchesSearch;
  });

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const confirmedCount = registrations.filter((r) => r.status === "confirmed").length;

  return (
    <div className="admin">
      <div className="admin__header">
        <h1>Registrations</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>

      <div className="admin__summary">
        <span>Total: {registrations.length}</span>
        <span>Pending: {pendingCount}</span>
        <span>Confirmed: {confirmedCount}</span>
      </div>

      <div className="admin__controls">
        <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
          <option value="all">All games</option>
          {Object.entries(GAME_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search name, team, or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={loadRegistrations}>Refresh</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="admin__error">{error}</p>}

      {!loading && filtered.length === 0 && <p>No registrations match.</p>}

      {!loading && filtered.length > 0 && (
        <table className="admin__table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Team</th>
              <th>Teammates</th>
              <th>Game</th>
              <th>Contact</th>
              <th>Code</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={`admin__row admin__row--${r.status}`}>
                <td>{r.status}</td>
                <td>{r.name}</td>
                <td>{r.teamName || "—"}</td>
                <td>{r.teammates?.length ? r.teammates.join(", ") : "—"}</td>
                <td>{GAME_LABELS[r.game] || r.game}</td>
                <td>
                  {r.email || "—"}
                  {r.phone ? ` / ${r.phone}` : ""}
                </td>
                <td>{r.confirmationCode}</td>
                <td>{new Date(r.registeredAt).toLocaleString()}</td>
                <td className="admin__actions">
                  {r.status === "pending" ? (
                    <button onClick={() => handleConfirm(r.id)}>Confirm</button>
                  ) : (
                    <button onClick={() => handleUnconfirm(r.id)}>Unconfirm</button>
                  )}
                  <button onClick={() => handleDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}