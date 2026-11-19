"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CinematicFoodShowcase — 100% Scroll-Driven Signature Food Showcase
//
// Order:
//   1. Plum Cake (plum-cake)
//
// Smoothness fixes in this version:
//   - Frame window is much larger and direction-aware (loads ahead of the
//     scroll direction), so frames are ready before you reach them.
//   - Eviction uses hysteresis (keep radius > load window) so frames are not
//     closed and re-downloaded again and again.
//   - Time-based damping (frame-rate independent) instead of a fixed lerp.
//   - Canvas DPR capped, smoothing quality "medium" => much cheaper draws.
//   - Draw falls back to the nearest cached frame of the SAME dish, so the
//     image never freezes while a frame is still decoding.
//   - DOM writes only when values actually change.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SHOWCASE_SCENES } from "@/lib/showcaseFrames";
import { usePrefersReducedMotion } from "@/context/SmoothScrollContext";

// ── Configuration ────────────────────────────────────────────────────────────
const ORDERED_IDS = [
  "plum-cake",
];

const DISHES = ORDERED_IDS.map((id) =>
  SHOWCASE_SCENES.find((scene) => scene.id === id)
).filter(Boolean);

const DISH_COUNT = DISHES.length;
const SEGMENT_VH = 100;

// Frame streaming
const FRAME_AHEAD = 30; // frames to load in the scroll direction
const FRAME_BEHIND = 10; // frames to keep ready behind
const FRAME_KEEP_RADIUS = 45; // only evict beyond this (hysteresis)
const MAX_CONCURRENT_FRAME_LOADS = 6;

// Rendering
const DAMPING = 10; // higher = snappier, lower = silkier (try 8 – 14)

const DISH_DURATION_UNITS = DISHES.map((dish) =>
  Math.max(1, dish.frames.length / 120)
);
const TOTAL_DISH_UNITS = DISH_DURATION_UNITS.reduce(
  (total, duration) => total + duration,
  0
);
const STAGE_VH = 100;
const TRANSITION_VH = 100;
const SHOWCASE_SCROLL_VH = TOTAL_DISH_UNITS * SEGMENT_VH;
const TOTAL_HEIGHT_VH = SHOWCASE_SCROLL_VH + TRANSITION_VH + STAGE_VH;

// Frame pacing:
// 0.00 – 0.15: Hold the first frame
// 0.15 – 0.85: Interactive frame scrub
// 0.85 – 1.00: Hold the last frame
const FADE_IN_START = 0.02;
const FADE_IN_END = 0.15;
const FADE_OUT_START = 0.85;
const FADE_OUT_END = 0.98;

// ─────────────────────────────────────────────────────────────────────────────

