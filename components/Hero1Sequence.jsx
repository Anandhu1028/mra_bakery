"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/context/SmoothScrollContext";

const FRAME_COUNT = 240;
const FRAME_AHEAD = 36; // frames loaded in the scroll direction
const FRAME_BEHIND = 12; // frames kept ready behind
const KEEP_RADIUS = 50; // evict only beyond this (hysteresis, saves memory)
const MAX_CONCURRENT_LOADS = 6;
const TRACK_HEIGHT = "600vh";
const BACKGROUND_COLOR = "#000000";
const MAX_DPR = 1.5;
const DAMPING = 9; // higher = snappier, lower = silkier (try 7 – 12)

function getFrameUrl(index) {
  return `/hero/${String(index).padStart(5, "0")}.webp`;
}

export default function Hero1Sequence() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const trackRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const bitmapsRef = useRef(new Array(FRAME_COUNT).fill(null));
  const pendingRef = useRef(new Set());
  const frameRef = useRef(1); // frame we want to show (from smoothed progress)
  const directionRef = useRef(1);
  const targetProgressRef = useRef(0); // raw scroll progress
  const currentProgressRef = useRef(0); // smoothed progress
  const lastTickRef = useRef(0);
  const lastDrawnRef = useRef(null);
  const lastEvictRef = useRef(-999);
  const rafIdRef = useRef(null);
  const loopRunningRef = useRef(false);
  const drawRafRef = useRef(null);
  const isVisibleRef = useRef(false);
  const headerHeightRef = useRef(0);
  const pixelRatioRef = useRef(1);
  const abortRef = useRef(null);
  const generationRef = useRef(0);
  const requestFramesRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getNearestBitmap = useCallback((target) => {
    const bitmaps = bitmapsRef.current;
    if (bitmaps[target - 1]) return { bitmap: bitmaps[target - 1], index: target };
    for (let o = 1; o < FRAME_COUNT; o++) {
      const p = target - o;
      if (p >= 1 && bitmaps[p - 1]) return { bitmap: bitmaps[p - 1], index: p };
      const n = target + o;
      if (n <= FRAME_COUNT && bitmaps[n - 1]) return { bitmap: bitmaps[n - 1], index: n };
    }
    return null;
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !canvas.width || !canvas.height) return;

    const frame = getNearestBitmap(frameRef.current);
    if (!frame || frame.index === lastDrawnRef.current) return;

    const sw = frame.bitmap.width;
    const sh = frame.bitmap.height;
    const topInset = Math.min(
      canvas.height,
      Math.round(headerHeightRef.current * pixelRatioRef.current)
    );
    const availH = canvas.height - topInset;
    if (availH <= 0) return;

    const scale = Math.max(canvas.width / sw, availH / sh);
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);

    ctx.drawImage(
      frame.bitmap,
      Math.round((canvas.width - dw) / 2),
      topInset + Math.round((availH - dh) / 2),
      dw,
      dh
    );

    // Header strip black, to hide image overflow
    if (topInset > 0) {
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, canvas.width, topInset);
    }

    lastDrawnRef.current = frame.index;
  }, [getNearestBitmap]);

  // Used when a frame finishes loading (outside the smoothing loop)
  const scheduleDraw = useCallback(() => {
    if (drawRafRef.current !== null || !isVisibleRef.current) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      drawFrame();
    });
  }, [drawFrame]);

  const loadFrame = useCallback(
    async (index, generation) => {
      if (bitmapsRef.current[index - 1] || pendingRef.current.has(index)) return;
      pendingRef.current.add(index);
      try {
        const res = await fetch(getFrameUrl(index), {
          signal: abortRef.current?.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);

        // Stale (unmounted) or far from the playhead now => discard
        if (
          generation !== generationRef.current ||
          (index !== 1 && Math.abs(index - frameRef.current) > KEEP_RADIUS)
        ) {
          bitmap.close();
          return;
        }
        bitmapsRef.current[index - 1] = bitmap;

        if (index === 1) {
          setIsLoaded(true);
          lastDrawnRef.current = null;
          drawFrame();
        }
        if (Math.abs(index - frameRef.current) <= 2) {
          lastDrawnRef.current = null;
          scheduleDraw();
        }
      } catch (e) {
        if (e?.name !== "AbortError") console.error(`Frame ${index} failed`, e);
      } finally {
        pendingRef.current.delete(index);
        // Keep the pipeline full: as soon as one finishes, start the next.
        if (generation === generationRef.current) {
          requestFramesRef.current?.(frameRef.current);
        }
      }
    },
    [drawFrame, scheduleDraw]
  );

  const requestFrames = useCallback(
    (target) => {
      const generation = generationRef.current;
      const dir = directionRef.current;

      // Nearest-first, biased to the scroll direction
      const wanted = [target];
      for (let o = 1; o <= FRAME_AHEAD; o++) {
        const fwd = target + dir * o;
        if (fwd >= 1 && fwd <= FRAME_COUNT) wanted.push(fwd);
        if (o <= FRAME_BEHIND) {
          const back = target - dir * o;
          if (back >= 1 && back <= FRAME_COUNT) wanted.push(back);
        }
      }

      for (const idx of wanted) {
        if (pendingRef.current.size >= MAX_CONCURRENT_LOADS) break;
        if (!bitmapsRef.current[idx - 1] && !pendingRef.current.has(idx)) {
          loadFrame(idx, generation);
        }
      }

      // Evict only when the playhead moved a bit (not on every scroll tick)
      if (Math.abs(target - lastEvictRef.current) >= 8) {
        lastEvictRef.current = target;
        const bitmaps = bitmapsRef.current;
        for (let i = 1; i < FRAME_COUNT; i++) {
          if (bitmaps[i] && Math.abs(i + 1 - target) > KEEP_RADIUS) {
            bitmaps[i].close?.();
            bitmaps[i] = null;
          }
        }
      }
    },
    [loadFrame]
  );

  useEffect(() => {
    requestFramesRef.current = requestFrames;
  }, [requestFrames]);

  // ── Smoothing loop: frame-rate independent, stops when settled ─────────────
  const startLoop = useCallback(() => {
    if (loopRunningRef.current || !isVisibleRef.current) return;
    loopRunningRef.current = true;
    lastTickRef.current = performance.now();

    const tick = (now) => {
      rafIdRef.current = null;
      if (!isVisibleRef.current) {
        loopRunningRef.current = false;
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTickRef.current) / 1000));
      lastTickRef.current = now;

      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;
      const settled = Math.abs(diff) < 0.00005;

      const next = settled ? target : current + diff * (1 - Math.exp(-DAMPING * dt));
      currentProgressRef.current = next;

      const frame = Math.max(
        1,
        Math.min(FRAME_COUNT, Math.round(1 + next * (FRAME_COUNT - 1)))
      );

      if (frame !== frameRef.current) {
        directionRef.current = frame > frameRef.current ? 1 : -1;
        frameRef.current = frame;
        requestFrames(frame);
      }
      drawFrame();

      if (settled) {
        loopRunningRef.current = false;
        return;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawFrame, requestFrames]);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!track || !sticky || !canvas) return undefined;

    const header = document.querySelector("header");
    generationRef.current++;
    abortRef.current = new AbortController();
    ctxRef.current = canvas.getContext("2d", { alpha: false });
    if (ctxRef.current) {
      ctxRef.current.imageSmoothingEnabled = true;
      ctxRef.current.imageSmoothingQuality = "medium";
    }

    const resizeCanvas = () => {
      headerHeightRef.current =
        header?.getBoundingClientRect().height ?? 0;
      const rect = sticky.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      pixelRatioRef.current = dpr;
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        if (ctxRef.current) {
          ctxRef.current.imageSmoothingEnabled = true;
          ctxRef.current.imageSmoothingQuality = "medium";
        }
      }
      lastDrawnRef.current = null;
      drawFrame();
    };

    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    };

    resizeCanvas();
    window.addEventListener("resize", onResize, { passive: true });

    const headerObserver = header ? new ResizeObserver(() => {
      const height = header.getBoundingClientRect().height;
      if (height === headerHeightRef.current) return;
      headerHeightRef.current = height;
      lastDrawnRef.current = null;
      scheduleDraw();
    }) : null;
    headerObserver?.observe(header);

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
            targetProgressRef.current = self.progress;
            startLoop();
          },
        });
      }, track);
    }

    const visObserver = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          requestFrames(frameRef.current);
          scheduleDraw();
          startLoop();
        }
      },
      { threshold: 0 }
    );
    visObserver.observe(track);

    const preObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preObserver.disconnect();
          requestFrames(1);
        }
      },
      { rootMargin: "200% 0px" }
    );
    preObserver.observe(track);

    return () => {
      generationRef.current++;
      abortRef.current?.abort();
      scrollContext?.revert();
      visObserver.disconnect();
      preObserver.disconnect();
      headerObserver?.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (drawRafRef.current !== null) cancelAnimationFrame(drawRafRef.current);
      rafIdRef.current = null;
      drawRafRef.current = null;
      loopRunningRef.current = false;
      bitmapsRef.current.forEach((b) => b?.close?.());
      bitmapsRef.current.fill(null);
      pendingRef.current.clear();
    };
  }, [drawFrame, prefersReducedMotion, requestFrames, scheduleDraw, startLoop]);

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
          <div className="absolute inset-0 bg-black" aria-hidden="true" />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.96) 0%, rgba(0, 0, 0, 0.82) 10%, rgba(0, 0, 0, 0.56) 22%, rgba(0, 0, 0, 0.3) 36%, rgba(0, 0, 0, 0.12) 48%, transparent 58%), radial-gradient(ellipse 82% 86% at 50% 45%, transparent 58%, rgba(0, 0, 0, 0.48) 100%)",
          }}
        />
        <h1
          className={`hero1-sequence-heading pointer-events-none absolute left-6 top-1/2 z-30 -translate-y-1/2 sm:left-12 lg:left-20 ${
            isLoaded ? "is-ready" : ""
          }`}
        >
          <span className="hero1-sequence-line" data-copy-line="1">
            <span className="hero1-sequence-row">Where Flavour</span>
            <span className="hero1-sequence-row">Meets</span>
            <span className="hero1-sequence-row hero1-sequence-highlight">
              Elegance
            </span>
          </span>
          <span className="hero1-sequence-line" data-copy-line="2">
            <span className="hero1-sequence-row">A Taste Worth</span>
            <span className="hero1-sequence-row hero1-sequence-highlight">
              Remembering
            </span>
          </span>
          <span className="hero1-sequence-line" data-copy-line="3">
            <span className="hero1-sequence-row">Crafted to</span>
            <span className="hero1-sequence-row">Delight Every</span>
            <span className="hero1-sequence-row hero1-sequence-highlight">
              Sense
            </span>
          </span>
        </h1>
      </div>
    </section>
  );
}