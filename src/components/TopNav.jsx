import "./TopNav.css";

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
        <a href="#register" className="topnav__cta">
          Register Now
        </a>
      </nav>
    </header>
  );
}