export default function CinematicFoodShowcase() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // DOM Refs
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const transitionTriggerRef = useRef(null);
  const topCurtainRef = useRef(null);
  const bottomCurtainRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Frame cache: [dishIdx][frameIdx] = ImageBitmap | null
  const cacheRef = useRef(DISHES.map((d) => new Array(d.frames.length).fill(null)));
  const pendingFramesRef = useRef(DISHES.map(() => new Set()));
  const failedFramesRef = useRef(DISHES.map(() => new Set()));
  const frameLoaderRef = useRef(null);
  const activeLoadsRef = useRef(0);
  const requestedDishRef = useRef(-1);
  const targetFrameRef = useRef(0);
  const frameDirectionRef = useRef(1);

  // Engine refs
  const currentValRef = useRef(0); // smoothed cursor ∈ [0, TOTAL_DISH_UNITS]
  const targetValRef = useRef(0); // set by ScrollTrigger
  const activeDishIndexRef = useRef(-1);
  const lastDrawnKeyRef = useRef(-1);
  const lastTickRef = useRef(0);
  const rafIdRef = useRef(null);
  const isLoopRunningRef = useRef(false);
  const isVisibleRef = useRef(false);
  const resizeTimeoutRef = useRef(null);

  // ── Frame streaming: priority list, nearest-first, direction-aware ─────────
  const pumpFrameQueue = useCallback(() => {
    const loadFrame = frameLoaderRef.current;
    if (!loadFrame) return;

    const list = [];
    const dishIdx = requestedDishRef.current;

    if (dishIdx >= 0) {
      const total = DISHES[dishIdx].frames.length;
      const target = targetFrameRef.current;
      const dir = frameDirectionRef.current;
      list.push({ dishIdx, frameIdx: target });
      for (let o = 1; o <= FRAME_AHEAD; o += 1) {
        const fwd = target + dir * o;
        if (fwd >= 0 && fwd < total) list.push({ dishIdx, frameIdx: fwd });
        if (o <= FRAME_BEHIND) {
          const back = target - dir * o;
          if (back >= 0 && back < total) list.push({ dishIdx, frameIdx: back });
        }
      }
    }
    // Frame 0 of every dish (low priority) so its first frame is ready.
    DISHES.forEach((_, d) => list.push({ dishIdx: d, frameIdx: 0 }));

    for (let i = 0; i < list.length; i += 1) {
      if (activeLoadsRef.current >= MAX_CONCURRENT_FRAME_LOADS) break;
      const { dishIdx: d, frameIdx: f } = list[i];
      if (
        cacheRef.current[d][f] ||
        pendingFramesRef.current[d].has(f) ||
        failedFramesRef.current[d].has(f)
      ) {
        continue;
      }

      pendingFramesRef.current[d].add(f);
      activeLoadsRef.current += 1;

      loadFrame(d, f)
        .catch(() => {})
        .finally(() => {
          pendingFramesRef.current[d].delete(f);
          activeLoadsRef.current -= 1;
          pumpFrameQueue();
        });
    }
  }, []);

  // ── Free memory far from the playhead (hysteresis, cheap) ──────────────────
  const evictFrames = useCallback((dishIdx, target, sweepAll) => {
    const sweep = (frames, d) => {
      for (let i = 1; i < frames.length; i += 1) {
        const bmp = frames[i];
        if (!bmp) continue;
        if (d === dishIdx && Math.abs(i - target) <= FRAME_KEEP_RADIUS) continue;
        bmp.close?.();
        frames[i] = null;
      }
    };
    if (sweepAll) {
      cacheRef.current.forEach((frames, d) => sweep(frames, d));
    } else {
      sweep(cacheRef.current[dishIdx], dishIdx);
    }
  }, []);

  // ── Compute dish index and frame index from progress ────────────────────────
  const computeState = useCallback((val) => {
    const clampedVal = Math.min(TOTAL_DISH_UNITS, Math.max(0, val));
    let dishIdx = 0;
    let dishStart = 0;

    while (
      dishIdx < DISH_COUNT - 1 &&
      clampedVal >= dishStart + DISH_DURATION_UNITS[dishIdx]
    ) {
      dishStart += DISH_DURATION_UNITS[dishIdx];
      dishIdx++;
    }

    const s =
      clampedVal >= TOTAL_DISH_UNITS
        ? 1
        : (clampedVal - dishStart) / DISH_DURATION_UNITS[dishIdx];
    const totalFrames = DISHES[dishIdx].frames.length;

    let frameIndex = 0;

    if (dishIdx === DISH_COUNT - 1 && s >= FADE_OUT_START) {
      frameIndex = totalFrames - 1;
    } else if (s <= FADE_IN_START) {
      frameIndex = 0;
    } else if (s < FADE_IN_END) {
      frameIndex = 0;
    } else if (s > FADE_OUT_END) {
      frameIndex = totalFrames - 1;
    } else if (s >= FADE_OUT_START) {
      frameIndex = totalFrames - 1;
    } else {
      const scrubProgress = (s - FADE_IN_END) / (FADE_OUT_START - FADE_IN_END);
      frameIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(scrubProgress * (totalFrames - 1)))
      );
    }

    return {
      dishIdx,
      frameIndex,
    };
  }, []);

  // ── Draw the active frame (contain + letterbox) ────────────────────────────
  const drawFrame = useCallback((dishIdx, targetFrameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const frames = cacheRef.current[dishIdx];
    const totalFrames = DISHES[dishIdx].frames.length;

    // Nearest cached frame of the same dish => never freezes while loading.
    let resolved = Math.min(totalFrames - 1, Math.max(0, targetFrameIndex));
    if (!frames[resolved]) {
      let found = false;
      for (let offset = 1; offset < totalFrames; offset++) {
        const back = resolved - offset;
        const fwd = resolved + offset;
        if (back >= 0 && frames[back]) {
          resolved = back;
          found = true;
          break;
        }
        if (fwd < totalFrames && frames[fwd]) {
          resolved = fwd;
          found = true;
          break;
        }
      }
      if (!found) return;
    }

    const key = dishIdx * 10000 + resolved;
    if (key === lastDrawnKeyRef.current) return;
    lastDrawnKeyRef.current = key;

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", { alpha: false });
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    const bmp = frames[resolved];
    const cw = canvas.width;
    const ch = canvas.height;
    const sw = bmp.width;
    const sh = bmp.height;
    if (cw <= 0 || ch <= 0) return;

    const scale = Math.max(cw / sw, ch / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = Math.round((cw - dw) / 2);
    const dy = Math.round((ch - dh) / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    ctx.drawImage(bmp, dx, dy, dw, dh);
  }, []);

  const requestFrames = useCallback(
    (dishIdx, targetFrameIndex) => {
      const totalFrames = DISHES[dishIdx].frames.length;
      const target = Math.min(totalFrames - 1, Math.max(0, targetFrameIndex));
      const dishChanged = requestedDishRef.current !== dishIdx;

      if (!dishChanged && targetFrameRef.current === target) {
        pumpFrameQueue();
        return;
      }

      frameDirectionRef.current = dishChanged
        ? 1
        : target >= targetFrameRef.current
        ? 1
        : -1;
      requestedDishRef.current = dishIdx;
      targetFrameRef.current = target;

      evictFrames(dishIdx, target, dishChanged);
      pumpFrameQueue();
    },
    [evictFrames, pumpFrameQueue]
  );

  // ── Apply state to DOM & Canvas ────────────────────────────────────────────
  const applyState = useCallback(
    (val, forceRedraw = false) => {
      const { dishIdx, frameIndex } = computeState(val);
      if (dishIdx !== activeDishIndexRef.current || forceRedraw) {
        activeDishIndexRef.current = dishIdx;
      }

      requestFrames(dishIdx, frameIndex);
      drawFrame(dishIdx, frameIndex);
    },
    [computeState, drawFrame, requestFrames]
  );

  // ── Smoothing loop: frame-rate independent, stops when scroll settles ──────
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
    lastTickRef.current = performance.now();

    const tick = (now) => {
      rafIdRef.current = null;
      if (!isVisibleRef.current) {
        isLoopRunningRef.current = false;
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTickRef.current) / 1000));
      lastTickRef.current = now;

      const target = targetValRef.current;
      const current = currentValRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.0004) {
        currentValRef.current = target;
        applyState(target);
        isLoopRunningRef.current = false;
        return;
      }

      const next = current + diff * (1 - Math.exp(-DAMPING * dt));
      currentValRef.current = next;
      applyState(next);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [applyState, prefersReducedMotion]);

  // ── Frame loader (fetch + decode off main thread) ──────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const frameCache = cacheRef.current;
    let cancelled = false;

    const loadFrame = async (dishIdx, frameIdx) => {
      if (cancelled || cacheRef.current[dishIdx][frameIdx]) return;
      const url = DISHES[dishIdx].frames[frameIdx];
      let objectUrl = null;

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Frame request failed with status ${res.status}`);
        }
        const blob = await res.blob();

        let bmp;
        if (typeof window !== "undefined" && "createImageBitmap" in window) {
          bmp = await createImageBitmap(blob);
        } else {
          bmp = await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            objectUrl = URL.createObjectURL(blob);
            img.src = objectUrl;
          });
        }

        if (cancelled || controller.signal.aborted) {
          bmp?.close?.();
          return;
        }

        // Drop frames that arrived after the playhead moved far away.
        const inWindow =
          dishIdx === requestedDishRef.current &&
          Math.abs(frameIdx - targetFrameRef.current) <= FRAME_KEEP_RADIUS;
        if (frameIdx !== 0 && !inWindow) {
          bmp?.close?.();
          return;
        }

        cacheRef.current[dishIdx][frameIdx] = bmp;
        if (dishIdx === requestedDishRef.current) {
          drawFrame(dishIdx, targetFrameRef.current);
        }
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) {
          failedFramesRef.current[dishIdx].add(frameIdx);
          console.error(
            `Failed to load ${DISHES[dishIdx].title} frame ${frameIdx + 1}`,
            error
          );
        }
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };

    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    let started = false;
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          frameLoaderRef.current = loadFrame;
          pumpFrameQueue();
        }
      },
      { rootMargin: "250%" }
    );
    preloadObserver.observe(wrapper);

    return () => {
      cancelled = true;
      preloadObserver.disconnect();
      controller.abort();
      frameLoaderRef.current = null;
      frameCache.forEach((arr) => {
        arr.forEach((bmp) => bmp?.close?.());
        arr.fill(null);
      });
      lastDrawnKeyRef.current = -1;
    };
  }, [drawFrame, pumpFrameQueue]);

  // ── Canvas resize (debounced 150ms) ────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return undefined;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cw = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const ch = Math.max(1, Math.round(canvas.clientHeight * dpr));

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      lastDrawnKeyRef.current = -1;
      applyState(currentValRef.current, true);
    };

    resize();

    const scheduleResize = () => {
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        resizeTimeoutRef.current = null;
        resize();
      }, 150);
    };

    const observer = new ResizeObserver(scheduleResize);
    observer.observe(stage);
    window.addEventListener("resize", scheduleResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleResize);
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [applyState]);

  // ── Visibility (threshold 0: the wrapper is huge, 1% was unreliable) ───────
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
      { threshold: 0 }
    );
    observer.observe(wrapper);

    return () => {
      observer.disconnect();
      stopLoop();
    };
  }, [startRenderLoop, stopLoop]);

  // ── GSAP ScrollTrigger (direct scroll scrub) ───────────────────────────────
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
      end: () => `+=${(SHOWCASE_SCROLL_VH / 100) * window.innerHeight}`,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate(self) {
        targetValRef.current = self.progress * TOTAL_DISH_UNITS;
        startRenderLoop();
      },
    });

    let curtainTimeline;
    if (
      transitionTriggerRef.current &&
      topCurtainRef.current &&
      bottomCurtainRef.current
    ) {
      gsap.set(topCurtainRef.current, { yPercent: -100, visibility: "visible" });
      gsap.set(bottomCurtainRef.current, {
        yPercent: 100,
        visibility: "visible",
      });
      curtainTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: transitionTriggerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      curtainTimeline
        .to(topCurtainRef.current, { yPercent: 0, duration: 0.8, ease: "none" }, 0)
        .to(bottomCurtainRef.current, { yPercent: 0, duration: 0.8, ease: "none" }, 0)
        .to(stageRef.current, { opacity: 0, duration: 0.2, ease: "none" }, 0.8);
    }

    ScrollTrigger.refresh();

    return () => {
      st.kill();
      curtainTimeline?.scrollTrigger?.kill();
      curtainTimeline?.kill();
      stopLoop();
    };
  }, [applyState, prefersReducedMotion, startRenderLoop, stopLoop]);

  const totalHeight = prefersReducedMotion ? "100svh" : `${TOTAL_HEIGHT_VH}vh`;

  return (
    <section
      ref={wrapperRef}
      id="food-showcase"
      aria-label="Signature dishes showcase"
      className="relative w-full bg-[#050505] text-[#f7f0df] select-none"
      style={{ height: totalHeight }}
    >
      {!prefersReducedMotion && (
        <div
          ref={transitionTriggerRef}
          aria-hidden="true"
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: `${SHOWCASE_SCROLL_VH}vh`,
            height: `${TRANSITION_VH}vh`,
          }}
        />
      )}

      {/* ── Sticky Fullscreen Stage (100dvh) ── */}
      <div
        ref={stageRef}
        className="sticky top-0 z-20 h-[100dvh] w-full overflow-hidden bg-[#050505]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* Single hardware-accelerated canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{
            transform: "translateZ(0)",
            backgroundColor: "#050505",
            opacity: 1,
            filter: "none",
            mixBlendMode: "normal",
          }}
        />

        {!prefersReducedMotion && (
          <>
            <div
              ref={topCurtainRef}
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-40 h-1/2 pointer-events-none"
              style={{
                height: "calc(50% + 1px)",
                visibility: "hidden",
                willChange: "transform",
                background:
                  "linear-gradient(to bottom, rgba(2, 2, 2, 0.96) 0%, rgba(6, 6, 6, 0.92) 38%, rgba(9, 9, 9, 0.86) 72%, rgba(11, 11, 11, 0.78) 100%)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                maskImage:
                  "linear-gradient(to bottom, #000 0%, #000 62%, rgba(0, 0, 0, 0.48) 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, #000 0%, #000 62%, rgba(0, 0, 0, 0.48) 100%)",
              }}
            />
            <div
              ref={bottomCurtainRef}
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 z-40 h-1/2 pointer-events-none"
              style={{
                visibility: "hidden",
                willChange: "transform",
                background:
                  "linear-gradient(to top, rgba(2, 2, 2, 0.96) 0%, rgba(6, 6, 6, 0.92) 38%, rgba(9, 9, 9, 0.86) 72%, rgba(11, 11, 11, 0.78) 100%)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                maskImage:
                  "linear-gradient(to top, #000 0%, #000 62%, rgba(0, 0, 0, 0.48) 100%)",
                WebkitMaskImage:
                  "linear-gradient(to top, #000 0%, #000 62%, rgba(0, 0, 0, 0.48) 100%)",
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}