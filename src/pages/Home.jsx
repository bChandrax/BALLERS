import TopNav from "../components/TopNav";
import Hero from "../components/Hero";
import Games from "../components/Games";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="Home">
      <TopNav />
      <Hero />
      <Games />
      <Footer />
    </div>
  );
}