"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  usePrefersReducedMotion,
  useSmoothScroll,
} from "@/context/SmoothScrollContext";

// =========================================================================
// CAKE SEQUENCE CONFIGURATION CONSTANTS
// =========================================================================
export const CAKE_FRAME_DIR = "/cake_frames-webp";
export const CAKE_FILE_PREFIX = "frame_";
export const CAKE_FILE_EXT = ".webp";
export const CAKE_PAD = 3;
export const CAKE_START_FRAME = 3; // frame_003.webp
export const CAKE_END_FRAME = 144; // frame_144.webp
export const CAKE_TOTAL_FRAMES = 120;
export const CAKE_SOURCE_WIDTH = 1280;
export const CAKE_SOURCE_HEIGHT = 720;

// Tuning parameters
export const CAKE_SMOOTHING = 0.1;
export const CAKE_TRACK_HEIGHT = "450vh";

export default function CakeSequence() {
  const { markImagesReady } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();

  // DOM Refs
  const canvasRef = useRef(null);
  const trackRef = useRef(null);
  const stickyRef = useRef(null);
  const topBlendRef = useRef(null);
  const bottomBlendRef = useRef(null);

  // Engine Refs
  const bitmapsRef = useRef(new Array(CAKE_TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(null);
  const lastRequestedFrameRef = useRef(null);
  const sectionMetricsRef = useRef({ height: 0 });
  const isLoopRunningRef = useRef(false);
  const isVisibleRef = useRef(false);
  const rafIdRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);

  // Frame URL resolver
  const getFrameUrl = useCallback((frameIndex) => {
    const sourceFrame =
      CAKE_START_FRAME +
      Math.round(
        (frameIndex * (CAKE_END_FRAME - CAKE_START_FRAME)) /
          (CAKE_TOTAL_FRAMES - 1)
      );
    const padStr = String(sourceFrame).padStart(CAKE_PAD, "0");
    return `${CAKE_FRAME_DIR}/${CAKE_FILE_PREFIX}${padStr}${CAKE_FILE_EXT}`;
  }, []);

  // Retrieve nearest loaded bitmap
  const getNearestBitmap = useCallback((frameIndex) => {
    const bitmaps = bitmapsRef.current;
    const targetIdx = Math.max(
      0,
      Math.min(CAKE_TOTAL_FRAMES - 1, frameIndex)
    );

    if (bitmaps[targetIdx]) {
      return { bitmap: bitmaps[targetIdx], index: targetIdx };
    }

    for (let offset = 1; offset < CAKE_TOTAL_FRAMES; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && bitmaps[prev]) {
        return { bitmap: bitmaps[prev], index: prev };
      }
      const next = targetIdx + offset;
      if (next < CAKE_TOTAL_FRAMES && bitmaps[next]) {
        return { bitmap: bitmaps[next], index: next };
      }
    }
    return null;
  }, []);

  // Draw decoded frames at the canvas's actual backing resolution.
  const drawCompositeFrame = useCallback(
    (frameVal) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) return;

      const clampedIndex = Math.max(
        0,
        Math.min(CAKE_TOTAL_FRAMES - 1, Math.round(frameVal))
      );
      const frame = getNearestBitmap(clampedIndex);
      if (!frame || frame.index === lastDrawnFrameRef.current) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, cw, ch);

      const srcW =
        frame.bitmap.naturalWidth || frame.bitmap.width || CAKE_SOURCE_WIDTH;
      const srcH =
        frame.bitmap.naturalHeight || frame.bitmap.height || CAKE_SOURCE_HEIGHT;
      const scale = Math.max(cw / srcW, ch / srcH);
      const drawW = Math.round(srcW * scale);
      const drawH = Math.round(srcH * scale);

      // Subject shift: shift canvas subject right on desktop to leave clear negative space on left for text
      const shiftX = cw >= 960 ? Math.round(cw * 0.16) : 0;
      const dx = Math.round((cw - drawW) / 2 + shiftX);
      const dy = Math.round((ch - drawH) / 2);

      ctx.globalAlpha = 1.0;
      ctx.drawImage(frame.bitmap, dx, dy, drawW, drawH);
      lastDrawnFrameRef.current = frame.index;
    },
    [getNearestBitmap]
  );

  // Entrance and exit blend updater
  const updateBlends = useCallback((progress) => {
    // Dynamic Entrance & Exit Screen Blend
    // Entrance: starts solid black, dissolves cleanly as you scroll in
    if (topBlendRef.current) {
      let enterOp = 0;
      if (progress < 0.12) {
        enterOp = Math.max(0, 1 - progress / 0.12);
      }
      topBlendRef.current.style.opacity = enterOp;
    }

    // Exit: blends into pure black before transitioning to Signature Dishes
    if (bottomBlendRef.current) {
      let exitOp = 0;
      if (progress > 0.86) {
        exitOp = Math.min(1, (progress - 0.86) / 0.14);
      }
      bottomBlendRef.current.style.opacity = exitOp;
    }
  }, []);

  // Render loop
  const startRenderLoop = useCallback(() => {
    if (!isVisibleRef.current || isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    const tick = () => {
      rafIdRef.current = null;
      if (!isVisibleRef.current) {
        isLoopRunningRef.current = false;
        return;
      }

      const diff = targetFrameRef.current - currentFrameRef.current;
      const nextFrame =
        Math.abs(diff) < 0.01
          ? targetFrameRef.current
          : currentFrameRef.current + diff * CAKE_SMOOTHING;
      currentFrameRef.current = nextFrame;
      const roundedFrame = Math.round(nextFrame);
      if (roundedFrame !== lastRequestedFrameRef.current) {
        lastRequestedFrameRef.current = roundedFrame;
        drawCompositeFrame(roundedFrame);
      }
      updateBlends(nextFrame / (CAKE_TOTAL_FRAMES - 1));

      if (Math.abs(targetFrameRef.current - nextFrame) < 0.01) {
        isLoopRunningRef.current = false;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawCompositeFrame, updateBlends]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bufferWidth = Math.round(rect.width * dpr);
    const bufferHeight = Math.round(rect.height * dpr);
    if (canvas.width !== bufferWidth) canvas.width = bufferWidth;
    if (canvas.height !== bufferHeight) canvas.height = bufferHeight;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }

    const track = trackRef.current;
    if (track) {
      const sectionRect = track.getBoundingClientRect();
      sectionMetricsRef.current = {
        height: sectionRect.height,
      };
    }

    lastDrawnFrameRef.current = null;
    lastRequestedFrameRef.current = null;
    drawCompositeFrame(currentFrameRef.current);
  }, [drawCompositeFrame]);

  // Resize handler
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current !== null) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      resizeCanvas();
      ScrollTrigger.refresh();
      resizeTimeoutRef.current = null;
    }, 150);
  }, [resizeCanvas]);

  // Frame Loading
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isCancelled = false;
    const controller = new AbortController();
    const bitmaps = bitmapsRef.current;

    const loadSingleBitmap = async (frameIndex) => {
      if (isCancelled || bitmaps[frameIndex]) return;
      const url = getFrameUrl(frameIndex);

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (isCancelled) return;

        let bitmap = null;
        if (typeof window.createImageBitmap === "function") {
          bitmap = await createImageBitmap(blob);
        } else {
          const objectUrl = URL.createObjectURL(blob);
          try {
            const img = new window.Image();
            img.src = objectUrl;
            await img.decode();
            bitmap = img;
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        }

        if (isCancelled) {
          if (bitmap && typeof bitmap.close === "function") bitmap.close();
          return;
        }

        bitmaps[frameIndex] = bitmap;
        if (frameIndex === 0) {
          resizeCanvas();
          setIsLoaded(true);
          markImagesReady("cake-sequence");
        }
        if (isVisibleRef.current) {
          lastRequestedFrameRef.current = null;
          startRenderLoop();
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(`Failed to load cake sequence frame ${frameIndex}`, err);
        }
      }
    };

    const loadAllFrames = async () => {
      await loadSingleBitmap(0);

      if (isCancelled) return;

      const BATCH_SIZE = 10;
      for (let i = 1; i < CAKE_TOTAL_FRAMES && !isCancelled; i += BATCH_SIZE) {
        if (isCancelled) break;
        const chunk = Array.from(
          { length: Math.min(BATCH_SIZE, CAKE_TOTAL_FRAMES - i) },
          (_, index) => i + index
        );
        await Promise.all(chunk.map(loadSingleBitmap));
      }

    };

    loadAllFrames();

    return () => {
      isCancelled = true;
      controller.abort();
      bitmaps.forEach((bitmap) => bitmap?.close?.());
      bitmaps.fill(null);
      lastDrawnFrameRef.current = null;
      lastRequestedFrameRef.current = null;
    };
  }, [
    drawCompositeFrame,
    getFrameUrl,
    markImagesReady,
    resizeCanvas,
    startRenderLoop,
  ]);

  // Lenis + GSAP ScrollTrigger Integration
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    resizeCanvas();
    window.addEventListener("resize", handleResize);

    const context = gsap.context(() => {
      if (!prefersReducedMotion && trackRef.current && stickyRef.current) {
        const progress = { value: 0 };
        gsap.to(progress, {
          value: 1,
          ease: "none",
          onUpdate: () => {
            targetFrameRef.current = progress.value * (CAKE_TOTAL_FRAMES - 1);
            startRenderLoop();
          },
          scrollTrigger: {
            trigger: trackRef.current,
            start: "top top",
            end: () =>
              `+=${Math.max(
                0,
                sectionMetricsRef.current.height - window.innerHeight
              )}`,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      } else {
        currentFrameRef.current = 0;
        targetFrameRef.current = 0;
        drawCompositeFrame(0);
        updateBlends(0);
      }
    }, trackRef.current);

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

    if (trackRef.current) {
      observer.observe(trackRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      context.revert();
      observer.disconnect();
    };
  }, [
    isLoaded,
    prefersReducedMotion,
    handleResize,
    resizeCanvas,
    drawCompositeFrame,
    startRenderLoop,
    updateBlends,
  ]);

  return (
    <section
      ref={trackRef}
      id="cake-track"
      className="relative w-full bg-black"
      style={{ height: prefersReducedMotion ? "100svh" : CAKE_TRACK_HEIGHT }}
    >
      {/* Sticky Fullscreen Inner Viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-black flex items-center justify-center z-10"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* Main canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block border-0 outline-none"
          style={{
            width: "100%",
            height: "100%",
            transform: "translateZ(0)",
            backgroundColor: "#000000",
          }}
        />

        {/* Cinematic Vignette: Soft Dark Feathering on All 4 Edges for Seamless Screen Fusion */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 80px 24px rgba(0,0,0,0.85)",
          }}
        />

        {/* Top Edge Feather Blend (Fades Story section into Cake sequence) */}
        <div className="absolute top-0 inset-x-0 h-40 md:h-56 pointer-events-none bg-gradient-to-b from-black via-black/70 to-transparent z-15" />

        {/* Dynamic Entrance Fade Overlay (Ensures 0px jump when scrolling down from Story) */}
        <div
          ref={topBlendRef}
          className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-150 ease-out z-16"
          style={{ opacity: 1 }}
        />

        {/* Dynamic Exit Fade Overlay (Blends out into pure black for Dishes section) */}
        <div
          ref={bottomBlendRef}
          className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-150 ease-out z-16"
          style={{ opacity: 0 }}
        />

        {/* Bottom Edge Feather Blend (Seamless transition to Dishes section) */}
        <div className="absolute bottom-0 inset-x-0 h-44 md:h-64 pointer-events-none bg-gradient-to-t from-black via-black/80 to-transparent z-15" />

        {/* Soft Contrast Gradient for Text Readability - deeper and broader on start side */}
        <div className="absolute inset-y-0 start-0 w-full md:w-3/5 lg:w-1/2 pointer-events-none bg-gradient-to-r from-black/95 via-black/60 to-transparent [dir=rtl]:bg-gradient-to-l z-17" />

        {/* Subtle Film Grain */}
        <div className="absolute inset-0 pointer-events-none bg-film-grain opacity-20 mix-blend-overlay z-18" />

      </div>
    </section>
  );
}
