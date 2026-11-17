"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CinematicFoodShowcase — 100% Scroll-Driven Signature Food Showcase
//
// Order:
//   1. Chicken Dum Biriyani (biryani)
//   2. Tandoori (tandoori)
//   3. Fried Rice (fried-rice)
//   4. Plum Cake (plum-cake)
//   5. Vancho Cake (vancho)
//   6. Strawberry Cake (strawberry)
//
// Behaviour:
//   - Directly driven by scroll position (NO video-like autoplay).
//   - Stops immediately when scroll stops; reverses when scrolling back.
//   - Fluid 0.22 lerp for responsive, buttery-smooth scrubbing.
//   - Cinematic smoothstep fade-out and fade-in with standard luxury pacing.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SHOWCASE_SCENES } from "@/lib/showcaseFrames";
import { usePrefersReducedMotion } from "@/context/SmoothScrollContext";

// ── Configuration ────────────────────────────────────────────────────────────
const ORDERED_IDS = [
  "biryani",
  "tandoori",
  "fried-rice",
  "plum-cake",
  "vancho",
  "strawberry",
];

const DISHES = ORDERED_IDS.map((id) =>
  SHOWCASE_SCENES.find((scene) => scene.id === id)
).filter(Boolean);

const DISH_COUNT = DISHES.length; // 6
const SEGMENT_VH = 250;           // Scroll distance per dish (vh)
const LERP_FACTOR = 0.22;         // Buttery-smooth scroll catch-up (zero lag)

