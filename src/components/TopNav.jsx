import "./TopNav.css";
import { Link } from "react-router-dom";

export default function TopNav() {
  return (
    <header className="topnav">
      <a href="#hero" className="topnav__logo">
        Ballers
      </a>

      <nav className="topnav__nav" aria-label="Primary">
        <a href="#games" className="topnav__link">
          Games
        </a>
        <Link to="/form" className="topnav__cta">
          Register
        </Link>
      </nav>
    </header>
  );
}