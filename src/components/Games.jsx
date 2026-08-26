import "./Games.css";

const GAMES = [
  {
    id: "3v3-teams",
    title: "3v3 Teams Tournament",
    description: "Full squads battle it out, single elimination, first to 21.",
  },
  {
    id: "three-point",
    title: "Three-Point Shootout",
    description: "60 seconds, 5 racks, one shooter to rule them all.",
  },
  {
    id: "half-court",
    title: "Half Court / Lottery Shot",
    description: "One shot from the logo. Miss the crowd, make the highlight.",
  },
  {
    id: "girls-3v3",
    title: "Girls 3v3",
    description: "The women's bracket, same court, same stakes.",
    featured: true,
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
              <p>{game.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
