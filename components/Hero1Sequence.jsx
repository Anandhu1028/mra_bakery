"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/context/SmoothScrollContext";

const SOURCE_FRAME_COUNT = 197;
const SOURCE_FRAME_NUMBERS = Array.from(
  { length: SOURCE_FRAME_COUNT },
  (_, index) => index + 1
).filter((frameNumber) => frameNumber !== 106 && frameNumber !== 109);
const FRAME_COUNT = SOURCE_FRAME_NUMBERS.length;
const FRAME_CACHE_RADIUS = 6;
const MAX_CONCURRENT_LOADS = 4;
const TRACK_HEIGHT = "600vh";
const BACKGROUND_COLOR = "#000000";

function getFrameUrl(index) {
  const sourceFrame = SOURCE_FRAME_NUMBERS[index - 1];
  return `/hero1/frame_${String(sourceFrame).padStart(3, "0")}.png`;
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    image.src = objectUrl;
  });
}

export default function Hero1Sequence() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const prefersReducedMotionRef = useRef(prefersReducedMotion);

  const trackRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const bitmapsRef = useRef(new Array(FRAME_COUNT).fill(null));
  const pendingRef = useRef(new Set());
  const queuedRef = useRef(new Set());
  const queueRef = useRef([]);
  const activeWorkersRef = useRef(0);
  const loadFrameRef = useRef(null);
  const currentFrameRef = useRef(1);
  const targetFrameRef = useRef(1);
  const lastDrawnFrameRef = useRef(null);
  const rafIdRef = useRef(null);
  const isLoopRunningRef = useRef(false);
  const isVisibleRef = useRef(false);
  const resizeTimeoutRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  const getNearestBitmap = useCallback((frameIndex) => {
    const targetIndex = Math.max(
      1,
      Math.min(FRAME_COUNT, Math.round(frameIndex))
    );
    const bitmaps = bitmapsRef.current;

    if (bitmaps[targetIndex - 1]) {
      return { bitmap: bitmaps[targetIndex - 1], index: targetIndex };
    }

    for (let offset = 1; offset < FRAME_COUNT; offset++) {
      const previous = targetIndex - offset;
      if (previous >= 1 && bitmaps[previous - 1]) {
        return { bitmap: bitmaps[previous - 1], index: previous };
      }

      const next = targetIndex + offset;
      if (next <= FRAME_COUNT && bitmaps[next - 1]) {
        return { bitmap: bitmaps[next - 1], index: next };
      }
    }

    return null;
  }, []);

  const drawFrame = useCallback(
    (frameValue) => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.width || !canvas.height) return;

      const frame = getNearestBitmap(frameValue);
      if (!frame || frame.index === lastDrawnFrameRef.current) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const sourceWidth =
        frame.bitmap.naturalWidth || frame.bitmap.width || 1280;
      const sourceHeight =
        frame.bitmap.naturalHeight || frame.bitmap.height || 720;
      const scale = Math.min(
        canvas.width / sourceWidth,
        canvas.height / sourceHeight
      );
      const drawWidth = Math.round(sourceWidth * scale);
      const drawHeight = Math.round(sourceHeight * scale);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        frame.bitmap,
        Math.round((canvas.width - drawWidth) / 2),
        Math.round((canvas.height - drawHeight) / 2),
        drawWidth,
        drawHeight
      );

      lastDrawnFrameRef.current = frame.index;
    },
    [getNearestBitmap]
  );

  const startRenderLoop = useCallback(() => {
    if (!isVisibleRef.current || isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    const tick = () => {
      rafIdRef.current = null;
      if (!isVisibleRef.current) {
        isLoopRunningRef.current = false;
        return;
      }

      if (prefersReducedMotionRef.current) {
        currentFrameRef.current = 1;
        drawFrame(1);
        isLoopRunningRef.current = false;
        return;
      }

      const current = currentFrameRef.current;
      const target = targetFrameRef.current;
      const next =
        Math.abs(target - current) < 0.03
          ? target
          : current + (target - current) * 0.24;

      currentFrameRef.current = next;
      drawFrame(next);

      if (Math.abs(target - next) < 0.03) {
        currentFrameRef.current = target;
        drawFrame(target);
        isLoopRunningRef.current = false;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  const pumpQueue = useCallback(() => {
    function pump() {
      while (
        activeWorkersRef.current < MAX_CONCURRENT_LOADS &&
        queueRef.current.length > 0 &&
        loadFrameRef.current
      ) {
        const index = queueRef.current.shift();
        queuedRef.current.delete(index);
        activeWorkersRef.current++;

        loadFrameRef.current(index).finally(() => {
          activeWorkersRef.current--;
          pump();
        });
      }
    }

    pump();
  }, []);

  const requestFrames = useCallback(
    (frameValue) => {
      const target = Math.max(
        1,
        Math.min(FRAME_COUNT, Math.round(frameValue))
      );
      targetFrameRef.current = target;

      const candidates = [target];
      for (let offset = 1; offset <= FRAME_CACHE_RADIUS; offset++) {
        if (target + offset <= FRAME_COUNT) candidates.push(target + offset);
        if (target - offset >= 1) candidates.push(target - offset);
      }

      const bitmaps = bitmapsRef.current;
      bitmaps.forEach((bitmap, index) => {
        if (bitmap && Math.abs(index + 1 - target) > FRAME_CACHE_RADIUS) {
          bitmap.close?.();
          bitmaps[index] = null;
        }
      });

      queueRef.current = queueRef.current.filter(
        (index) =>
          Math.abs(index - target) <= FRAME_CACHE_RADIUS &&
          !bitmaps[index - 1] &&
          !pendingRef.current.has(index)
      );
      queuedRef.current = new Set(queueRef.current);

      for (const index of candidates) {
        if (
          !bitmaps[index - 1] &&
          !pendingRef.current.has(index) &&
          !queuedRef.current.has(index)
        ) {
          queueRef.current.push(index);
          queuedRef.current.add(index);
        }
      }

      pumpQueue();
      if (isVisibleRef.current) startRenderLoop();
    },
    [pumpQueue, startRenderLoop]
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const bitmaps = bitmapsRef.current;

    loadFrameRef.current = async (index) => {
      pendingRef.current.add(index);

      try {
        const response = await fetch(getFrameUrl(index), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const bitmap =
          typeof window !== "undefined" && "createImageBitmap" in window
            ? await createImageBitmap(blob)
            : await loadImage(blob);
        if (cancelled) {
          bitmap.close();
          return;
        }

        if (Math.abs(index - targetFrameRef.current) > FRAME_CACHE_RADIUS) {
          bitmap.close();
          return;
        }

        bitmaps[index - 1] = bitmap;
        setIsLoaded(true);
        drawFrame(targetFrameRef.current);
        if (isVisibleRef.current) startRenderLoop();
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) {
          console.error(`Failed to load Hero 1 frame ${index}`, error);
        }
      } finally {
        pendingRef.current.delete(index);
      }
    };

    return () => {
      cancelled = true;
      controller.abort();
      loadFrameRef.current = null;
      queueRef.current = [];
      queuedRef.current.clear();
      bitmaps.forEach((bitmap) => bitmap?.close?.());
      bitmaps.fill(null);
    };
  }, [drawFrame, startRenderLoop]);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!track || !sticky || !canvas) return undefined;

    const resizeCanvas = () => {
      const rect = sticky.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      lastDrawnFrameRef.current = null;
      drawFrame(currentFrameRef.current);
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
    resizeObserver.observe(sticky);
    window.addEventListener("resize", scheduleResize, { passive: true });

    let scrollContext;
    if (!prefersReducedMotion) {
      gsap.registerPlugin(ScrollTrigger);
      scrollContext = gsap.context(() => {
        ScrollTrigger.create({
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const target = 1 + self.progress * (FRAME_COUNT - 1);
            requestFrames(target);
          },
        });
      }, track);
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        requestFrames(targetFrameRef.current);
        startRenderLoop();
      } else {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        isLoopRunningRef.current = false;
      }
    });
    visibilityObserver.observe(track);

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadObserver.disconnect();
          requestFrames(1);
        }
      },
      { rootMargin: "200% 0px" }
    );
    preloadObserver.observe(track);

    return () => {
      scrollContext?.revert();
      visibilityObserver.disconnect();
      preloadObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      isLoopRunningRef.current = false;
    };
  }, [drawFrame, prefersReducedMotion, requestFrames, startRenderLoop]);

  return (
    <section
      ref={trackRef}
      id="hero1"
      aria-label="Hero 1 scroll sequence"
      className="relative w-full bg-black"
      style={{ height: prefersReducedMotion ? "100dvh" : TRACK_HEIGHT }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-black"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 block h-full w-full"
        />
        {!isLoaded && (
          <div
            className="absolute inset-0 bg-black"
            aria-hidden="true"
          />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.96) 0%, rgba(0, 0, 0, 0.82) 6%, rgba(0, 0, 0, 0.48) 18%, transparent 34%), radial-gradient(ellipse 82% 86% at 50% 45%, transparent 58%, rgba(0, 0, 0, 0.48) 100%)",
          }}
        />
      </div>
    </section>
  );
}
