import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <span className="footer__logo">Ballers</span>
      <span className="footer__credit">
        &copy;{year} by the BIUST Innovation Club
      </span>
    </footer>
  );
}
