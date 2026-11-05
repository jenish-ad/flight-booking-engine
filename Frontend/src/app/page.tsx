import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import Hero from "../components/home/hero";
import Destinations from "../components/home/destinations";
import About from "../components/home/about";
import IntroMotion from "../components/home/intro-motion";

export default function Home() {
  return (
    <IntroMotion>
      <Navbar />
      <main>
        <Hero />
        <Destinations />
        <About />
      </main>
      <Footer />
    </IntroMotion>
  );
}
