"use client";

import React, { useCallback, useEffect, useState } from "react";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import ScrollSequence from "@/components/ScrollSequence";
import CakeHeadline from "@/components/CakeHeadline";
import CinematicFoodShowcase from "@/components/CinematicFoodShowcase";
import Story from "@/components/Story";
import CakeSequence from "@/components/CakeSequence";
import CakeSequence2 from "@/components/CakeSequence2";
import Dishes from "@/components/Dishes";
import Menu from "@/components/Menu";
import Branches from "@/components/Branches";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";

export default function Home() {
  const [heroReady, setHeroReady] = useState(false);
  const [preloaderFinished, setPreloaderFinished] = useState(false);
  const handlePreloaderComplete = useCallback(
    () => setPreloaderFinished(true),
    []
  );

  useEffect(() => {
    // Safety fallback so preloader finishes even on slow networks
    const timer = setTimeout(() => setHeroReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen bg-black text-[#f5ecd9] overflow-x-clip">
      {/* Cinematic Brand Preloader */}
      {!preloaderFinished && (
        <Preloader
          heroReady={heroReady}
          onComplete={handlePreloaderComplete}
        />
      )}

      {/* Global Navigation */}
      <Navbar />

      {/* Hero: Scroll-Driven Frame Sequence (commented out per request) */}
      {/* <ScrollSequence
        onProgressUpdate={(_, isDone) => {
          if (isDone) setHeroReady(true);
        }}
      /> */}

      {/* 1st Section: Artisanal Cake Track 2 (caketrack2 frames) */}
      <CakeSequence2
        onProgressUpdate={(_, isDone) => {
          if (isDone) setHeroReady(true);
        }}
      />

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
