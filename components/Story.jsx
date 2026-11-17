"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { STORY_CONTENT } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { useSmoothScroll } from "@/context/SmoothScrollContext";
import { Sparkles } from "lucide-react";

export default function Story() {
  const { t } = useApp();
  const { scrollTo } = useSmoothScroll();
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToCake = () => {
    const el = document.getElementById("cake-track") || document.getElementById("menu");
    if (el) scrollTo(el);
  };

  return (
    <section
      ref={sectionRef}
      id="story"
      className="relative w-full py-28 md:py-36 bg-black text-[#fff8ed] overflow-hidden bg-mashrabiya"
    >
      {/* Subtle ambient glow top right & bottom left */}
      <div className="absolute top-0 end-0 w-96 h-96 bg-[#ef4444]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 start-0 w-80 h-80 bg-[#ffffff]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Big Serif Statement & Brand Story */}
          <div
            className={`lg:col-span-7 transition-all duration-1000 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            

            {/* Main Statement */}
            <h2
              className="text-[#fff8ed] tracking-wide leading-[1.05] mb-8 uppercase"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.4rem, 7vw, 5.5rem)",
              }}
            >
              {t(STORY_CONTENT.heading)}{" "}
              <span className="text-red-400">{STORY_CONTENT.heading.highlight}</span>
            </h2>

            {/* Paragraphs */}
            <div className="space-y-5 text-base sm:text-lg text-[#fff8ed] font-light leading-relaxed">
              {STORY_CONTENT.paragraphs.en.map((p, idx) => (
                <p key={idx} className="relative ps-4 border-s border-[#ef4444]/40">
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Right Column: Romantic Level Cake Cinematic Animation */}
          <div
            className={`lg:col-span-5 transition-all duration-1000 delay-200 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <div
              onClick={scrollToCake}
              className="relative flex flex-col items-center justify-center min-h-[400px] sm:min-h-[480px] lg:min-h-[530px] cursor-pointer group select-none"
            >
              {/* Layer 1: Dreamy Romantic Ambient Halo — Soft Ruby Rose & Candlelight Gold */}
              <div
                className="absolute w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full pointer-events-none animate-romantic-glow"
                style={{
                  background:
                    "radial-gradient(circle, rgba(244,63,94,0.22) 0%, rgba(255, 255, 255,0.18) 38%, rgba(239, 68, 68,0.08) 60%, rgba(0,0,0,0) 78%)",
                  filter: "blur(42px)",
                }}
              />

              {/* Layer 2: Core Candle Warmth Glow */}
              <div
                className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,220,160,0.2) 0%, rgba(244,63,94,0.1) 50%, rgba(0,0,0,0) 80%)",
                  filter: "blur(26px)",
                }}
              />

              {/* Layer 3: Realistic Floating Ground Shadow with Breathing Compression */}
              <div
                className="absolute bottom-6 sm:bottom-8 w-52 sm:w-72 h-8 rounded-[100%] pointer-events-none animate-cake-shadow"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.65) 55%, transparent 80%)",
                  filter: "blur(9px)",
                }}
              />

              {/* Drifting Rose Petals & Golden Stardust */}
              <div
                className="absolute bottom-16 start-6 w-3 h-4 rounded-full bg-gradient-to-br from-rose-500 to-rose-900 animate-petal-drift pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)] opacity-80"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="absolute bottom-20 end-8 w-2.5 h-3.5 rounded-full bg-gradient-to-br from-pink-400 to-rose-700 animate-petal-drift pointer-events-none shadow-[0_0_8px_rgba(251,113,133,0.6)] opacity-70"
                style={{ animationDelay: "2.4s" }}
              />
              <div
                className="absolute top-16 end-14 w-2 h-2 rounded-full bg-[#ffffff] animate-sparkle-drift pointer-events-none shadow-[0_0_12px_#ffffff]"
                style={{ animationDelay: "1.1s" }}
              />
              <div
                className="absolute top-28 start-10 w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-sparkle-drift pointer-events-none shadow-[0_0_10px_#ef4444]"
                style={{ animationDelay: "3.2s" }}
              />

              {/* Layer 4: Cinematic Cake Levitation Container */}
              <div className="relative z-10 w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] aspect-square flex items-center justify-center animate-romantic-cake-float transition-transform duration-700 ease-out group-hover:scale-105">
                {/* State A: Whole Romantic Cake (Smoothly transitions) */}
                <div className="absolute inset-0 flex items-center justify-center animate-romantic-whole">
                  <Image
                    src="/romantic-cake-whole.png"
                    alt="MRA Romantic Luxury Celebration Cake"
                    width={820}
                    height={820}
                    priority
                    className="w-full h-full object-contain filter drop-shadow-[0_25px_40px_rgba(0,0,0,0.95)] drop-shadow-[0_10px_30px_rgba(244,63,94,0.25)]"
                  />
                </div>

                {/* State B: Sliced Romantic Cake (Slice smoothly glides outward revealing layers) */}
                <div className="absolute inset-0 flex items-center justify-center animate-romantic-sliced">
                  <Image
                    src="/romantic-cake-sliced.png"
                    alt="MRA Romantic Cake with Fresh Cut Slice"
                    width={820}
                    height={820}
                    priority
                    className="w-full h-full object-contain filter drop-shadow-[0_25px_40px_rgba(0,0,0,0.95)] drop-shadow-[0_12px_35px_rgba(255,255,255,0.28)]"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