// Standard matching fade pacing:
// 0.00 – 0.02: Pure black intermission hold
// 0.02 – 0.15: Smoothstep fade in (unveiling next item with standard presence)
// 0.15 – 0.85: Interactive frame scrub
// 0.85 – 0.98: Smoothstep fade out (luxurious, graceful exit taking more time)
// 0.98 – 1.00: Pure black hold
const FADE_IN_START = 0.02;
const FADE_IN_END = 0.15;
const FADE_OUT_START = 0.85;
const FADE_OUT_END = 0.98;

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CinematicFoodShowcase() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // DOM Refs
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const overlayRef = useRef(null);
  const captionRef = useRef(null);
  const captionTagRef = useRef(null);
  const captionNameRef = useRef(null);

  // Frame Cache: array of arrays [dishIdx][frameIdx] = ImageBitmap | null
  const cacheRef = useRef(DISHES.map((d) => new Array(d.frames.length).fill(null)));

  // Engine Refs (persisted across renders without causing re-renders)
  const currentValRef = useRef(0); // Cursor ∈ [0, DISH_COUNT]
  const targetValRef = useRef(0);  // Set by ScrollTrigger
  const activeDishIndexRef = useRef(-1);
  const lastDrawnKeyRef = useRef(-1);
  const rafIdRef = useRef(null);
  const isLoopRunningRef = useRef(false);
  const isVisibleRef = useRef(false);
  const resizeTimeoutRef = useRef(null);

  // ── Compute dish index, frame index, and opacities from continuous progress ──
  const computeState = useCallback((val) => {
    const clampedVal = Math.min(DISH_COUNT, Math.max(0, val));
    let dishIdx = Math.min(DISH_COUNT - 1, Math.floor(clampedVal));
    let s = clampedVal - dishIdx;

    if (clampedVal >= DISH_COUNT) {
      dishIdx = DISH_COUNT - 1;
      s = 1;
    }

    const dish = DISHES[dishIdx];
    const totalFrames = dish.frames.length;

    let overlayOpacity = 0;
    let captionOpacity = 1;
    let frameIndex = 0;

    if (s <= FADE_IN_START) {
      // Clean black pause before item opens
      overlayOpacity = 1;
      captionOpacity = 0;
      frameIndex = 0;
    } else if (s < FADE_IN_END) {
      // Graceful smoothstep fade in (unveils next item with standard timing)
      const t = smoothstep(FADE_IN_START, FADE_IN_END, s);
      overlayOpacity = 1 - t;
      captionOpacity = t;
      frameIndex = 0;
    } else if (s > FADE_OUT_END) {
      // Pure black hold after item fades out
      overlayOpacity = 1;
      captionOpacity = 0;
      frameIndex = totalFrames - 1;
    } else if (s >= FADE_OUT_START) {
      // Luxurious smoothstep fade out (takes more time to say goodbye)
      const t = smoothstep(FADE_OUT_START, FADE_OUT_END, s);
      overlayOpacity = t;
      captionOpacity = 1 - t;
      frameIndex = totalFrames - 1;
    } else {
      // Active interactive frame scrub zone
      overlayOpacity = 0;
      captionOpacity = 1;
      const scrubProgress = (s - FADE_IN_END) / (FADE_OUT_START - FADE_IN_END);
      frameIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(scrubProgress * (totalFrames - 1)))
      );
    }

    return {
      dishIdx,
      overlayOpacity: Math.min(1, Math.max(0, overlayOpacity)),
      captionOpacity: Math.min(1, Math.max(0, captionOpacity)),
      frameIndex,
    };
  }, []);

  // ── Draw the active frame on canvas with aspect-ratio letterboxing ─────────
  const drawFrame = useCallback((dishIdx, targetFrameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const dish = DISHES[dishIdx];
    const frames = cacheRef.current[dishIdx];
    const totalFrames = dish.frames.length;

    // Search nearest loaded frame fallback (frame 0 is loaded immediately)
    let resolved = Math.min(totalFrames - 1, Math.max(0, targetFrameIndex));
    if (!frames[resolved]) {
      let found = false;
      for (let offset = 1; offset < totalFrames; offset++) {
        if (resolved - offset >= 0 && frames[resolved - offset]) {
          resolved = resolved - offset;
          found = true;
          break;
        }
        if (resolved + offset < totalFrames && frames[resolved + offset]) {
          resolved = resolved + offset;
          found = true;
          break;
        }
      }
      if (!found) return;
    }

    const key = dishIdx * 10000 + resolved;
    if (key === lastDrawnKeyRef.current) return;
    lastDrawnKeyRef.current = key;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const bmp = frames[resolved];
    const cw = canvas.width;
    const ch = canvas.height;
    const sw = bmp.width;
    const sh = bmp.height;
    const srcRatio = sw / sh;
    const cvRatio = cw / ch;

    let dw, dh;
    if (cvRatio > srcRatio) {
      dw = cw;
      dh = cw / srcRatio;
    } else {
      dh = ch;
      dw = ch * srcRatio;
    }
    const dx = Math.round((cw - dw) / 2);
    const dy = Math.round((ch - dh) / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (dx > 0 || dy > 0 || dw < cw || dh < ch) {
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, cw, ch);
    }

    ctx.drawImage(bmp, dx, dy, dw, dh);
  }, []);

  // ── Apply state to DOM & Canvas ───────────────────────────────────────────
  const applyState = useCallback(
    (val, forceRedraw = false) => {
      const { dishIdx, overlayOpacity, captionOpacity, frameIndex } = computeState(val);

      // 1. Black overlay fade (opacity only)
      if (overlayRef.current) {
        overlayRef.current.style.opacity = overlayOpacity.toFixed(3);
      }

      // 2. Caption fade
      if (captionRef.current) {
        captionRef.current.style.opacity = captionOpacity.toFixed(3);
      }

      // 3. Swap dish info while screen is black
      if (dishIdx !== activeDishIndexRef.current || forceRedraw) {
        activeDishIndexRef.current = dishIdx;
        const currentDish = DISHES[dishIdx];

        if (captionTagRef.current) {
          captionTagRef.current.textContent = currentDish.tagline;
        }
        if (captionNameRef.current) {
          captionNameRef.current.textContent = currentDish.title;
        }
        if (glowRef.current) {
          glowRef.current.style.background = `radial-gradient(circle at 50% 38%, ${currentDish.glow} 0%, rgba(5,5,5,0.45) 36%, rgba(5,5,5,0.85) 100%)`;
        }
      }

      // 4. Render canvas frame
      drawFrame(dishIdx, frameIndex);
    },
    [computeState, drawFrame]
  );

  // ── Responsive, Scroll-Tied Smoothing Loop (Stops when scroll stops) ──────
  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isLoopRunningRef.current = false;
  }, []);

  const startRenderLoop = useCallback(() => {
    if (isLoopRunningRef.current || !isVisibleRef.current || prefersReducedMotion) {
      return;
    }

    isLoopRunningRef.current = true;

    const tick = () => {
      rafIdRef.current = null;
      if (!isVisibleRef.current) {
        isLoopRunningRef.current = false;
        return;
      }

      const target = targetValRef.current;
      const current = currentValRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.0004) {
        currentValRef.current = target;
        applyState(target);
        isLoopRunningRef.current = false;
        return;
      }

      // Smooth scroll catch-up: tracks hand in real time with zero autoplay
      const next = current + diff * LERP_FACTOR;
      currentValRef.current = next;
      applyState(next);

      if (Math.abs(target - next) > 0.0004) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        currentValRef.current = target;
        applyState(target);
        isLoopRunningRef.current = false;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [applyState, prefersReducedMotion]);

  // ── Preload All Frames into GPU Memory (Batched) ───────────────────────────
  useEffect(() => {
    const controllers = DISHES.map(() => new AbortController());
    let cancelled = false;

    const loadSingle = async (dishIdx, frameIdx) => {
      if (cancelled || cacheRef.current[dishIdx][frameIdx]) return true;
      const url = DISHES[dishIdx].frames[frameIdx];

      try {
        const res = await fetch(url, { signal: controllers[dishIdx].signal });
        if (!res.ok) return false;
        const blob = await res.blob();

        let bmp;
        if (typeof window !== "undefined" && "createImageBitmap" in window) {
          bmp = await createImageBitmap(blob);
        } else {
          bmp = await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          });
        }

        if (cancelled) {
          bmp?.close?.();
          return false;
        }

        cacheRef.current[dishIdx][frameIdx] = bmp;

        // Draw immediately if this is the active frame
        if (dishIdx === activeDishIndexRef.current && isVisibleRef.current) {
          drawFrame(dishIdx, frameIdx);
        }
        return true;
      } catch {
        return false;
      }
    };

    const runPreload = async () => {
      // 1. Immediately load frame 0 of all 6 dishes so none is ever blank
      await Promise.all(DISHES.map((_, i) => loadSingle(i, 0)));
      if (cancelled) return;

      // Draw initial biryani frame
      applyState(0, true);

      // 2. Stream remaining frames in small batches
      for (let d = 0; d < DISH_COUNT; d++) {
        if (cancelled) break;
        const total = DISHES[d].frames.length;
        const remaining = Array.from({ length: total - 1 }, (_, i) => i + 1);

        const BATCH = 8;
        for (let i = 0; i < remaining.length; i += BATCH) {
          if (cancelled) break;
          const chunk = remaining.slice(i, i + BATCH);
          await Promise.all(chunk.map((fi) => loadSingle(d, fi)));
        }
      }
    };

    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    let started = false;
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          void runPreload();
        }
      },
      { rootMargin: "250%" }
    );
    preloadObserver.observe(wrapper);

    return () => {
      cancelled = true;
      preloadObserver.disconnect();
      controllers.forEach((c) => c.abort());
      cacheRef.current.forEach((arr) => {
        arr.forEach((bmp) => bmp?.close?.());
        arr.fill(null);
      });
      lastDrawnKeyRef.current = -1;
    };
  }, [applyState, drawFrame]);

  // ── Canvas resize (debounced 150ms, DPR capped at 1.5 for performance) ─────
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return undefined;

    const resize = (width, height) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cw = Math.max(1, Math.round(width * dpr));
      const ch = Math.max(1, Math.round(height * dpr));

      if (canvas.width === cw && canvas.height === ch) return;

      canvas.width = cw;
      canvas.height = ch;
      lastDrawnKeyRef.current = -1;
      applyState(currentValRef.current, true);
    };

    const initial = stage.getBoundingClientRect();
    resize(initial.width, initial.height);

    const observer = new ResizeObserver(([entry]) => {
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        resizeTimeoutRef.current = null;
        resize(entry.contentRect.width, entry.contentRect.height);
      }, 150);
    });
    observer.observe(stage);

    return () => {
      observer.disconnect();
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [applyState]);

  // ── Intersection Observer (Pauses rAF when off-screen) ─────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          startRenderLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(wrapper);

    return () => {
      observer.disconnect();
      stopLoop();
    };
  }, [startRenderLoop, stopLoop]);

  // ── GSAP ScrollTrigger (Direct Scroll Scrub) ──────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    if (prefersReducedMotion) {
      applyState(0, true);
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);
    applyState(0, true);

    const st = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: true, // Smooth scrub directly controlled by Lenis
      invalidateOnRefresh: true,
      onUpdate(self) {
        targetValRef.current = self.progress * DISH_COUNT;
        startRenderLoop();
      },
    });

    ScrollTrigger.refresh();

    return () => {
      st.kill();
      stopLoop();
    };
  }, [applyState, prefersReducedMotion, startRenderLoop, stopLoop]);

  const totalHeight = prefersReducedMotion
    ? "100svh"
    : `${DISH_COUNT * SEGMENT_VH}vh`;

  return (
    <section
      ref={wrapperRef}
      id="food-showcase"
      aria-label="Signature dishes showcase"
      className="relative w-full bg-[#050505] text-[#f7f0df] select-none"
      style={{ height: totalHeight }}
    >
      {/* ── Sticky Fullscreen Stage (100vh) ── */}
      <div
        ref={stageRef}
        className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#050505]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* Single Hardware-Accelerated Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full block border-0 outline-none"
          style={{
            transform: "translateZ(0)",
            backgroundColor: "#050505",
          }}
        />

        {/* Ambient Glow */}
        <div
          ref={glowRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 38%, ${DISHES[0].glow} 0%, rgba(5,5,5,0.45) 36%, rgba(5,5,5,0.85) 100%)`,
            transition: "background 300ms ease",
          }}
        />

        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#050505]/90 via-[#050505]/20 to-[#050505]/85" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/25" />

        {/* Full-Stage Black Overlay (Driven purely by scroll progress) */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{
            opacity: 1,
            zIndex: 20,
            willChange: "opacity",
          }}
        />

        {/* Dish Title & Tagline */}
        <div
          ref={captionRef}
          className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-14 sm:pb-16 lg:pb-20 pointer-events-none"
          style={{
            opacity: 0,
            willChange: "opacity",
          }}
        >
          <div className="w-full max-w-5xl px-5 text-center sm:px-8 lg:px-12">
            <p
              ref={captionTagRef}
              className="mb-3 text-[10px] font-medium uppercase tracking-[0.55em] text-[#f5ecd9]/70 select-none"
            >
              {DISHES[0].tagline}
            </p>
            <h3
              ref={captionNameRef}
              className="dish-caption select-none"
              style={{
                textShadow: "0 0 16px rgba(229, 169, 60, 0.3)",
              }}
            >
              {DISHES[0].title}
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
