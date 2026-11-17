"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CakeSequence2 — Ultra-Smooth, Zero-Lag Hero Artisanal Cake Scroll Sequence
//
// Performance Engineering:
//   - 183 WebP frames (/caketrack2-webp/frame_001.webp ... frame_183.webp)
//   - Zero CSS filter on canvas (eliminates GPU shader pipeline lag on laptops)
//   - In-canvas camera zoom & pan (eliminates DOM compositor subpixel shimmering)
//   - Active Worker Pool (8 concurrent) + Dynamic On-Demand Priority Queue
//   - Immediate replacement of fallback frames when target frame arrives (no stuck frames)
//   - Framerate-independent delta-time exponential smoothing (consistent at 60/120/144Hz)
//   - Zero CSS transition collisions on rAF-driven layers (no stutter/jank)
//   - Capped DPR (1.5) with letterbox clear optimization
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  usePrefersReducedMotion,
  useSmoothScroll,
} from "@/context/SmoothScrollContext";

// ── Configuration Constants ──────────────────────────────────────────────────
export const CAKE2_FRAME_DIR = "/caketrack2-webp";
export const CAKE2_FILE_PREFIX = "frame_";
export const CAKE2_FILE_EXT = ".webp";
export const CAKE2_PAD = 3;
export const CAKE2_TOTAL_FRAMES = 183;
export const CAKE2_SOURCE_WIDTH = 1280;
export const CAKE2_SOURCE_HEIGHT = 720;
export const CAKE2_TRACK_HEIGHT = "580vh";
const MAX_CONCURRENT_LOADS = 8;
// ─────────────────────────────────────────────────────────────────────────────

function getFrameUrl(index) {
  const padStr = String(index).padStart(CAKE2_PAD, "0");
  return `${CAKE2_FRAME_DIR}/${CAKE2_FILE_PREFIX}${padStr}${CAKE2_FILE_EXT}`;
}

