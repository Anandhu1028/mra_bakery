"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, Sparkles } from "lucide-react";
import {
  usePrefersReducedMotion,
  useSmoothScroll,
} from "@/context/SmoothScrollContext";

const words = ["Cakes", "worth", "slowing", "down", "for."];

const facts = [
  { title: "6 signatures", sub: "Handcrafted recipes" },
  { title: "Baked daily", sub: "Slow stone ovens" },
  { title: "Made to order, ready in 24 hours", sub: "Celebration-ready" },
];

export default function CakeHeadline() {
  const { scrollTo } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef(null);
  const [hasEntered, setHasEntered] = useState(false);
  const isRevealed = hasEntered || prefersReducedMotion;

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const section = sectionRef.current;
    if (!section) return undefined;

    if (!("IntersectionObserver" in window)) {
      setHasEntered(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const handleExploreClick = (e) => {
    e.preventDefault();
    scrollTo("#cake-menu", {
      duration: prefersReducedMotion ? 0 : 1,
      immediate: prefersReducedMotion,
    });
  };

  return (
    <section
      ref={sectionRef}
      id="cake-headline"
      aria-label="Cakes collection showcase"
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-black px-6 py-16 text-[#f5ecd9] sm:px-12 lg:px-20"
    >
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-[min(80vw,750px)] w-[min(80vw,750px)] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(200, 91, 47, 0.18) 0%, rgba(212, 162, 76, 0.06) 45%, transparent 72%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(225, 29, 46, 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Column: Text & Facts (7 cols on lg) */}
        <div className="lg:col-span-7 text-left">
         

          {/* Large Playfair Display headline */}
          <h1
            className="font-serif text-[clamp(2.75rem,6.5vw,5.8rem)] font-normal leading-[1.04] tracking-[-0.035em] text-[#f5ecd9]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            <span className="block">
              {words.slice(0, 2).map((word, i) => (
                <React.Fragment key={word}>
                  <span
                    className={`cake-headline-word ${isRevealed ? "is-revealed" : ""}`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  >
                    {word}
                  </span>{" "}
                </React.Fragment>
              ))}
            </span>
            <span className="block">
              {words.slice(2).map((word, i) => (
                <React.Fragment key={word}>
                  <span
                    className={`cake-headline-word ${isRevealed ? "is-revealed" : ""} ${
                      word === "slowing" || word === "down" ? "text-[#ef4444]" : ""
                    }`}
                    style={{ animationDelay: `${(i + 2) * 0.12}s` }}
                  >
                    {word}
                  </span>
                  {i < 2 ? " " : null}
                </React.Fragment>
              ))}
            </span>
          </h1>

          {/* Short paragraph */}
          <p
            className={`mt-6 max-w-xl text-base sm:text-lg font-light leading-relaxed text-[#f5ecd9]/80 transition-all duration-1000 delay-500 ${
              isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Six signature cakes, baked each morning in our own ovens and finished by hand. Pick a flavour, tap a detail, and see what goes into every slice.
          </p>

          {/* Three small facts in a row, each with a thin gold top line */}
          <div
            className={`mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-xl transition-all duration-1000 delay-700 ${
              isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {facts.map((fact, index) => (
              <div key={index} className="pt-3.5 border-t border-[#d4a24c]/40">
                <p className="font-serif text-sm sm:text-base font-normal text-[#d4a24c]">
                  {fact.title}
                </p>
                <p className="text-[10px] text-[#f5ecd9]/50 mt-0.5 uppercase tracking-wider font-mono">
                  {fact.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Gold pill button "Explore the cakes" */}
          <div
            className={`mt-8 sm:mt-10 flex items-center gap-4 transition-all duration-1000 delay-900 ${
              isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a
              href="#cake-menu"
              onClick={handleExploreClick}
              aria-label="Explore the signature cakes"
              className="group inline-flex items-center gap-3 rounded-full bg-[#d4a24c] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-black shadow-lg shadow-[#d4a24c]/20 transition-all hover:bg-[#e2bd77] hover:shadow-xl hover:shadow-[#d4a24c]/30 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4a24c]"
            >
              <span>Explore the cakes</span>
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
          </div>
        </div>

        {/* Right Column: Real Cake Image Perfectly Blended (5 cols on lg) */}
        <div
          className={`relative lg:col-span-5 flex items-center justify-center transition-all duration-1000 delay-300 ${
            isRevealed ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Ambient Warm Golden Glow behind cake */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[12%] rounded-full blur-3xl opacity-75"
            style={{
              background:
                "radial-gradient(circle, rgba(212, 162, 76, 0.35) 0%, rgba(200, 91, 47, 0.15) 45%, transparent 70%)",
            }}
          />

          {/* Soft Ground Shadow under cake */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-4 inset-x-[15%] h-12 rounded-full blur-xl opacity-80"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 75%)",
            }}
          />

          {/* Floating Cake Container */}
          <div className="relative aspect-square w-full max-w-[460px] animate-romantic-cake-float">
            <Image
              src="/romantic-cake-whole.png"
              alt="MRA Signature Handcrafted Cake"
              fill
              sizes="(max-width: 1024px) 80vw, 460px"
              priority
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)]"
              style={{
                WebkitMaskImage:
                  "radial-gradient(closest-side, #000 84%, transparent 100%)",
                maskImage:
                  "radial-gradient(closest-side, #000 84%, transparent 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
