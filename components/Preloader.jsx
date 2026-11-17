"use client";

import React, { useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import gsap from "gsap";
import { usePrefersReducedMotion } from "@/context/SmoothScrollContext";

// =========================================================================
// TUNABLE CONSTANTS
// =========================================================================
export const LOGO_SRC = "/logo/mra-red-white.webp";
export const DISPLAY_DURATION_MS = 2000; // Exactly 2 seconds display before exit
export const PARTICLE_COUNT = 16; // Subtle ambient embers

// =========================================================================
// SUBTLE EMBER PARTICLES (Pure CSS, GPU accelerated)
// =========================================================================
function EmberParticle({ id }) {
  const style = useMemo(() => {
    const seed = id * 7823;
    const left = 8 + ((seed * 19) % 84);
    const bottom = 5 + ((seed * 13) % 40);
    const size = 1.5 + ((seed * 3) % 2.5);
    const dur = 4.5 + ((seed * 7) % 3.5);
    const delay = -((seed * 11) % 5);
    const driftX = (seed % 2 === 0 ? 1 : -1) * (15 + ((seed * 5) % 20));
    const peakOpacity = 0.25 + ((seed * 3) % 20) / 100;

    return {
      position: "absolute",
      left: `${left}%`,
      bottom: `${bottom}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "radial-gradient(circle, #ffffff 0%, #ef4444 70%, transparent 100%)",
      boxShadow: "0 0 6px rgba(239, 68, 68,0.6)",
      willChange: "transform, opacity",
      animation: `emberAscendMinimal ${dur}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s infinite`,
      "--drift-x": `${driftX}px`,
      "--peak-op": peakOpacity,
    };
  }, [id]);

  return <div style={style} />;
}

// =========================================================================
// PRELOADER WITH FIXED CENTER LOGO & ORBITING GLOW RING
// =========================================================================
export default function Preloader({ heroReady = false, onComplete }) {
  const reducedMotion = usePrefersReducedMotion();

  // Timing & state refs
  const mountTimeRef = useRef(0);
  const minElapsedRef = useRef(false);
  const exitTriggeredRef = useRef(false);
  const isLoadedRef = useRef(false);

  // DOM refs
  const overlayRef = useRef(null);
  const centerDiscRef = useRef(null);
  const orbitRingRef = useRef(null);

  // -----------------------------------------------------------------------
  // 1. Cinematic Exit Transition (No Logo Spin - Elegant Ripple & Scale Glow)
  // -----------------------------------------------------------------------
  const triggerExit = useCallback(() => {
    if (exitTriggeredRef.current) return;
    exitTriggeredRef.current = true;

    if (reducedMotion) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          document.body.style.overflow = "";
          onComplete?.();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("preloader:done"));
          }
        },
      });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        onComplete?.();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("preloader:done"));
        }
      },
    });

    // 1. Center Disc glows and scales slightly without rotating
    if (centerDiscRef.current) {
      tl.to(
        centerDiscRef.current,
        {
          scale: 1.08,
          filter: "drop-shadow(0 0 35px rgba(255,255,255,0.85)) brightness(1.2)",
          duration: 0.65,
          ease: "power2.out",
        },
        0
      );
    }

    // 2. Orbit Ring expands outward into a ripple
    if (orbitRingRef.current) {
      tl.to(
        orbitRingRef.current,
        {
          scale: 1.35,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        0
      );
    }

    // 3. Whole preloader fades out seamlessly
    if (overlayRef.current) {
      tl.to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.7,
          ease: "power2.inOut",
        },
        0.15
      );
    }
  }, [reducedMotion, onComplete]);

  // -----------------------------------------------------------------------
  // 2. Mount, Scroll Lock & 2-Second Display Timer
  // -----------------------------------------------------------------------
  useEffect(() => {
    mountTimeRef.current = performance.now();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    minElapsedRef.current = false;
    const displayTimer = setTimeout(() => {
      minElapsedRef.current = true;
      if (isLoadedRef.current && !exitTriggeredRef.current) {
        triggerExit();
      }
    }, DISPLAY_DURATION_MS);

    return () => {
      document.body.style.overflow = prevOverflow || "";
      clearTimeout(displayTimer);
    };
  }, [triggerExit]);

  // -----------------------------------------------------------------------
  // 3. Wait for fonts and the first 40 hero frames
  // -----------------------------------------------------------------------
  useEffect(() => {
    let active = true;
    let fontsReady = !document.fonts;

    const checkIfAllLoaded = () => {
      if (!active || !fontsReady || !heroReady) return;

      isLoadedRef.current = true;
      if (minElapsedRef.current && !exitTriggeredRef.current) {
        triggerExit();
      }
    };

    if (document.fonts) {
      document.fonts.ready.then(() => {
        fontsReady = true;
        checkIfAllLoaded();
      });
    }
    checkIfAllLoaded();

    return () => {
      active = false;
    };
  }, [heroReady, triggerExit]);

  return (
    <>
      <style>{`
        @keyframes emberAscendMinimal {
          0% {
            transform: translate3d(0, 0, 0) scale(0.6);
            opacity: 0;
          }
          20% { opacity: var(--peak-op, 0.35); }
          80% { opacity: var(--peak-op, 0.35); }
          100% {
            transform: translate3d(var(--drift-x, 20px), -320px, 0) scale(1.1);
            opacity: 0;
          }
        }
        @keyframes orbitSpinSmooth {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitSpinReverse {
          0%   { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes logoFinishingShine {
          0%        { transform: translateX(-160%) rotate(25deg); opacity: 0; }
          15%       { opacity: 0.85; }
          40%, 100% { transform: translateX(260%) rotate(25deg); opacity: 0; }
        }
        @keyframes discBreathingGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.95);
          }
          50% {
            box-shadow: 0 0 45px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.95);
          }
        }
      `}</style>

      {/* Full-screen fixed overlay above everything, background #050505 */}
      <div
        ref={overlayRef}
        role="status"
        aria-label="Loading"
        aria-live="polite"
        className="fixed inset-0 z-[999999] bg-[#050505] flex items-center justify-center select-none overflow-hidden"
      >
        {/* Soft Radial Ambient Orange Glow centered behind disc */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle 500px at 50% 50%, rgba(239, 68, 68, 0.12) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 75%)",
          }}
        />

        {/* Floating Ember Particles (Subtle, CSS only) */}
        {!reducedMotion &&
          Array.from({ length: PARTICLE_COUNT }, (_, i) => (
            <EmberParticle key={i} id={i + 1} />
          ))}

        {/* ========================================================================= */}
        {/* CENTER COMPOSITION: CIRCLE WITH ORBITING TRACK & FIXED LOGO               */}
        {/* ========================================================================= */}
        <div className="relative flex items-center justify-center pointer-events-none">
          {/* 1. OUTER CONCENTRIC TRACK RINGS & ORBITING BEACON ARC */}
          <div
            ref={orbitRingRef}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Outermost faint dashed guide ring */}
            <div
              className="w-[270px] h-[270px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] rounded-full border border-dashed border-[#ef4444]/20 pointer-events-none"
              style={{
                animation: reducedMotion ? "none" : "orbitSpinReverse 25s linear infinite",
              }}
            />

            {/* Middle subtle solid track ring */}
            <div className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] rounded-full border border-[#ef4444]/15 pointer-events-none" />

            {/* Glowing Orbiting SVG Track with Arc & Beacon Satellite */}
            <svg
              viewBox="0 0 200 200"
              className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] pointer-events-none"
              style={{
                animation: reducedMotion ? "none" : "orbitSpinSmooth 2.4s linear infinite",
                filter: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))",
              }}
            >
              {/* Background thin track ring */}
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="rgba(239, 68, 68, 0.25)"
                strokeWidth="1.5"
              />

              {/* Glowing Orange Arc segment */}
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                strokeDasharray="45 510"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 8px #ef4444)" }}
              />

              {/* Glowing Satellite Beacon (Matching reference image position) */}
              <circle
                cx="188"
                cy="100"
                r="3.5"
                fill="#ffffff"
                stroke="#ef4444"
                strokeWidth="2.5"
                style={{ filter: "drop-shadow(0 0 8px #ff944d)" }}
              />
            </svg>
          </div>

          {/* 2. INNER DARK CIRCULAR DISC WITH SUBTLE BORDER */}
          <div
            ref={centerDiscRef}
            className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full flex items-center justify-center z-10 border border-[#333333]/90"
            style={{
              background:
                "radial-gradient(circle at 45% 40%, #1e1e1e 0%, #101010 60%, #080808 100%)",
              animation: reducedMotion ? "none" : "discBreathingGlow 3s ease-in-out infinite",
              boxShadow:
                "0 0 30px rgba(0,0,0,0.95), inset 0 2px 8px rgba(255,255,255,0.08), inset 0 -4px 12px rgba(0,0,0,0.85)",
            }}
          >
            {/* Subtle inner gold rim accent */}
            <div className="absolute inset-1.5 rounded-full border border-[#ffffff]/20 pointer-events-none" />

            {/* 3. CENTER LOGO: COMPLETELY FIXED, UPRIGHT, NEVER ROTATING */}
            <div className="relative w-28 sm:w-36 md:w-40 aspect-[1600/1014] flex items-center justify-center overflow-hidden">
              <Image
                src={LOGO_SRC}
                alt="MRA Bakery & Restaurant"
                fill
                priority
                sizes="(max-width: 640px) 120px, 160px"
                className="object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              />

              {/* Diagonal Light Finishing Sweep (Clipped strictly to logo alpha mask) */}
              {!reducedMotion && (
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{
                    WebkitMaskImage: `url(${LOGO_SRC})`,
                    maskImage: `url(${LOGO_SRC})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    mixBlendMode: "screen",
                  }}
                >
                  <div
                    className="w-[50%] h-[180%] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                    style={{
                      position: "absolute",
                      top: "-40%",
                      left: 0,
                      animation: "logoFinishingShine 2.2s ease-in-out infinite 0.5s",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
