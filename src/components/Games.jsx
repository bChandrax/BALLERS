import "./Games.css";

const GAMES = [
  {
    id: "3v3-teams",
    title: "3v3 Teams Tournament",
    description: [
      { id: 1, desc: "Registration per team: P200" },
      { id: 2, desc: "Top Prize: P1,250" },
      { id: 3, desc: "Second Place: P500" },
      { id: 4, desc: "4 players per team" },
    ],
  },
  {
    id: "three-point",
    title: "Three-Point Shootout",
    description: [
      { id: 1, desc: "Registration: P50 per participant" },
      { id: 2, desc: "Top Prize: P500" },
      { id: 3, desc: "Highest scoring participants advancing to the final round" },
    ],
  },
  {
    id: "half-court",
    title: "Half Court / Lottery Shot",
    description: [
      { id: 1, desc: "Registration fee: P20" },
      { id: 2, desc: "Prize: P300" },
    ],
  },
  {
    id: "girls-3v3",
    title: "Girls 3v3",
    description: [
      { id: 1, desc: "Free Registration per team" },
      { id: 2, desc: "Top Prize: P300" },
      { id: 3, desc: "4 players per team" },
    ]
  },
];

export default function Games() {
  return (
    <section id="games" className="games">
      <h2 className="games__heading">Our Games</h2>

      <div className="games__grid">
        {GAMES.map((game) => (
          <article
            key={game.id}
            className={`games__card${game.featured ? " games__card--featured" : ""}`}
          >
            <h3 className="games__card-title">{game.title}</h3>
            <div className="games__card-body">
              {game.description.map((point) => (
                <p key={point.id}>{point.desc}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}