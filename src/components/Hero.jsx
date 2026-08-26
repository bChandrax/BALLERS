import "./Hero.css";

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__scrim" aria-hidden="true" />

      <div className="hero__content">
        <h1 className="hero__title">Ballers</h1>

        <div className="hero__meta">
          <div className="hero__meta-box">
            <span className="hero__meta-label">Date</span>
            <span className="hero__meta-value">
              26<br />
              September
            </span>
          </div>
          <div className="hero__meta-box">
            <span className="hero__meta-label">Time</span>
            <span className="hero__meta-value">
              0800-
              <br />
              1830hrs
            </span>
          </div>
        </div>

        <div className="hero__org">
          <span>MPH</span>
        </div>
      </div>
    </section>
  );
}
