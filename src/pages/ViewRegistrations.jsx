import { useEffect, useState } from "react";
import "./ViewRegistrations.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const GAME_ORDER = ["3v3-teams", "girls-3v3", "three-point", "half-court"];

const GAME_LABELS = {
  "3v3-teams": "3v3 Teams Tournament",
  "three-point": "Three-Point Shootout",
  "half-court": "Half Court / Lottery Shot",
  "girls-3v3": "Girls 3v3",
};

const TEAM_GAMES = new Set(["3v3-teams", "girls-3v3"]);

export default function ViewRegistrations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/registrations/public`);
      if (!res.ok) throw new Error("Could not load registrations.");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="view-reg">
      <h1 className="view-reg__heading">Registered Players &amp; Teams</h1>
      <p className="view-reg__subtitle">
        "Verified" means the spot has been paid for and officially confirmed by an organizer.
      </p>

      {loading && <p>Loading...</p>}
      {error && <p className="view-reg__error">{error}</p>}

      {!loading &&
        !error &&
        GAME_ORDER.map((gameId) => {
          const entries = data?.[gameId] || [];
          const isTeamGame = TEAM_GAMES.has(gameId);

          return (
            <section className="view-reg__section" key={gameId}>
              <h2 className="view-reg__game-title">{GAME_LABELS[gameId]}</h2>

              {entries.length === 0 ? (
                <p className="view-reg__empty">No registrations yet.</p>
              ) : (
                <table className="view-reg__table">
                  <thead>
                    <tr>
                      <th>{isTeamGame ? "Team" : "Name"}</th>
                      {isTeamGame && <th>Members</th>}
                      <th>Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{isTeamGame ? entry.teamName || "(unnamed team)" : entry.name}</td>
                        {isTeamGame && (
                          <td>
                            {entry.teammates?.length ? entry.teammates.join(", ") : "—"}
                          </td>
                        )}
                        <td className={entry.verified ? "view-reg__yes" : "view-reg__no"}>
                          {entry.verified ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
    </div>
  );
}