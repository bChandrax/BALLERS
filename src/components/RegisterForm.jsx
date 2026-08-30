import { useState } from "react";

const GAMES = [
  { id: "3v3-teams", label: "3v3 Teams Tournament", isTeam: true },
  { id: "three-point", label: "Three-Point Shootout", isTeam: false },
  { id: "half-court", label: "Half Court / Lottery Shot", isTeam: false },
  { id: "girls-3v3", label: "Girls 3v3", isTeam: true },
];

const TEAM_SIZE = 4;

// Reads from VITE_API_BASE (set in .env locally, and in the
// Vercel dashboard for production). Falls back to localhost for
// local dev if the env var isn't set.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const API_URL = `${API_BASE}/register`;

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    game: "",
    teamName: "",
  });
  const [members, setMembers] = useState(Array(TEAM_SIZE).fill(""));
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const selectedGame = GAMES.find((g) => g.id === form.game);
  const isTeamGame = selectedGame?.isTeam;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleMemberChange(index, value) {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setConfirmation(null);

    const filledMembers = members.map((m) => m.trim()).filter(Boolean);

    if (isTeamGame && filledMembers.length !== TEAM_SIZE) {
      setStatus("error");
      setMessage(`Please enter all ${TEAM_SIZE} team member names.`);
      return;
    }

    const payload = {
      ...form,
      teammates: isTeamGame ? filledMembers.join(", ") : "",
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus("success");
      setMessage("You're registered! Your spot is pending admin confirmation.");
      setConfirmation(data.registration);
      setForm({ name: "", email: "", phone: "", game: "", teamName: "" });
      setMembers(Array(TEAM_SIZE).fill(""));
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Could not reach the server.");
    }
  }

  if (status === "success" && confirmation) {
    return (
      <section id="register" className="register">
        <h2 className="register__heading">You're In!</h2>
        <div className="register__confirmation">
          <p>{message}</p>
          <p>
            <strong>Confirmation code:</strong> {confirmation.confirmationCode}
          </p>
          <p>
            <strong>Name:</strong> {confirmation.name}
          </p>
          {confirmation.teamName && (
            <p>
              <strong>Team:</strong> {confirmation.teamName}
            </p>
          )}
          <p>
            <strong>Status:</strong> Pending — an organizer will verify your payment/spot
            before the event.
          </p>
          <p>Save your confirmation code, you may be asked for it at check-in.</p>
          <button
            className="register__submit"
            type="button"
            onClick={() => {
              setStatus("idle");
              setConfirmation(null);
              setMessage("");
            }}
          >
            Register Another
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="register">
      <h2 className="register__heading">Registeration</h2>

      <form className="register__form" onSubmit={handleSubmit}>
        <label className="register__label">
          {isTeamGame ? "Captain / Contact Name" : "Full Name"}
          <input
            className="register__input"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="register__label">
          Email
          <input
            className="register__input"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
        </label>

        <label className="register__label">
          Phone
          <input
            className="register__input"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
        </label>

        <label className="register__label">
          Game
          <select
            className="register__input"
            name="game"
            value={form.game}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select a game
            </option>
            {GAMES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        {isTeamGame && (
          <>
            <label className="register__label">
              Team Name
              <input
                className="register__input"
                type="text"
                name="teamName"
                value={form.teamName}
                onChange={handleChange}
                placeholder="e.g. Court Kings"
                required
              />
            </label>

            <fieldset className="register__team-members">
              <legend>Team Members (all {TEAM_SIZE} required)</legend>
              {members.map((member, i) => (
                <label className="register__label" key={i}>
                  Player {i + 1}
                  <input
                    className="register__input"
                    type="text"
                    value={member}
                    onChange={(e) => handleMemberChange(i, e.target.value)}
                    required
                  />
                </label>
              ))}
            </fieldset>
          </>
        )}

        <button className="register__submit" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Submitting..." : "Register"}
        </button>

        {status === "error" && message && (
          <p className="register__message register__message--error">{message}</p>
        )}
      </form>
    </section>
  );
}