import Navbar from "@/components/Navbar";
import ScrollSequence from "@/components/ScrollSequence";
import CakeHeadline from "@/components/CakeHeadline";
import CinematicFoodShowcase from "@/components/CinematicFoodShowcase";
import Story from "@/components/Story";
import CakeSequence from "@/components/CakeSequence";
import Hero1Sequence from "@/components/Hero1Sequence";
import Hero2Sequence from "@/components/Hero2Sequence";
import Dishes from "@/components/Dishes";
import Menu from "@/components/Menu";
import Branches from "@/components/Branches";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-[#f5ecd9]">
      {/* Page Preloader */}
      <PageShell />

      {/* Global Navigation */}
      <Navbar />

      {/* Hero: Scroll-Driven Frame Sequence (commented out per request) */}
      {/* <ScrollSequence
        onProgressUpdate={(_, isDone) => {
          if (isDone) setHeroReady(true);
        }}
      /> */}

      {/* Hero 1: Frame sequence */}
      {/* <Hero1Sequence /> */}

      {/* Hero 2: Frame sequence */}
      <Hero2Sequence />

      {/* Section 1: Our Story (About Section directly after Hero) */}
      <Story />

      {/* Section 2: Artisanal Cake Scroll Sequence (Frames 003 to 144) */}
      {/* <CakeSequence /> */}

      {/* Section 3: Cake Headline (temporarily hidden) */}
      {/* <CakeHeadline /> */}

      {/* Section 4: Cake Showcase (temporarily hidden) */}
      {/* <CakeMenu /> */}

      {/* Section 5: Cinematic Signature Showcase */}
      <CinematicFoodShowcase />

      {/* Section 6: Signature Dishes */}
      <Dishes />

      {/* Section 6: The Stone Bakery (temporarily hidden) */}
      {/* <Bakery /> */}

      {/* Section 7: Full Hearth Menu */}
      <Menu />

      {/* Section 8: Why Us (temporarily hidden) */}
      {/* <WhyUs /> */}

      {/* Section 9: Flagship Branches */}
      <Branches />

      {/* Section 10: Gastronomic Reviews */}
      <Reviews />

      {/* Footer */}
      <Footer />
    </main>
  );
}
