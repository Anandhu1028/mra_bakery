"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  usePrefersReducedMotion,
  useSmoothScroll,
} from "@/context/SmoothScrollContext";

export const FRAME_DIR = "/frames-webp";
export const FILE_PREFIX = "frame_";
export const FILE_EXT = ".webp";
export const PAD = 3;
export const TOTAL_FRAMES = 165;
export const SOURCE_TOTAL_FRAMES = 165;
export const SOURCE_WIDTH = 1280;
export const SOURCE_HEIGHT = 720;
export const HERO_ZOOM = 1;
export const HERO_SHIFT_X = 0;
export const HERO_SHIFT_Y = 0;
export const TRACK_HEIGHT = "400vh";

export default function ScrollSequence({ onProgressUpdate }) {
  const { markImagesReady } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef(null);
  const trackRef = useRef(null);
  const stickyRef = useRef(null);
  const fireOverlayRef = useRef(null);
  const bitmapsRef = useRef(new Array(TOTAL_FRAMES).fill(null));
  const loadFrameRef = useRef(null);
  const currentFrameRef = useRef(1);
  const targetFrameRef = useRef(1);
  const lastDrawnFrameRef = useRef(null);
  const isLoopRunningRef = useRef(false);
  const isVisibleRef = useRef(false);
  const rafIdRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  const getFrameUrl = useCallback((index) => {
    const paddedIndex = String(index).padStart(PAD, "0");
    return `${FRAME_DIR}/${FILE_PREFIX}${paddedIndex}${FILE_EXT}`;
  }, []);

  const getNearestBitmap = useCallback((index) => {
    const bitmaps = bitmapsRef.current;
    const targetIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, index - 1));

    if (bitmaps[targetIndex]) {
      return { bitmap: bitmaps[targetIndex], index: targetIndex };
    }

    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const previous = targetIndex - offset;
      if (previous >= 0 && bitmaps[previous]) {
        return { bitmap: bitmaps[previous], index: previous };
      }

      const next = targetIndex + offset;
      if (next < TOTAL_FRAMES && bitmaps[next]) {
        return { bitmap: bitmaps[next], index: next };
      }
    }

    return null;
  }, []);

  const drawCompositeFrame = useCallback(
    (frameValue) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;

      const clampedFrame = Math.max(
        1,
        Math.min(TOTAL_FRAMES, Math.round(frameValue))
      );
      const frame = getNearestBitmap(clampedFrame);
      if (!frame || frame.index === lastDrawnFrameRef.current) return;

      const width = canvas.width;
      const height = canvas.height;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const sourceWidth = frame.bitmap.width || SOURCE_WIDTH;
      const sourceHeight = frame.bitmap.height || SOURCE_HEIGHT;
      const sourceRatio = sourceWidth / sourceHeight;
      const canvasRatio = width / height;
      let drawWidth;
      let drawHeight;

      if (canvasRatio > sourceRatio) {
        drawWidth = width;
        drawHeight = width / sourceRatio;
      } else {
        drawHeight = height;
        drawWidth = height * sourceRatio;
      }

      drawWidth = Math.round(drawWidth * HERO_ZOOM);
      drawHeight = Math.round(drawHeight * HERO_ZOOM);
      const drawX = Math.round((width - drawWidth) / 2 + HERO_SHIFT_X);
      const drawY = Math.round((height - drawHeight) / 2 + HERO_SHIFT_Y);

      // Only fill background if letterboxing is visible
      if (drawX > 0 || drawY > 0 || drawWidth < width || drawHeight < height) {
        context.fillStyle = "#000000";
        context.fillRect(0, 0, width, height);
      }

      context.drawImage(frame.bitmap, drawX, drawY, drawWidth, drawHeight);
      lastDrawnFrameRef.current = frame.index;
    },
    [getNearestBitmap]
  );

  const updateOverlay = useCallback((frameValue) => {
    if (!fireOverlayRef.current) return;

    const progress = (frameValue - 1) / (TOTAL_FRAMES - 1);
    const opacity =
      progress >= 0.72 ? Math.min(1, (progress - 0.72) / 0.25) : 0;
    fireOverlayRef.current.style.opacity = String(opacity);
  }, []);

  const stopRenderLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isLoopRunningRef.current = false;
  }, []);

  const startRenderLoop = useCallback(() => {
    if (!isVisibleRef.current || isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    const tick = () => {
      rafIdRef.current = null;
      if (!isVisibleRef.current) {
        isLoopRunningRef.current = false;
        return;
      }

      const current = currentFrameRef.current;
      const target = targetFrameRef.current;
      const difference = target - current;

      if (prefersReducedMotion) {
        currentFrameRef.current = 1;
        drawCompositeFrame(1);
        updateOverlay(1);
        isLoopRunningRef.current = false;
        return;
      }

      // Responsive, fluid smoothing (factor 0.24 provides instant feel with zero jitter)
      const nextFrame =
        Math.abs(difference) < 0.04 ? target : current + difference * 0.24;

      currentFrameRef.current = nextFrame;
      drawCompositeFrame(nextFrame);
      updateOverlay(nextFrame);

      if (Math.abs(target - nextFrame) < 0.04) {
        currentFrameRef.current = target;
        drawCompositeFrame(target);
        updateOverlay(target);
        isLoopRunningRef.current = false;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawCompositeFrame, prefersReducedMotion, updateOverlay]);

  // Request frame on-demand when scrubbing ahead
  const requestFrameOnDemand = useCallback((frameIndex) => {
    const idx = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameIndex)));
    loadFrameRef.current?.(idx);
    for (let delta = 1; delta <= 3; delta++) {
      if (idx + delta <= TOTAL_FRAMES) loadFrameRef.current?.(idx + delta);
      if (idx - delta >= 1) loadFrameRef.current?.(idx - delta);
    }
  }, []);

  // Frame preloading and caching
  useEffect(() => {
    const controller = new AbortController();
    const bitmaps = bitmapsRef.current;
    let cancelled = false;
    let loadedCount = 0;
    let initialFramesReady = false;

    bitmaps.forEach((bitmap) => bitmap?.close?.());
    bitmaps.fill(null);

    const reportProgress = () => {
      const progress = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
      onProgressUpdateRef.current?.(progress, initialFramesReady);
    };

    const loadFrame = async (index) => {
      if (cancelled || bitmaps[index - 1]) return;

      try {
        const response = await fetch(getFrameUrl(index), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        if (cancelled) {
          bitmap.close();
          return;
        }

        bitmaps[index - 1] = bitmap;
        loadedCount++;

        if (
          isVisibleRef.current &&
          index === Math.round(currentFrameRef.current)
        ) {
          startRenderLoop();
        }

        if (index === 1 && !initialFramesReady) {
          setIsLoaded(true);
          drawCompositeFrame(1);
        }

        reportProgress();
        return true;
      } catch (error) {
        if (!cancelled) {
          console.error(`Failed to load hero frame ${index}`, error);
        }
        return false;
      }
    };

    loadFrameRef.current = loadFrame;

    const loadAllFrames = async () => {
      // 1. Immediately load frame 1 for instant display
      const firstFrameLoaded = await loadFrame(1);
      if (cancelled) return;
      if (firstFrameLoaded) markImagesReady("hero");

      // 2. Concurrently load the first 35 frames (instant scroll response)
      const initialIndices = Array.from({ length: 34 }, (_, i) => i + 2);
      await Promise.all(initialIndices.map(loadFrame));
      if (cancelled) return;

      initialFramesReady = true;
      reportProgress();

      // 3. Stream remaining frames in a concurrent worker pool
      const remaining = [];
      for (let i = 36; i <= TOTAL_FRAMES; i++) {
        remaining.push(i);
      }

      const CONCURRENCY = 8;
      let poolCursor = 0;
      const worker = async () => {
        while (poolCursor < remaining.length && !cancelled) {
          const nextIndex = remaining[poolCursor++];
          await loadFrame(nextIndex);
        }
      };

      await Promise.all(
        Array.from({ length: CONCURRENCY }, () => worker())
      );
    };

    loadAllFrames();

    return () => {
      cancelled = true;
      controller.abort();
      bitmaps.forEach((bitmap) => bitmap?.close?.());
      bitmaps.fill(null);
      lastDrawnFrameRef.current = null;
    };
  }, [drawCompositeFrame, getFrameUrl, markImagesReady, startRenderLoop]);

  useEffect(() => {
    if (!isLoaded) return;

    gsap.registerPlugin(ScrollTrigger);

    const canvas = canvasRef.current;
    const track = trackRef.current;
    const stickyStage = stickyRef.current;
    if (!canvas || !track || !stickyStage) return;

    const resizeCanvas = () => {
      const rect = stickyStage.getBoundingClientRect();
      // Cap DPR at 1.5 for crisp clarity without GPU fill-rate stalls on laptops
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);

      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      lastDrawnFrameRef.current = null;
      drawCompositeFrame(currentFrameRef.current);
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
      drawCompositeFrame(1);
      updateOverlay(1);
    }

    // Direct, buttery smooth scroll connection
    const context = gsap.context(() => {
      if (!prefersReducedMotion) {
        ScrollTrigger.create({
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Direct zero-delay linear mapping from scroll progress (0..1) to frames (1..165)
            const target = 1 + self.progress * (TOTAL_FRAMES - 1);
            targetFrameRef.current = target;
            requestFrameOnDemand(target);
            startRenderLoop();
          },
        });
      }
    }, track);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          startRenderLoop();
        } else {
          stopRenderLoop();
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(track);

    return () => {
      context.revert();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      stopRenderLoop();
    };
  }, [
    drawCompositeFrame,
    isLoaded,
    prefersReducedMotion,
    requestFrameOnDemand,
    startRenderLoop,
    stopRenderLoop,
    updateOverlay,
  ]);

  return (
    <section
      ref={trackRef}
      id="hero-track"
      className="relative w-full bg-black"
      style={{ height: prefersReducedMotion ? "100svh" : TRACK_HEIGHT }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden bg-black flex items-center justify-center z-10"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block border-0 outline-none"
          style={{
            transform: "translate3d(0, 0, 0)",
            backgroundColor: "#000000",
            filter: "contrast(1.06) saturate(1.05) brightness(1.01)",
          }}
        />

        {/* Clean cinematic edge vignette (no murky center blur) */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 82%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Top Fade */}
        <div className="absolute top-0 inset-x-0 h-24 md:h-36 pointer-events-none z-11 bg-gradient-to-b from-black via-black/60 to-transparent" />

        {/* Warm Ember Glow Overlay at the end of the sequence */}
        <div
          ref={fireOverlayRef}
          className="absolute inset-0 pointer-events-none z-12 transition-opacity duration-150 ease-out"
          style={{
            opacity: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(239,68,68,0.15) 50%, rgba(13,13,13,0.92) 85%, #000 100%)",
          }}
        />

        {/* Bottom Fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 md:h-36 pointer-events-none z-13 bg-gradient-to-b from-transparent via-black/60 to-black" />
      </div>
    </section>
  );
}
