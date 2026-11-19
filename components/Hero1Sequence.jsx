"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/context/SmoothScrollContext";
import styles from "./Hero1Sequence.module.css";

const FRAME_COUNT = 240;
const FRAME_AHEAD = 36; // frames loaded in the scroll direction
const FRAME_BEHIND = 12; // frames kept ready behind
const KEEP_RADIUS = 50; // evict only beyond this (hysteresis, saves memory)
const MAX_CONCURRENT_LOADS = 6;
const TRACK_HEIGHT = "600vh";
const MAX_DPR = 1.5;
const DAMPING = 9; // higher = snappier, lower = silkier (try 7 – 12)
const INTRO_FADE_START = 0.02;
const INTRO_FADE_END = 0.06;
const INTRO_SLIDE_DURATION = 1.25;
const INTRO_FINAL_DELAY = INTRO_SLIDE_DURATION;

const textSections = [
  {
    start: 51,
    end: 101,
    align: "left",
    variant: "default",
    title: "A TASTE WORTH REMEMBERING",
    titleLine: "A TASTE WORTH",
    highlightLine: "REMEMBERING",
  },
  {
    start: 220,
    end: FRAME_COUNT,
    align: "left",
    variant: "default",
    title: "CRAFTED TO DELIGHT EVERY SENSE",
    titleLine: "CRAFTED TO DELIGHT",
    highlightLine: "EVERY SENSE",
  },
];

