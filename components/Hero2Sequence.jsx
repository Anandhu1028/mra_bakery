"use client";

import { useEffect, useRef } from "react";
import { useSmoothScroll } from "@/context/SmoothScrollContext";

// ─── Frame Manifest ───────────────────────────────────────────────────────────
// Source: public/hero1-webp/ (q85 WebP, avg ~68 KB vs ~1.3 MB PNG = 95% smaller)
// 195 valid frames out of 197 (106, 109 missing from source footage)
const FIRST_FRAME_NUMBER = 1;
const LAST_FRAME_NUMBER = 197;
const MISSING_FRAME_NUMBERS = new Set([106, 109]);
const FRAME_NUMBERS = Array.from(
  { length: LAST_FRAME_NUMBER - FIRST_FRAME_NUMBER + 1 },
  (_, index) => FIRST_FRAME_NUMBER + index
).filter((frame) => !MISSING_FRAME_NUMBERS.has(frame));
const FRAME_URLS = FRAME_NUMBERS.map(
  (frame) => `/hero1-webp/frame_${String(frame).padStart(3, "0")}.webp`
);
const TOTAL_FRAMES = FRAME_URLS.length; // 195 frames

// ─── Scroll Phase Map ──────────────────────────────────────────────────────────
// Phase A [0.00–0.03]:  Hero text fully visible & stable on pure black
// Phase B [0.03–0.08]:  Text fades out smoothly to blackout
// Phase C [0.05–0.20]:  Frame 001 smooth fade-in (hits ~65% opacity at 0.15)
// Phase D [0.15–1.00]:  At 65% visibility, scroll advances frames 001–197 smoothly
const PHASES = {
  hold:    [0,    0.03],
  textOut: [0.03, 0.08],
  frameIn: [0.05, 0.20],
  play:    [0.15, 1.0],
};

// ─── Rendering & Loading Config ────────────────────────────────────────────────
const SCROLL_HEIGHT_VH      = 700;
const BACKGROUND_COLOR      = "#000000";

// Time-based LERP — frame-rate-independent interpolation constant (seconds).
// A value of 0.09 means 90% of remaining distance covered every 100ms.
const LERP_TAU              = 0.085; // exponential time constant (lower = faster catch-up)

// Frame preloading buffer — wider on each side for fast scrollers
const FRAME_AHEAD           = 50;   // frames to preload in scroll direction
const FRAME_BEHIND          = 20;   // frames to keep behind playhead
const FRAME_EVICT_PADDING   = 15;   // extra hysteresis beyond keep window
const MAX_CONCURRENT_LOADS  = 8;    // parallel fetches (HTTP/2 supports many)
const INITIAL_PRELOAD_COUNT = 60;   // first batch loaded immediately on mount