export default function CakeSequence2({ onProgressUpdate }) {
  const { markImagesReady, scrollTo } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();

  // DOM Refs
  const trackRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const ambientGlowRef = useRef(null);
  const bottomBlendRef = useRef(null);

  // Text stage refs
  const textStage1Ref = useRef(null);
  const textStage2Ref = useRef(null);
  const textStage3Ref = useRef(null);

  // Timeline indicator refs
  const progressBarRef = useRef(null);
  const phaseLabelRef = useRef(null);

  // Engine Refs (state-less for zero re-render scroll performance)
  const bitmapsRef = useRef(new Array(CAKE2_TOTAL_FRAMES).fill(null));
  const activeRequestsRef = useRef(new Set());
  const queueRef = useRef([]);
  const activeWorkersRef = useRef(0);
  const cancelledRef = useRef(false);

  const currentFrameRef = useRef(1); // 1-based index
  const targetFrameRef = useRef(1);
  const lastDrawnStateRef = useRef({ bitmapIdx: -1, posX: -999, posY: -999, w: 0, h: 0 });
  const lastNowRef = useRef(null);
  const rafIdRef = useRef(null);
  const isLoopRunningRef = useRef(false);
  const isVisibleRef = useRef(false);
  const resizeTimeoutRef = useRef(null);
  const onProgressUpdateRef = useRef(onProgressUpdate);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  // ── Nearest Loaded Bitmap Fallback ─────────────────────────────────────────
  const getNearestBitmap = useCallback((frameIndex) => {
    const bitmaps = bitmapsRef.current;
    const targetIdx = Math.max(0, Math.min(CAKE2_TOTAL_FRAMES - 1, frameIndex - 1));

    if (bitmaps[targetIdx]) {
      return { bitmap: bitmaps[targetIdx], index: targetIdx };
    }

    for (let offset = 1; offset < CAKE2_TOTAL_FRAMES; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && bitmaps[prev]) {
        return { bitmap: bitmaps[prev], index: prev };
      }
      const next = targetIdx + offset;
      if (next < CAKE2_TOTAL_FRAMES && bitmaps[next]) {
        return { bitmap: bitmaps[next], index: next };
      }
    }
    return null;
  }, []);

  // ── High-Performance Canvas Rendering (In-Canvas Camera Motion) ───────────
  const drawCompositeFrame = useCallback(
    (frameVal, progress = 0) => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return;

      const clampedIndex = Math.max(
        1,
        Math.min(CAKE2_TOTAL_FRAMES, Math.round(frameVal))
      );
      const frame = getNearestBitmap(clampedIndex);
      if (!frame) return;

      const width = canvas.width;
      const height = canvas.height;

      // In-canvas camera zoom and gentle drift (eliminates DOM transform shimmering)
      let camScale = 1.0;
      let camShiftX = 0;
      let camShiftY = 0;

      if (progress < 0.35) {
        const t = progress / 0.35;
        camScale = 1.04 - t * 0.04;
      } else if (progress < 0.70) {
        const t = (progress - 0.35) / 0.35;
        camScale = 1.00 + t * 0.025;
        camShiftX = (t - 0.5) * 0.014 * width;
        camShiftY = Math.sin(t * Math.PI) * -0.005 * height;
      } else {
        const t = (progress - 0.70) / 0.30;
        camScale = 1.025 + t * 0.025;
        camShiftX = (1 - t) * 0.007 * width;
      }

      const sourceW = frame.bitmap.width || CAKE2_SOURCE_WIDTH;
      const sourceH = frame.bitmap.height || CAKE2_SOURCE_HEIGHT;
      const sourceRatio = sourceW / sourceH;
      const canvasRatio = width / height;

      let baseDrawWidth;
      let baseDrawHeight;

      if (canvasRatio > sourceRatio) {
        baseDrawWidth = width;
        baseDrawHeight = width / sourceRatio;
      } else {
        baseDrawHeight = height;
        baseDrawWidth = height * sourceRatio;
      }

      const finalWidth = Math.round(baseDrawWidth * camScale);
      const finalHeight = Math.round(baseDrawHeight * camScale);
      const finalX = Math.round((width - finalWidth) / 2 + camShiftX);
      const finalY = Math.round((height - finalHeight) / 2 + camShiftY);

      // Skip draw if exact same bitmap and pixel coordinates are unchanged
      const prev = lastDrawnStateRef.current;
      if (
        prev.bitmapIdx === frame.index &&
        Math.abs(prev.posX - finalX) < 1 &&
        Math.abs(prev.posY - finalY) < 1 &&
        prev.w === finalWidth &&
        prev.h === finalHeight
      ) {
        return;
      }

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill black only if image does not cover entire canvas
      if (finalX > 0 || finalY > 0 || finalX + finalWidth < width || finalY + finalHeight < height) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(frame.bitmap, finalX, finalY, finalWidth, finalHeight);

      lastDrawnStateRef.current = {
        bitmapIdx: frame.index,
        posX: finalX,
        posY: finalY,
        w: finalWidth,
        h: finalHeight,
      };
    },
    [getNearestBitmap]
  );

  // ── Atmospheric Lighting & Text Stage Transitions ────────────────────────
  const updateCinematicExperience = useCallback((progress) => {
    // 1. Ambient Glow Depth Pulse (direct opacity, zero CSS transition clash)
    if (ambientGlowRef.current) {
      const glowOpacity = 0.5 + Math.sin(progress * Math.PI) * 0.45;
      ambientGlowRef.current.style.opacity = glowOpacity.toFixed(2);
    }

    // 2. Stage 1 Typography (0.00 – 0.32)
    if (textStage1Ref.current) {
      let op1 = 0;
      let y1 = 0;
      if (progress <= 0.32) {
        if (progress < 0.03) {
          op1 = 1;
          y1 = 0;
        } else if (progress > 0.23) {
          op1 = Math.max(0, 1 - (progress - 0.23) / 0.09);
          y1 = (1 - op1) * -24;
        } else {
          op1 = 1;
          y1 = 0;
        }
      }
      textStage1Ref.current.style.opacity = op1.toFixed(3);
      textStage1Ref.current.style.transform = `translate3d(0, ${y1.toFixed(1)}px, 0)`;
      textStage1Ref.current.style.pointerEvents = op1 > 0.1 ? "auto" : "none";
    }

    // 3. Stage 2 Typography (0.33 – 0.67)
    if (textStage2Ref.current) {
      let op2 = 0;
      let y2 = 28;
      if (progress >= 0.33 && progress <= 0.67) {
        if (progress < 0.42) {
          op2 = (progress - 0.33) / 0.09;
          y2 = (1 - op2) * 24;
        } else if (progress > 0.58) {
          op2 = Math.max(0, 1 - (progress - 0.58) / 0.09);
          y2 = (1 - op2) * -24;
        } else {
          op2 = 1;
          y2 = 0;
        }
      }
      textStage2Ref.current.style.opacity = op2.toFixed(3);
      textStage2Ref.current.style.transform = `translate3d(0, ${y2.toFixed(1)}px, 0)`;
      textStage2Ref.current.style.pointerEvents = op2 > 0.1 ? "auto" : "none";
    }

    // 4. Stage 3 Typography (0.68 – 1.00)
    if (textStage3Ref.current) {
      let op3 = 0;
      let y3 = 28;
      if (progress >= 0.68) {
        if (progress < 0.77) {
          op3 = (progress - 0.68) / 0.09;
          y3 = (1 - op3) * 24;
        } else if (progress > 0.93) {
          op3 = Math.max(0, 1 - (progress - 0.93) / 0.07);
          y3 = (1 - op3) * -18;
        } else {
          op3 = 1;
          y3 = 0;
        }
      }
      textStage3Ref.current.style.opacity = op3.toFixed(3);
      textStage3Ref.current.style.transform = `translate3d(0, ${y3.toFixed(1)}px, 0)`;
      textStage3Ref.current.style.pointerEvents = op3 > 0.1 ? "auto" : "none";
    }

    // 5. Timeline Progress Indicator
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
    }
    if (phaseLabelRef.current) {
      const phase = progress < 0.35 ? "01 / 03" : progress < 0.70 ? "02 / 03" : "03 / 03";
      if (phaseLabelRef.current.textContent !== phase) {
        phaseLabelRef.current.textContent = phase;
      }
    }

    // 6. Dynamic Exit Blend into Story Section
    if (bottomBlendRef.current) {
      let exitOp = 0;
      if (progress > 0.90) {
        exitOp = Math.min(1, (progress - 0.90) / 0.10);
      }
      bottomBlendRef.current.style.opacity = exitOp.toFixed(3);
    }
  }, []);

  // ── Framerate-Independent Delta-Time Smooth Render Loop ───────────────────
  const startRenderLoop = useCallback(() => {
    if (!isVisibleRef.current || isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;
    lastNowRef.current = performance.now();

    const tick = (now) => {
      rafIdRef.current = null;
      if (!isVisibleRef.current) {
        isLoopRunningRef.current = false;
        return;
      }

      // Clamped delta-time prevents jumping after lag spikes
      const dt = Math.min((now - lastNowRef.current) / 1000, 0.05);
      lastNowRef.current = now;

      const current = currentFrameRef.current;
      const target = targetFrameRef.current;
      const diff = target - current;

      if (prefersReducedMotion) {
        currentFrameRef.current = 1;
        drawCompositeFrame(1, 0);
        updateCinematicExperience(0);
        isLoopRunningRef.current = false;
        return;
      }

      // Exponential smoothing factor: identical physical response at 60Hz, 120Hz, 144Hz
      const factor = 1 - Math.exp(-16 * dt);
      const nextFrame = Math.abs(diff) < 0.03 ? target : current + diff * factor;
      currentFrameRef.current = nextFrame;

      const progress = (nextFrame - 1) / (CAKE2_TOTAL_FRAMES - 1);
      drawCompositeFrame(nextFrame, progress);
      updateCinematicExperience(progress);

      if (Math.abs(target - nextFrame) < 0.03) {
        currentFrameRef.current = target;
        const targetProg = (target - 1) / (CAKE2_TOTAL_FRAMES - 1);
        drawCompositeFrame(target, targetProg);
        updateCinematicExperience(targetProg);
        isLoopRunningRef.current = false;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawCompositeFrame, prefersReducedMotion, updateCinematicExperience]);

  // ── Worker Pool & On-Demand Frame Fetcher ──────────────────────────────────
  const pumpQueue = useCallback(() => {
    if (cancelledRef.current) return;

    while (
      activeWorkersRef.current < MAX_CONCURRENT_LOADS &&
      queueRef.current.length > 0
    ) {
      const nextIdx = queueRef.current.shift();
      if (!nextIdx || bitmapsRef.current[nextIdx - 1] || activeRequestsRef.current.has(nextIdx)) {
        continue;
      }

      activeWorkersRef.current++;
      activeRequestsRef.current.add(nextIdx);

      const fetchAndDecode = async (idx) => {
        try {
          const res = await fetch(getFrameUrl(idx));
          if (!res.ok) return;
          const blob = await res.blob();

          let bitmap;
          if (typeof window !== "undefined" && "createImageBitmap" in window) {
            bitmap = await createImageBitmap(blob);
          } else {
            bitmap = await new Promise((resolve, reject) => {
              const img = new window.Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = URL.createObjectURL(blob);
            });
          }

          if (cancelledRef.current) {
            bitmap.close?.();
            return;
          }

          bitmapsRef.current[idx - 1] = bitmap;

          // Frame 1 ready: instant first-paint & release preloader
          if (idx === 1) {
            setIsLoaded(true);
            drawCompositeFrame(1, 0);
            updateCinematicExperience(0);
            onProgressUpdateRef.current?.(100, true);
            try {
              markImagesReady?.("hero");
              markImagesReady?.("cake-sequence");
            } catch {
              // Safe fallback
            }
          }

          // If this frame is the one currently visible or within ±2 frames, draw immediately!
          if (
            isVisibleRef.current &&
            Math.abs(idx - Math.round(currentFrameRef.current)) <= 2
          ) {
            drawCompositeFrame(currentFrameRef.current, (currentFrameRef.current - 1) / (CAKE2_TOTAL_FRAMES - 1));
          }
        } catch {
          // Ignore network abort
        } finally {
          activeWorkersRef.current--;
          activeRequestsRef.current.delete(idx);
          pumpQueue();
        }
      };

      fetchAndDecode(nextIdx);
    }
  }, [drawCompositeFrame, markImagesReady, updateCinematicExperience]);

  // Request frames on-demand based on user's active scrub position
  const requestFrameOnDemand = useCallback(
    (frameIndex) => {
      const target = Math.max(1, Math.min(CAKE2_TOTAL_FRAMES, Math.round(frameIndex)));
      const priority = [target];
      for (let delta = 1; delta <= 6; delta++) {
        if (target + delta <= CAKE2_TOTAL_FRAMES) priority.push(target + delta);
        if (target - delta >= 1) priority.push(target - delta);
      }

      const needed = priority.filter(
        (idx) => !bitmapsRef.current[idx - 1] && !activeRequestsRef.current.has(idx)
      );

      if (needed.length > 0) {
        queueRef.current = [...new Set([...needed, ...queueRef.current])];
        pumpQueue();
      }
    },
    [pumpQueue]
  );

  // Initial Load Pipeline
  useEffect(() => {
    cancelledRef.current = false;

    // 1. Immediately prioritize frame 1
    queueRef.current = [1];

    // 2. Add first 40 frames next, then remaining frames
    for (let i = 2; i <= CAKE2_TOTAL_FRAMES; i++) {
      queueRef.current.push(i);
    }

    pumpQueue();

    return () => {
      cancelledRef.current = true;
      bitmapsRef.current.forEach((b) => b?.close?.());
      bitmapsRef.current.fill(null);
      lastDrawnStateRef.current = { bitmapIdx: -1, posX: -999, posY: -999, w: 0, h: 0 };
    };
  }, [pumpQueue]);

  // ── Canvas Resize & GSAP ScrollTrigger Setup ──────────────────────────────
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return undefined;

    gsap.registerPlugin(ScrollTrigger);

    const canvas = canvasRef.current;
    const track = trackRef.current;
    const stickyStage = stickyRef.current;
    if (!canvas || !track || !stickyStage) return undefined;

    const resizeCanvas = () => {
      const rect = stickyStage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);

      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      lastDrawnStateRef.current = { bitmapIdx: -1, posX: -999, posY: -999, w: 0, h: 0 };

      const curProg = (currentFrameRef.current - 1) / (CAKE2_TOTAL_FRAMES - 1);
      drawCompositeFrame(currentFrameRef.current, curProg);
    };

    const scheduleResize = () => {
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        resizeTimeoutRef.current = null;
        resizeCanvas();
      }, 100);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(stickyStage);
    window.addEventListener("resize", scheduleResize, { passive: true });

    if (prefersReducedMotion) {
      currentFrameRef.current = 1;
      targetFrameRef.current = 1;
      drawCompositeFrame(1, 0);
      updateCinematicExperience(0);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", scheduleResize);
      };
    }

    // Direct ScrollTrigger Connection
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const target = 1 + self.progress * (CAKE2_TOTAL_FRAMES - 1);
          targetFrameRef.current = target;
          requestFrameOnDemand(target);
          startRenderLoop();
        },
      });
    }, track);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          startRenderLoop();
        } else if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
          isLoopRunningRef.current = false;
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(track);

    return () => {
      ctx.revert();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [
    drawCompositeFrame,
    isLoaded,
    prefersReducedMotion,
    requestFrameOnDemand,
    startRenderLoop,
    updateCinematicExperience,
  ]);

  const scrollToHeadline = useCallback(() => {
    scrollTo?.("#cake-headline");
  }, [scrollTo]);

  return (
    <section
      ref={trackRef}
      id="hero"
      aria-label="Artisanal Cake Hero Sequence"
      className="relative w-full bg-black select-none"
      style={{ height: prefersReducedMotion ? "100svh" : CAKE2_TRACK_HEIGHT }}
    >
      {/* Sticky Viewport Stage */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-black flex items-center justify-center z-10"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* Ambient Volumetric Backlight (zero CSS transitions to prevent rAF thrashing) */}
        <div
          ref={ambientGlowRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(229, 169, 60, 0.20) 0%, rgba(185, 28, 28, 0.08) 35%, transparent 70%)",
            opacity: 0.8,
            willChange: "opacity",
          }}
        />

        {/* Main Canvas Layer - Clean, native WebGL/2D hardware-accelerated */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block border-0 outline-none"
          style={{
            transform: "translateZ(0)",
            backgroundColor: "#000000",
          }}
        />

        {/* Cinematic Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 100px 30px rgba(0,0,0,0.85)",
          }}
        />

        {/* Top Edge Feather */}
        <div className="absolute top-0 inset-x-0 h-32 md:h-48 pointer-events-none bg-gradient-to-b from-black via-black/50 to-transparent z-15" />

        {/* Bottom Edge Feather */}
        <div className="absolute bottom-0 inset-x-0 h-44 md:h-64 pointer-events-none bg-gradient-to-t from-black via-black/80 to-transparent z-15" />

        {/* Dynamic Exit Blend into Story Section (No CSS transition clashes) */}
        <div
          ref={bottomBlendRef}
          className="absolute inset-0 pointer-events-none bg-black z-16"
          style={{ opacity: 0, willChange: "opacity" }}
        />

        {/* Subtle Contrast Gradient for Left-Side Text Readability */}
        <div className="absolute inset-y-0 start-0 w-full md:w-3/5 lg:w-1/2 pointer-events-none bg-gradient-to-r from-black/95 via-black/60 to-transparent z-17" />

        {/* ── 3-Stage Luxury Typography Overlays ── */}
        <div className="absolute inset-0 z-20 pointer-events-none w-full px-6 sm:px-10 md:px-14 lg:px-20 flex items-center text-start">
          {/* STAGE 1: "CRAFTED WITH DREAMS" */}
          <div
            ref={textStage1Ref}
            className="max-w-md sm:max-w-lg lg:max-w-xl absolute start-6 sm:start-10 md:start-14 lg:start-20"
            style={{ opacity: 1, transform: "translate3d(0, 0px, 0)", willChange: "transform, opacity" }}
          >
            {/* Kicker Pill */}
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-[#ef4444]/40 bg-[#ef4444]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.25em] text-[#f5ecd9] uppercase">
                Artisanal Patisserie • Est. 1996
              </span>
            </div>

            <h1
              className="font-serif font-black text-4xl sm:text-6xl lg:text-[4.75rem] tracking-tight leading-[0.92] uppercase select-none drop-shadow-[0_8px_28px_rgba(0,0,0,0.85)] text-white"
              style={{ letterSpacing: "0.02em" }}
            >
              CRAFTED
              <br />
              WITH
              <br />
              <span className="text-[#ef4444] italic">DREAMS.</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-[#f7ecd5]/85 font-sans font-light leading-relaxed max-w-sm sm:max-w-md my-6 drop-shadow-md">
              Layers of velvety sponge, rich ganache, and golden spun sugar crafted fresh daily by master pastry chefs with three decades of heritage.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={scrollToHeadline}
                className="pointer-events-auto group px-7 py-3 rounded-full bg-gradient-to-r from-[#ef4444] to-[#b91c1c] hover:brightness-110 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-[#ef4444]/30 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Explore Signature Cakes</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>

          {/* STAGE 2: "FORGED IN PURE PASSION" */}
          <div
            ref={textStage2Ref}
            className="max-w-md sm:max-w-lg lg:max-w-xl absolute start-6 sm:start-10 md:start-14 lg:start-20"
            style={{ opacity: 0, transform: "translate3d(0, 28px, 0)", willChange: "transform, opacity" }}
          >
            {/* Kicker Pill */}
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-[#d4a24c]/40 bg-[#d4a24c]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a24c]" />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.25em] text-[#d4a24c] uppercase">
                Single-Origin Craftsmanship
              </span>
            </div>

            <h2
              className="font-serif font-black text-4xl sm:text-6xl lg:text-[4.75rem] tracking-tight leading-[0.92] uppercase select-none drop-shadow-[0_8px_28px_rgba(0,0,0,0.85)] text-white"
              style={{ letterSpacing: "0.02em" }}
            >
              FORGED IN
              <br />
              PURE
              <br />
              <span className="text-[#ef4444] italic">PASSION.</span>
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#f7ecd5]/85 font-sans font-light leading-relaxed max-w-sm sm:max-w-md my-6 drop-shadow-md">
              Single-origin Belgian cacao and hand-scraped Madagascar vanilla pods infused into every tier, offering sheer indulgence with every single slice.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={scrollToHeadline}
                className="pointer-events-auto group px-7 py-3 rounded-full bg-gradient-to-r from-[#ef4444] to-[#b91c1c] hover:brightness-110 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-[#ef4444]/30 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Browse Our Heritage</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>

          {/* STAGE 3: "CELEBRATE SWEET DREAMS" */}
          <div
            ref={textStage3Ref}
            className="max-w-md sm:max-w-lg lg:max-w-xl absolute start-6 sm:start-10 md:start-14 lg:start-20"
            style={{ opacity: 0, transform: "translate3d(0, 28px, 0)", willChange: "transform, opacity" }}
          >
            {/* Kicker Pill */}
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/20 bg-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.25em] text-[#f5ecd9] uppercase">
                Bespoke Celebration Tiers
              </span>
            </div>

            <h2
              className="font-serif font-black text-4xl sm:text-6xl lg:text-[4.75rem] tracking-tight leading-[0.92] uppercase select-none drop-shadow-[0_8px_28px_rgba(0,0,0,0.85)]"
              style={{ letterSpacing: "0.02em" }}
            >
              <span className="text-[#f5ecd9]">
                CELEBRATE
                <br />
                SWEET
                <br />
              </span>
              <span className="text-[#ef4444] italic">DREAMS.</span>
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#f7ecd5]/85 font-sans font-light leading-relaxed max-w-sm sm:max-w-md my-6 drop-shadow-md">
              Custom centerpiece cakes handcrafted to order for every unforgettable occasion, finished with Swiss meringue and 24K edible gold leaf.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={scrollToHeadline}
                className="pointer-events-auto group px-7 py-3 rounded-full bg-gradient-to-r from-[#ef4444] to-[#b91c1c] hover:brightness-110 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-[#ef4444]/30 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Explore Cake Menu</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Luxury Bottom Timeline & Progress Indicator ── */}
        <div className="absolute bottom-6 end-6 sm:bottom-8 sm:end-10 z-20 pointer-events-none flex items-center gap-4">
          <span
            ref={phaseLabelRef}
            className="text-[11px] font-mono tracking-widest text-[#f5ecd9]/60 uppercase"
          >
            01 / 03
          </span>
          <div className="w-20 sm:w-28 h-[2px] bg-white/15 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-[#ef4444] to-[#d4a24c] origin-left rounded-full"
              style={{ transform: "scaleX(0)", willChange: "transform" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
