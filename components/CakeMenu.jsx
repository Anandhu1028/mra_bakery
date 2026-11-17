"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  Layers,
  Cookie,
  Cherry,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  usePrefersReducedMotion,
  useSmoothScroll,
} from "@/context/SmoothScrollContext";
import { CAKES_DATA, CAKE_SIZES } from "@/lib/cakes";

const CAKE_COUNT = CAKES_DATA.length;

const ICONS_MAP = {
  Sparkles,
  Layers,
  Cookie,
  Cherry,
  Heart,
};

function getHighlightIcon(name) {
  return ICONS_MAP[name] || Sparkles;
}

export default function CakeMenu() {
  const { markImagesReady, scrollTo } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();

  const trackRef = useRef(null);
  const progressBarRef = useRef(null);
  const imageRefs = useRef([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const activeCake = CAKES_DATA[activeIndex] || CAKES_DATA[0];
  const activeHighlight =
    activeCake.highlights?.[activeHighlightIndex] || activeCake.highlights?.[0];
  const ActiveIcon = getHighlightIcon(activeHighlight.icon);

  // Preload and decode all 6 photos on mount
  useEffect(() => {
    imageRefs.current.forEach(async (img) => {
      if (img && img.decode) {
        try {
          await img.decode();
        } catch {
          // ignore already decoded images
        }
      }
    });
    if (markImagesReady) {
      markImagesReady("cake-menu");
    }
  }, [markImagesReady]);

  // GSAP ScrollTrigger timeline across the 700vh track
  useEffect(() => {
    if (prefersReducedMotion) {
      imageRefs.current.forEach((img, idx) => {
        if (!img) return;
        img.style.opacity = idx === activeIndex ? "1" : "0";
        img.style.transform = "none";
      });
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);
    const track = trackRef.current;
    if (!track) return undefined;

    const ctx = gsap.context(() => {
      // Set initial positions: first cake visible, rest invisible and prepped
      imageRefs.current.forEach((img, idx) => {
        if (!img) return;
        if (idx === 0) {
          gsap.set(img, { opacity: 1, scale: 1, x: 0 });
        } else {
          gsap.set(img, { opacity: 0, scale: 1.04, x: 30 });
        }
      });

      // Master scrubbed timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          snap: {
            snapTo: 1 / (CAKE_COUNT - 1),
            duration: { min: 0.15, max: 0.35 },
            ease: "power1.inOut",
          },
          onUpdate: (self) => {
            // Update thin white progress bar
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`;
            }

            // Map progress to active cake index (0 to 5)
            const rawIdx = Math.min(
              Math.floor(self.progress * CAKE_COUNT),
              CAKE_COUNT - 1
            );
            setActiveIndex((prev) => {
              if (prev !== rawIdx) {
                setActiveHighlightIndex(0); // reset highlight on cake switch
                return rawIdx;
              }
              return prev;
            });
          },
        },
      });

      // Construct smooth crossfades between neighboring photos
      // Total duration = CAKE_COUNT - 1
      const totalSteps = CAKE_COUNT - 1;
      for (let i = 0; i < totalSteps; i++) {
        const currentImg = imageRefs.current[i];
        const nextImg = imageRefs.current[i + 1];

        // Fade out current photo
        tl.to(
          currentImg,
          {
            opacity: 0,
            scale: 0.98,
            x: -20,
            ease: "power2.inOut",
            duration: 0.5,
          },
          i + 0.5
        );

        // Fade in next photo: opacity 0 -> 1, scale 1.04 -> 1, x: 30 -> 0
        tl.fromTo(
          nextImg,
          { opacity: 0, scale: 1.04, x: 30 },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            ease: "power2.inOut",
            duration: 0.5,
          },
          i + 0.5
        );
      }
    }, trackRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // Jump to specific cake using lenis scrollTo
  const jumpToCake = (index) => {
    if (!trackRef.current) return;
    const scrollTarget =
      trackRef.current.offsetTop +
      (index / (CAKE_COUNT - 1)) *
        (trackRef.current.offsetHeight - window.innerHeight);

    scrollTo(scrollTarget, {
      duration: prefersReducedMotion ? 0 : 0.8,
      immediate: prefersReducedMotion,
    });
  };

  // Split name for Playfair display: all words cream, last word italic
  const nameParts = useMemo(() => {
    const words = activeCake.name.split(" ");
    return {
      first: words.slice(0, -1).join(" "),
      last: words[words.length - 1],
    };
  }, [activeCake.name]);

  return (
    <section
      ref={trackRef}
      id="cake-menu"
      aria-label="Artisanal Cake Showcase"
      className="relative w-full bg-[#050505] text-[#f5ecd9]"
      style={{ height: "700vh" }}
    >
      <style jsx>{`
        @keyframes cardSwapFade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-card-swap {
          animation: cardSwapFade 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Sticky Stage 100svh */}
      <div className="sticky top-0 flex h-[100svh] w-full flex-col justify-between overflow-hidden bg-[#050505] px-4 py-3 sm:px-8 sm:py-5 lg:px-12 lg:py-5 select-none">
        {/* Top: Thin white Progress Bar */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-40 h-[2px] bg-white/10"
        >
          <div
            ref={progressBarRef}
            className="h-full bg-white transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(255,255,255,0.65)]"
            style={{ width: "0%" }}
          />
        </div>

        {/* Top Header: Title & Counter "02 / 06" */}
        <div className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between pt-1 sm:pt-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#a79886]">
              Signature Confectionery
            </span>
          </div>
          <div
            aria-live="polite"
            className="font-sans text-xs sm:text-sm font-medium tracking-[0.15em] text-white"
          >
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(CAKE_COUNT).padStart(2, "0")}
          </div>
        </div>

        {/* Main Stage Grid (Desktop: Left ~62% photo, Right ~38% Card) */}
        <div className="relative z-20 mx-auto my-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(380px,440px)] lg:gap-12">
          {/* ================= LEFT (~62% WIDTH): CAKE PHOTO WITH FADED EDGES ================= */}
          <div className="relative flex aspect-[16/10] sm:aspect-[16/10] w-full max-h-[38svh] sm:max-h-[46svh] lg:max-h-[64svh] items-center justify-center">
            {/* Ambient soft glow behind photo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[15%] rounded-full blur-3xl opacity-25"
              style={{
                background:
                  "radial-gradient(circle, #e11d2e 0%, transparent 70%)",
              }}
            />

            {/* Edge fade mask: radial-gradient feathered fade */}
            <div
              className="relative h-full w-full overflow-hidden"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse 90% 86% at 40% 48%, #000 45%, rgba(0,0,0,0.4) 75%, transparent 100%)",
                maskImage:
                  "radial-gradient(ellipse 90% 86% at 40% 48%, #000 45%, rgba(0,0,0,0.4) 75%, transparent 100%)",
              }}
            >
              {/* Soft edge blending vignettes */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-transparent via-transparent to-[#050505]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#050505] via-transparent to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-[#050505]/50 via-transparent to-transparent"
              />

              {CAKES_DATA.map((cake, index) => (
                <div
                  key={cake.id}
                  ref={(el) => {
                    imageRefs.current[index] = el;
                  }}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    opacity: index === 0 ? 1 : 0,
                    transform:
                      index === 0
                        ? "none"
                        : "scale(1.04) translateX(30px)",
                    willChange: "opacity, transform",
                  }}
                >
                  <Image
                    src={cake.photo}
                    alt={cake.name}
                    width={1600}
                    height={1000}
                    quality={85}
                    sizes="(max-width: 900px) 100vw, 62vw"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="h-full w-full object-cover object-center pointer-events-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT: DETAIL CARD & TOP-RIGHT SOFT SWOOSH ================= */}
          <div className="relative z-30 flex justify-center lg:justify-end">
            {/* Top Right: Soft white decorative swoosh behind card */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute -top-14 -right-16 w-[120%] max-w-[540px] h-auto opacity-60 z-0 hidden lg:block"
              viewBox="0 0 600 450"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="whiteSwooshGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#050505" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 120,10 C 260,80 480,40 580,180 C 650,280 500,420 380,440 C 260,460 380,310 440,240 C 500,170 380,130 240,110 C 120,90 20,40 120,10 Z"
                fill="url(#whiteSwooshGrad)"
              />
              <path
                d="M 220,20 C 340,70 520,60 590,190 C 620,250 560,340 480,360 C 400,380 460,280 490,220 C 530,150 420,120 320,100 Z"
                fill="#ffffff"
                opacity="0.08"
              />
            </svg>

            {/* Detail Card (~440px wide, dark gradient, 1px white border, 24px radius) */}
            <article
              className="relative w-full max-w-[440px] rounded-[24px] border p-6 sm:p-7 shadow-2xl z-10"
              style={{
                background:
                  "linear-gradient(155deg, #171717 0%, #101010 45%, #080808 100%)",
                borderColor: "rgba(255, 255, 255, 0.4)",
              }}
              aria-live="polite"
            >
              {/* Inner animated content container keyed to activeCake.id (300ms staggered fade) */}
              <div key={activeCake.id} className="animate-card-swap">
                {/* 1. Tag chip with white outline */}
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full border border-white/70 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    {activeCake.tag}
                  </span>
                  <span className="text-[11px] font-mono text-[#a79886]">
                    Freshly Baked
                  </span>
                </div>

                {/* 2. Cake name: Playfair Display, cream text, last word italic */}
                <h2
                  className="mt-3.5 font-sans text-3xl sm:text-4xl font-normal leading-[1.1] tracking-tight"
                >
                  <span className="text-[#f5ecd9]">{nameParts.first} </span>
                  <span className="text-white italic">
                    {nameParts.last}
                  </span>
                </h2>

                {/* 3. One-line flavour note in muted text */}
                <p className="mt-2 text-xs sm:text-sm text-[#a79886] font-light leading-relaxed">
                  {activeCake.line}
                </p>

                {/* 4. Highlight row */}
                <div className="my-4 rounded-xl border border-white/20 bg-black/40 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shrink-0 shadow-sm shadow-white/40">
                        <ActiveIcon className="h-4 w-4" />
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#f5ecd9] tracking-wide">
                        {activeHighlight.title}
                      </h3>
                    </div>

                    {/* 3 small icon buttons to switch between the 3 highlights */}
                    <div className="flex items-center gap-1.5">
                      {activeCake.highlights.map((hl, hIdx) => {
                        const IconComponent = getHighlightIcon(hl.icon);
                        const isCurrentHl = hIdx === activeHighlightIndex;
                        return (
                          <button
                            key={hl.title}
                            type="button"
                            onClick={() => setActiveHighlightIndex(hIdx)}
                            aria-label={`Highlight ${hIdx + 1}: ${hl.title}`}
                            aria-pressed={isCurrentHl}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                              isCurrentHl
                                ? "border-white bg-white text-black shadow-sm shadow-white/30"
                                : "border-white/30 bg-transparent text-white/75 hover:border-white hover:bg-white/10"
                            }`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-[#a79886] font-light leading-relaxed pl-10.5">
                    {activeHighlight.line}
                  </p>
                </div>

                {/* 5. Sizes label and 3 size chips (500 g, 1 kg, 2 kg) */}
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wider text-[#a79886] font-mono mb-2">
                    Sizes
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {CAKE_SIZES.map((size, idx) => {
                      const isSelected = idx === selectedSizeIndex;
                      return (
                        <button
                          key={size.label}
                          type="button"
                          onClick={() => setSelectedSizeIndex(idx)}
                          aria-label={`${size.label}, ${size.serves}`}
                          aria-pressed={isSelected}
                          className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? "border-white bg-white/10 text-[#f5ecd9] shadow-sm shadow-white/15"
                              : "border-white/10 bg-black/30 text-[#a79886] hover:border-white/20 hover:text-[#f5ecd9]"
                          }`}
                        >
                          <span className="block text-xs font-semibold">
                            {size.label}
                          </span>
                          <span className="block text-[9px] text-[#a79886] mt-0.5">
                            {size.serves}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Price in large white Playfair Display */}
                <div className="mt-5 flex items-baseline gap-2 border-t border-white/10 pt-4">
                  <span className="text-xs uppercase tracking-wider text-[#a79886]">
                    From
                  </span>
                  <span
                    className="font-sans text-3xl sm:text-4xl font-bold text-white"
                  >
                    ₹{activeCake.basePrice}
                  </span>
                </div>

              </div>
            </article>
          </div>
        </div>

        {/* BOTTOM: Row of 6 thumbnail cards with arrows on both ends */}
        <nav
          aria-label="Cakes thumbnail carousel"
          className="relative z-30 mx-auto flex w-full max-w-5xl items-center justify-between gap-2 pt-2 pb-1 sm:gap-3"
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => jumpToCake(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            aria-label="Previous cake"
            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-white/70 text-white transition-all ${
              activeIndex === 0
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white/15 hover:scale-105"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* 6 Thumbnail Cards */}
          <div className="flex flex-1 items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-1 scrollbar-none">
            {CAKES_DATA.map((cake, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={cake.id}
                  type="button"
                  onClick={() => jumpToCake(index)}
                  aria-label={`View ${cake.name}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`group flex min-w-[70px] sm:min-w-[90px] flex-col items-center gap-1.5 rounded-xl p-1.5 sm:p-2 border transition-all duration-300 ${
                    isActive
                      ? "border-white bg-white/10 shadow-[0_0_16px_rgba(255,255,255,0.2)] opacity-100 scale-105"
                      : "border-white/10 bg-black/40 opacity-50 hover:opacity-85 hover:border-white/25"
                  }`}
                >
                  <div className="relative h-10 w-14 sm:h-12 sm:w-18 overflow-hidden rounded-lg bg-black">
                    <Image
                      src={cake.photo}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <span
                    className={`max-w-[80px] sm:max-w-[95px] truncate text-[9px] sm:text-[10px] text-center leading-tight transition-colors ${
                      isActive
                        ? "text-[#f5ecd9] font-medium"
                        : "text-[#a79886] group-hover:text-[#f5ecd9]"
                    }`}
                  >
                    {cake.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() =>
              jumpToCake(Math.min(CAKE_COUNT - 1, activeIndex + 1))
            }
            disabled={activeIndex === CAKE_COUNT - 1}
            aria-label="Next cake"
            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-white/70 text-white transition-all ${
              activeIndex === CAKE_COUNT - 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white/15 hover:scale-105"
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </section>
  );
}