// ─── Utilities ────────────────────────────────────────────────────────────────
function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function frameIndexForProgress(progress, firstFrameReady) {
  if (!firstFrameReady) return 0;
  const [playStart, playEnd] = PHASES.play;
  if (progress < playStart) return 0;
  const frameProgress = clamp((progress - playStart) / (playEnd - playStart));
  return Math.min(TOTAL_FRAMES - 1, Math.round(frameProgress * (TOTAL_FRAMES - 1)));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Hero2Sequence() {
  const { markImagesReady } = useSmoothScroll() || {};
  const sectionRef      = useRef(null);
  const canvasRef       = useRef(null);
  const textWrapRef     = useRef(null);
  const imagesRef       = useRef(new Array(TOTAL_FRAMES).fill(null));
  const targetProgressRef  = useRef(0);
  const currentProgressRef = useRef(0);
  const targetFrameRef  = useRef(0);

  // ── Preloader gate: start hero text animation only after preloader exits ──
  useEffect(() => {
    const textWrap = textWrapRef.current;
    if (!textWrap) return undefined;

    const startIntro = () => {
      textWrap.classList.add("hero-intro-play");
      textWrap.classList.remove("hero-intro-wait");
    };

    const hasLoadingPreloader =
      typeof document !== "undefined" &&
      !!document.querySelector('[role="status"][aria-label="Loading"]');

    if (!hasLoadingPreloader) {
      startIntro();
      return undefined;
    }

    window.addEventListener("preloader:done", startIntro, { once: true });
    const timer = setTimeout(startIntro, 2800);

    return () => {
      window.removeEventListener("preloader:done", startIntro);
      clearTimeout(timer);
    };
  }, []);

  // ── Main animation engine ─────────────────────────────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    const canvas  = canvasRef.current;
    const textWrap = textWrapRef.current;
    const images  = imagesRef.current;
    if (!section || !canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return undefined;

    // ── State ────────────────────────────────────────────────────────────────
    const queuedFrames   = new Set();
    const pendingImages  = new Map();
    const failedFrames   = new Set();
    let activeLoads      = 0;
    let animationFrameId = null;
    let lastDrawnFrame   = -1;
    let lastRequestedFrame  = -1;
    let lastEvictedFrame    = -Infinity;
    let firstFrameReady  = false;
    let initialBatchStarted = false;
    let disposed         = false;
    let lastRafTime      = 0;
    let lastLoggedPhase  = "";

    // ── Phase / style update ──────────────────────────────────────────────────
    const getActivePhase = (progress) => {
      if (progress < PHASES.hold[1])    return "A: text stable";
      if (progress < PHASES.textOut[1]) return "B: text fading";
      if (progress < PHASES.play[0])    return "C: frame fade-in";
      if (progress < PHASES.play[1])    return "D: frame playback";
      return "E: complete";
    };

    const updatePhaseStyles = (progress) => {
      const [outStart, outEnd] = PHASES.textOut;
      const [inStart,  inEnd ] = PHASES.frameIn;

      // Text exit
      const textExit = progress <= outStart
        ? 0
        : clamp((progress - outStart) / (outEnd - outStart));
      const textOpacity = 1 - textExit;

      // Frame fade-in
      const frameProgress = progress <= inStart
        ? 0
        : clamp((progress - inStart) / (inEnd - inStart));
      const frameOpacity = firstFrameReady
        ? (progress >= inEnd ? 1 : frameProgress)
        : 0;

      // DOM writes
      if (textWrap) {
        const isBlackout = progress >= outEnd;
        textWrap.style.opacity     = isBlackout ? "0" : String(textOpacity);
        textWrap.style.visibility  = isBlackout ? "hidden" : "visible";
        textWrap.style.transform   = isBlackout
          ? "translate3d(0, -20px, 0)"
          : `translate3d(0, ${-textExit * 20}px, 0) scale(${1 - textExit * 0.02})`;
        textWrap.style.filter      = !isBlackout && textExit > 0.05
          ? `blur(${textExit * 4}px)`
          : "none";
        textWrap.style.pointerEvents = isBlackout ? "none" : "auto";
      }

      canvas.style.opacity = String(frameOpacity);

      // Phase logging (dev only, cheap — only fires on phase change)
      const phase = getActivePhase(progress);
      if (phase !== lastLoggedPhase) {
        lastLoggedPhase = phase;
        const f = frameIndexForProgress(progress, firstFrameReady) + 1;
        console.log(`[Hero2] ${phase} | p=${progress.toFixed(3)} | f=${f}`);
      }
    };

    // ── Canvas draw ───────────────────────────────────────────────────────────
    const drawFrame = (requestedFrame, force = false) => {
      if (!canvas.width || !canvas.height) return;

      // Find nearest loaded frame (search backwards first, then forward)
      let frameIndex = -1;
      for (let i = requestedFrame; i >= 0; i -= 1) {
        if (images[i]) { frameIndex = i; break; }
      }
      if (frameIndex < 0) {
        for (let i = requestedFrame + 1; i < TOTAL_FRAMES; i += 1) {
          if (images[i]) { frameIndex = i; break; }
        }
      }
      if (frameIndex < 0) return;
      if (!force && frameIndex === lastDrawnFrame) return;

      const image = images[frameIndex];
      if (!image || !image.naturalWidth || !image.naturalHeight) return;

      const scale     = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const drawWidth  = image.naturalWidth  * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = (canvas.width  - drawWidth)  / 2;
      const drawY = (canvas.height - drawHeight) / 2;

      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      lastDrawnFrame = frameIndex;
    };

    // ── Frame loader using fetch + blob URL for maximum decode speed ──────────
    const loadFrame = (index) => {
      const url = FRAME_URLS[index];
      if (!url) return Promise.reject(new Error(`Invalid frame index ${index}`));

      const image = new Image();
      pendingImages.set(index, image);

      return new Promise((resolve, reject) => {
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          resolve(image);
        };

        const fail = (err) => {
          if (settled) return;
          settled = true;
          reject(new Error(`Unable to load ${url}: ${err}`));
        };

        // Use image.decode() for off-main-thread decode when available
        const tryDecode = () => {
          if (typeof image.decode === "function") {
            image.decode()
              .then(finish)
              .catch(() => {
                if (image.naturalWidth > 0) finish();
                else fail("decode failed");
              });
          } else {
            finish();
          }
        };

        image.onload  = tryDecode;
        image.onerror = (e) => fail(e);
        image.src     = url;

        // Handle browser cache (image may already be complete)
        if (image.complete && image.naturalWidth > 0) tryDecode();
      });
    };

    // ── Queue management ──────────────────────────────────────────────────────
    const queueFrame = (index) => {
      if (
        index < 0 ||
        index >= TOTAL_FRAMES ||
        images[index] ||
        pendingImages.has(index) ||
        queuedFrames.has(index) ||
        failedFrames.has(index)
      ) return;
      queuedFrames.add(index);
    };

    const startInitialBatch = () => {
      if (initialBatchStarted) return;
      initialBatchStarted = true;
      // Load the first INITIAL_PRELOAD_COUNT frames immediately — this is the
      // critical path for smooth playback as soon as the user starts scrolling
      for (let i = 1; i < Math.min(INITIAL_PRELOAD_COUNT, TOTAL_FRAMES); i += 1) {
        queueFrame(i);
      }
      pumpQueue();
    };

    const pumpQueue = () => {
      while (!disposed && activeLoads < MAX_CONCURRENT_LOADS && queuedFrames.size > 0) {
        // Priority: nearest to current playhead (direction-aware)
        let nextIndex = null;
        let nearestDistance = Infinity;
        const target = targetFrameRef.current;
        for (const index of queuedFrames) {
          // Slight forward bias: frames ahead cost less than frames behind
          const fwdBias = index >= target ? 0 : 5;
          const distance = Math.abs(index - target) + fwdBias;
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nextIndex = index;
          }
        }

        queuedFrames.delete(nextIndex);
        activeLoads += 1;

        loadFrame(nextIndex)
          .then((image) => {
            if (disposed) {
              image.removeAttribute("src");
              return;
            }
            images[nextIndex] = image;

            if (nextIndex === 0) {
              firstFrameReady = true;
              try { markImagesReady?.("hero"); } catch (_) {}
              resizeCanvas();
              drawFrame(0, true);
              updatePhaseStyles(currentProgressRef.current);
              startInitialBatch();
            } else {
              const currentFrame = frameIndexForProgress(currentProgressRef.current, firstFrameReady);
              if (currentFrame === nextIndex) {
                drawFrame(currentFrame);
              }
            }

            // Kick off more loads around current playhead
            const rect = section.getBoundingClientRect();
            if (firstFrameReady && rect.top <= window.innerHeight && rect.bottom >= 0) {
              queueFramesAround(targetFrameRef.current);
            }
          })
          .catch((err) => {
            if (!disposed) {
              failedFrames.add(nextIndex);
              console.warn(`[Hero2] Frame ${nextIndex + 1} failed:`, err.message || err);
              if (nextIndex === 0) startInitialBatch();
            }
          })
          .finally(() => {
            pendingImages.delete(nextIndex);
            activeLoads -= 1;
            pumpQueue();
          });
      }
    };

    const queueFramesAround = (targetIndex) => {
      const first = Math.max(0, targetIndex - FRAME_BEHIND);
      const last  = Math.min(TOTAL_FRAMES - 1, targetIndex + FRAME_AHEAD);
      for (let i = first; i <= last; i += 1) queueFrame(i);
      pumpQueue();
    };

    const evictDistantFrames = (targetIndex) => {
      const displayedIndex = frameIndexForProgress(currentProgressRef.current, firstFrameReady);
      const keepFrom    = Math.min(targetIndex, displayedIndex) - FRAME_BEHIND  - FRAME_EVICT_PADDING;
      const keepThrough = Math.max(targetIndex, displayedIndex) + FRAME_AHEAD   + FRAME_EVICT_PADDING;

      // Always keep frame 0 cached (first frame, shown before scroll)
      for (let i = 1; i < images.length; i += 1) {
        if (images[i] && (i < keepFrom || i > keepThrough)) {
          images[i].removeAttribute("src");
          images[i] = null;
        }
      }
      for (const i of queuedFrames) {
        if (i > 0 && (i < keepFrom || i > keepThrough)) {
          queuedFrames.delete(i);
        }
      }
    };

    // ── Time-based animation loop (frame-rate-independent) ────────────────────
    const animate = (now) => {
      animationFrameId = null;

      // Time-based exponential lerp — produces the same visual speed at 60fps
      // AND 120fps / 144fps by using elapsed time (dt) instead of frame count.
      const dt = lastRafTime > 0 ? Math.min((now - lastRafTime) / 1000, 0.1) : 0.016;
      lastRafTime = now;

      const target = targetProgressRef.current;
      const diff   = target - currentProgressRef.current;
      const alpha  = 1 - Math.exp(-dt / LERP_TAU); // frame-rate-independent factor
      const next   = Math.abs(diff) < 0.0003
        ? target
        : currentProgressRef.current + diff * alpha;
      currentProgressRef.current = next;

      updatePhaseStyles(next);

      const frameIndex = frameIndexForProgress(next, firstFrameReady);
      if (frameIndex !== lastRequestedFrame) {
        lastRequestedFrame = frameIndex;
        drawFrame(frameIndex);

        // Evict only every 10 frame steps to avoid GC pressure on main thread
        if (Math.abs(frameIndex - lastEvictedFrame) >= 10) {
          lastEvictedFrame = frameIndex;
          evictDistantFrames(targetFrameRef.current);
        }
      }

      if (next !== target) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const scheduleAnimation = () => {
      if (animationFrameId === null) {
        lastRafTime = 0; // reset so first tick uses a sane dt
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // ── Canvas resize ─────────────────────────────────────────────────────────
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth  = canvas.clientWidth  || window.innerWidth;
      const displayHeight = canvas.clientHeight || window.innerHeight;
      const targetWidth   = Math.max(1, Math.round(displayWidth  * dpr));
      const targetHeight  = Math.max(1, Math.round(displayHeight * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width  = targetWidth;
        canvas.height = targetHeight;
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      lastDrawnFrame = -1;
      drawFrame(frameIndexForProgress(currentProgressRef.current, firstFrameReady), true);
    };

    // ── Scroll handler ────────────────────────────────────────────────────────
    const updateScrollState = () => {
      const sectionRect = section.getBoundingClientRect();
      const scrollRange = sectionRect.height - window.innerHeight;
      const progress    = scrollRange > 0 ? clamp(-sectionRect.top / scrollRange) : 0;
      const targetIndex = frameIndexForProgress(progress, firstFrameReady);

      targetProgressRef.current = progress;
      targetFrameRef.current    = targetIndex;

      if (firstFrameReady) {
        queueFramesAround(targetIndex);
        evictDistantFrames(targetIndex);
      }

      scheduleAnimation();
    };

    const handleResize = () => {
      resizeCanvas();
      updateScrollState();
    };

    // ── Init ──────────────────────────────────────────────────────────────────
    resizeCanvas();
    updateScrollState();
    queueFrame(0);    // frame 0 is highest priority — always load first
    pumpQueue();

    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      queuedFrames.clear();
      for (const image of pendingImages.values()) image.removeAttribute("src");
      pendingImages.clear();
      for (const image of images) {
        if (image) image.removeAttribute("src");
      }
      images.fill(null);
    };
  }, [markImagesReady]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full"
      style={{
        height: `${SCROLL_HEIGHT_VH}vh`,
        backgroundColor: BACKGROUND_COLOR,
      }}
    >
      <div
        className="sticky top-0 h-screen h-[100dvh] w-full overflow-hidden"
        style={{ backgroundColor: BACKGROUND_COLOR }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full block"
          style={{ opacity: 0, backgroundColor: BACKGROUND_COLOR }}
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-3 text-center sm:px-6">
          <div
            ref={textWrapRef}
            className="hero-intro-wait mx-auto w-full max-w-6xl will-change-[opacity,transform,filter]"
          >
            {/* Heading */}
            <h1 className="text-2xl font-extrabold uppercase leading-[1.05] tracking-[-0.04em] sm:text-4xl md:text-6xl md:tracking-tight lg:text-7xl">
              <span className="hero-line hero-line-1">
                <span className="hero-half hero-left">
                  <span className="hero-mask hero-grad-white">CRAFTED WITH</span>
                </span>
                <span className="hero-half hero-right hero-glow">
                  <span className="hero-mask hero-grad-red">PASSION,</span>
                </span>
              </span>

              <span className="hero-line hero-line-2 mt-1">
                <span className="hero-half hero-left">
                  <span className="hero-mask hero-grad-white">SERVED WITH</span>
                </span>
                <span className="hero-half hero-right">
                  <span className="hero-mask hero-grad-white">LOVE</span>
                </span>
              </span>
            </h1>

            <div
              aria-hidden="true"
              className="hero-divider mx-auto mt-6 h-px w-[120px]"
              style={{
                background:
                  "linear-gradient(to right, transparent, #dc2626, transparent)",
              }}
            />

          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 md:h-28"
        style={{
          background: `linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, ${BACKGROUND_COLOR} 100%)`,
        }}
      />
    </section>
  );
}
