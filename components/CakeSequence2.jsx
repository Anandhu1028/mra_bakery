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
  const { markImagesReady } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();

  // DOM Refs
  const trackRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const ambientGlowRef = useRef(null);
  const bottomBlendRef = useRef(null);

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

  // ── Atmospheric Lighting & Exit Blend ──────────────────────────────────
  const updateCinematicExperience = useCallback((progress) => {
    // Ambient Glow Depth Pulse (direct opacity, zero CSS transition clash)
    if (ambientGlowRef.current) {
      const glowOpacity = 0.5 + Math.sin(progress * Math.PI) * 0.45;
      ambientGlowRef.current.style.opacity = glowOpacity.toFixed(2);
    }

    // Dynamic Exit Blend into Story Section
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

        {/* Subtle Left-Side Cinematic Shade */}
        <div className="absolute inset-y-0 start-0 w-full md:w-3/5 lg:w-1/2 pointer-events-none bg-gradient-to-r from-black/95 via-black/60 to-transparent z-17" />
      </div>
    </section>
  );
}
