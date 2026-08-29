import { useState } from "react";
import "./RegisterForm.css";

const GAMES = [
  { id: "3v3-teams", label: "3v3 Teams Tournament", isTeam: true },
  { id: "three-point", label: "Three-Point Shootout", isTeam: false },
  { id: "half-court", label: "Half Court / Lottery Shot", isTeam: false },
  { id: "girls-3v3", label: "Girls 3v3", isTeam: true },
];

// Change this if your backend runs on a different port/host
const API_URL = "http://localhost:4000/api/register";

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    game: "",
    teamName: "",
    teammates: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const selectedGame = GAMES.find((g) => g.id === form.game);
  const isTeamGame = selectedGame?.isTeam;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setConfirmation(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus("success");
      setMessage("You're registered! Your spot is pending admin confirmation.");
      setConfirmation(data.registration);
      setForm({ name: "", email: "", phone: "", game: "", teamName: "", teammates: "" });
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
            <strong>Status:</strong> Pending — an organizer will confirm your registration
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
      <h2 className="register__heading">Register Now</h2>

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
              />
            </label>

            <label className="register__label">
              Teammates
              <textarea
                className="register__input"
                name="teammates"
                value={form.teammates}
                onChange={handleChange}
                placeholder="Comma-separated names, e.g. Kabo, Naledi, Tumi"
                rows={2}
              />
            </label>
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