function getFrameUrl(index) {
  return `/hero/${String(index).padStart(5, "0")}.webp`;
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getIntroOpacity(progress) {
  const fadeProgress = clamp(
    (progress - INTRO_FADE_START) / (INTRO_FADE_END - INTRO_FADE_START)
  );
  return 1 - easeInOutCubic(fadeProgress);
}

export default function Hero1Sequence() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const trackRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const introRef = useRef(null);
  const introCurtainRef = useRef(null);
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
  const abortRef = useRef(null);
  const generationRef = useRef(0);
  const requestFramesRef = useRef(null);
  const readyRef = useRef(false);
  const firstFrameReadyRef = useRef(false);
  const pageLoadCompleteRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);

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
    const scale = Math.max(canvas.width / sw, canvas.height / sh);
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);

    ctx.drawImage(
      frame.bitmap,
      Math.round((canvas.width - dw) / 2),
      Math.round((canvas.height - dh) / 2),
      dw,
      dh
    );

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
          lastDrawnRef.current = null;
          drawFrame();
          firstFrameReadyRef.current = true;
          if (pageLoadCompleteRef.current) {
            readyRef.current = true;
            setReady(true);
          }
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
    [drawFrame, scheduleDraw, setReady]
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
      const introOpacity = readyRef.current ? getIntroOpacity(next) : 0;
      if (introRef.current) introRef.current.style.opacity = String(introOpacity);
      if (introCurtainRef.current) {
        introCurtainRef.current.style.opacity = String(
          readyRef.current ? introOpacity : 1
        );
      }

      const frame = Math.max(
        1,
        Math.min(FRAME_COUNT, Math.round(1 + next * (FRAME_COUNT - 1)))
      );

      if (frame !== frameRef.current) {
        directionRef.current = frame > frameRef.current ? 1 : -1;
        frameRef.current = frame;
        setCurrentFrame(frame);
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

    const handlePageLoad = () => {
      pageLoadCompleteRef.current = true;
      if (firstFrameReadyRef.current && !readyRef.current) {
        readyRef.current = true;
        setReady(true);
      }
    };

    if (document.readyState === "complete") {
      handlePageLoad();
    } else {
      window.addEventListener("load", handlePageLoad, { once: true });
    }

    generationRef.current++;
    abortRef.current = new AbortController();
    ctxRef.current = canvas.getContext("2d", { alpha: false });
    if (ctxRef.current) {
      ctxRef.current.imageSmoothingEnabled = true;
      ctxRef.current.imageSmoothingQuality = "medium";
    }

    const resizeCanvas = () => {
      const rect = sticky.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
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
    loadFrame(1, generationRef.current);
    window.addEventListener("resize", onResize, { passive: true });

    let scrollContext;
    gsap.registerPlugin(ScrollTrigger);
    scrollContext = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const introOpacity = readyRef.current
            ? getIntroOpacity(self.progress)
            : 0;
          if (introRef.current) {
            introRef.current.style.opacity = String(introOpacity);
          }
          if (introCurtainRef.current) {
            introCurtainRef.current.style.opacity = String(
              readyRef.current ? introOpacity : 1
            );
          }

          if (prefersReducedMotion) {
            const frame = Math.max(
              1,
              Math.min(FRAME_COUNT, Math.round(1 + self.progress * (FRAME_COUNT - 1)))
            );
            if (frame !== frameRef.current) {
              directionRef.current = frame > frameRef.current ? 1 : -1;
              frameRef.current = frame;
              currentProgressRef.current = self.progress;
              targetProgressRef.current = self.progress;
              setCurrentFrame(frame);
              requestFrames(frame);
              drawFrame();
            }
          } else {
            targetProgressRef.current = self.progress;
            startLoop();
          }
        },
      });
    }, track);

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
      window.removeEventListener("load", handlePageLoad);
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
  }, [
    drawFrame,
    loadFrame,
    prefersReducedMotion,
    requestFrames,
    scheduleDraw,
    setReady,
    startLoop,
  ]);

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
        <div
          ref={introCurtainRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 bg-black"
          style={{ opacity: 1 }}
        />
        {ready && (
          <div
            ref={introRef}
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-4 text-center"
            style={{ opacity: 1 }}
          >
            <h1
              aria-label="WHERE FLAVOUR MEETS ELEGANCE"
              className="flex flex-col items-center justify-center gap-1 font-extrabold uppercase leading-[1.05] tracking-tight sm:flex-row sm:gap-[0.3em]"
              style={{ fontSize: "clamp(1.5rem, 5vw, 4.5rem)" }}
            >
              <motion.span
                className={`${styles.introHalf} ${styles.leftHalf}`}
                initial={{ x: "-100vw", opacity: 0, "--fade": "38%" }}
                animate={{ x: 0, opacity: 1, "--fade": "0%" }}
                transition={{
                  x: {
                    duration: INTRO_SLIDE_DURATION,
                    ease: [0.22, 1, 0.36, 1],
                  },
                  opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                  "--fade": {
                    duration: 0.45,
                    delay: INTRO_FINAL_DELAY,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
              >
                <span>WHERE FLAVOUR</span>
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-white to-[#d1d5db] bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: INTRO_FINAL_DELAY,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  WHERE FLAVOUR
                </motion.span>
              </motion.span>
              <motion.span
                className={`${styles.introHalf} ${styles.rightHalf}`}
                initial={{ x: "100vw", opacity: 0, "--fade": "38%" }}
                animate={{ x: 0, opacity: 1, "--fade": "0%" }}
                transition={{
                  x: {
                    duration: INTRO_SLIDE_DURATION,
                    ease: [0.22, 1, 0.36, 1],
                  },
                  opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                  "--fade": {
                    duration: 0.45,
                    delay: INTRO_FINAL_DELAY,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
              >
                <span>MEETS ELEGANCE</span>
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: INTRO_FINAL_DELAY,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="bg-gradient-to-b from-white to-[#d1d5db] bg-clip-text text-transparent">
                    MEETS{" "}
                  </span>
                  <span className="bg-[linear-gradient(90deg,#ff4b5c_0%,#c8102e_100%)] bg-clip-text text-transparent">
                    ELEGANCE
                  </span>
                </motion.span>
              </motion.span>
            </h1>
          </div>
        )}
        {(() => {
          const activeSection = textSections.find(
            (section) =>
              currentFrame >= section.start && currentFrame <= section.end
          );

          if (!activeSection) return null;
          const activeSectionIndex = textSections.indexOf(activeSection);
          const alignmentClasses = "items-center justify-start text-left pl-6 md:pl-16";

          return (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSectionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-none absolute inset-0 z-30 flex ${alignmentClasses}`}
              >
                <div className="w-full max-w-5xl px-5">
                  <div className="flex items-center gap-4">
                    <motion.span
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 82, opacity: 1 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="block w-1 shrink-0 rounded-full bg-gradient-to-b from-red-500 to-red-800"
                      aria-hidden="true"
                    />
                    <h1
                      className="text-4xl font-extrabold uppercase leading-[1.05] tracking-tight"
                      style={{ fontSize: "45px" }}
                    >
                      <span className="block text-[#f7f0df]">
                        {activeSection.titleLine ?? activeSection.title}
                      </span>
                      {activeSection.highlightLine && (
                        <span className="mt-1 block bg-[linear-gradient(to_bottom,#ef4444_0%,#dc2626_38%,#7f1515_72%,#220404_100%)] bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(220,38,38,0.38)]">
                          {activeSection.highlightLine}
                        </span>
                      )}
                    </h1>
                  </div>
                  {activeSection.subtitle && (
                    <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
                      {activeSection.subtitle}
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          );
        })()}
      </div>
    </section>
  );
}