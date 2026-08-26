import { useState } from "react";
import "./RegisterForm.css";

const GAMES = [
  { id: "3v3-teams", label: "3v3 Teams Tournament" },
  { id: "three-point", label: "Three-Point Shootout" },
  { id: "half-court", label: "Half Court / Lottery Shot" },
  { id: "girls-3v3", label: "Girls 3v3" },
];

// Change this if your backend runs on a different port/host
const API_URL = "http://localhost:4000/api/register";

export default function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", game: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

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
      setMessage("You're registered! See you on the court.");
      setForm({ name: "", email: "", phone: "", game: "" });
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Could not reach the server.");
    }
  }

  return (
    <section id="register" className="register">
      <h2 className="register__heading">Register Now</h2>

      <form className="register__form" onSubmit={handleSubmit}>
        <label className="register__label">
          Full Name
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

        <button className="register__submit" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Submitting..." : "Register"}
        </button>

        {message && (
          <p className={`register__message register__message--${status}`}>{message}</p>
        )}
      </form>
    </section>
  );
}
