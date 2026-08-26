import TopNav from "./components/TopNav";
import Hero from "./components/Hero";
import Games from "./components/Games";
import Footer from "./components/Footer";
import "./index.css";

export default function App() {
  return (
    <div className="app">
      <TopNav />
      <Hero />
      <Games />
      <Footer />
    </div>
  );
}
