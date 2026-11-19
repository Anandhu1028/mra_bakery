"use client";

import { useEffect, useRef } from "react";
import { useSmoothScroll } from "@/context/SmoothScrollContext";

const FIRST_FRAME_NUMBER = 1;
const LAST_FRAME_NUMBER = 197;
const MISSING_FRAME_NUMBERS = new Set([106, 109]);
const FRAME_NUMBERS = Array.from(
  { length: LAST_FRAME_NUMBER - FIRST_FRAME_NUMBER + 1 },
  (_, index) => FIRST_FRAME_NUMBER + index
).filter((frame) => !MISSING_FRAME_NUMBERS.has(frame));
const FRAME_URLS = FRAME_NUMBERS.map(
  (frame) => `/hero1/frame_${String(frame).padStart(3, "0")}.png`
);
const TOTAL_FRAMES = FRAME_URLS.length; // 195 frames

// Scroll phases (screen stays pinned through all of them)
// Phase A: Text fully visible & stable on pure black
// Phase B: Text fades out smoothly to blackout
// Phase C: Frame 001 smooth fade-in (reaches 65% visible at 0.15)
// Phase D: At 65% visibility, scrolling smoothly advances frames 001-197
// Phase E: Release sticky sequence after frame 197 to reveal next section
const PHASES = {
  hold: [0, 0.03],              // Phase A: text fully joined & stable
  textOut: [0.03, 0.08],        // Phase B: text fades out to blackout
  frameIn: [0.05, 0.20],        // Phase C: frame 001 smooth fade-in (hits ~65% at 0.15)
  play: [0.15, 1.0],            // Phase D: at 65% visible, scrolling advances frames smoothly 001-197
};

const SCROLL_HEIGHT_VH = 700;
const LERP = 0.22;
const INITIAL_PRELOAD_COUNT = 40;
const FRAME_AHEAD = 36;
const FRAME_BEHIND = 12;
const MAX_CONCURRENT_LOADS = 6;
const BACKGROUND_COLOR = "#000000";

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function frameIndexForProgress(progress, firstFrameReady) {
  if (!firstFrameReady) return 0;
  const [playStart, playEnd] = PHASES.play;
  if (progress < playStart) return 0;
  const frameProgress = clamp((progress - playStart) / (playEnd - playStart));
  return Math.min(TOTAL_FRAMES - 1, Math.round(frameProgress * (TOTAL_FRAMES - 1)));
}

export default function Hero2Sequence() {
  const { markImagesReady } = useSmoothScroll() || {};
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const textWrapRef = useRef(null);
  const imagesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const targetFrameRef = useRef(0);
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

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const textWrap = textWrapRef.current;
    const images = imagesRef.current;
    if (!section || !canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      console.error("[Hero2] Unable to create a 2D context for Hero2Sequence.");
      return undefined;
    }

    const queuedFrames = new Set();
    const pendingImages = new Map();
    const failedFrames = new Set();
    let activeLoads = 0;
    let animationFrameId = null;
    let lastDrawnFrame = -1;
    let lastRequestedFrame = -1;
    let lastEvictedFrame = -Infinity;
    let firstFrameReady = false;
    let initialBatchStarted = false;
    let disposed = false;
    let lastLoggedPhase = "";

    const getActivePhase = (progress) => {
      if (progress < PHASES.hold[1]) return "A: text joined & stable";
      if (progress < PHASES.textOut[1]) return "B: text fading out";
      if (progress < PHASES.play[0]) return "C: frame 001 fade-in (to 65%)";
      if (progress < PHASES.play[1]) return "D: frame sequence playing 001-197 smoothly";
      return "E: complete, revealing next section";
    };

    const updatePhaseStyles = (progress) => {
      const [outStart, outEnd] = PHASES.textOut;
      const [inStart, inEnd] = PHASES.frameIn;

      // Text fade out
      let textExit = 0;
      if (progress >= outStart) {
        textExit = clamp((progress - outStart) / (outEnd - outStart));
      }
      const textOpacity = progress <= outStart ? 1 : 1 - textExit;

      // Frame 001 smooth fade-in: reaches 65% visibility at 0.15 where playback begins, and reaches 100% by 0.20
      let frameProgress = 0;
      if (progress >= inStart) {
        frameProgress = clamp((progress - inStart) / (inEnd - inStart));
      }
      const frameOpacity = firstFrameReady
        ? (progress <= inStart ? 0 : (progress >= inEnd ? 1 : frameProgress))
        : 0;

      if (textWrap) {
        const isBlackout = progress >= outEnd;
        textWrap.style.opacity = isBlackout ? "0" : String(textOpacity);
        textWrap.style.visibility = isBlackout ? "hidden" : "visible";
        textWrap.style.transform = isBlackout
          ? "translate3d(0, -20px, 0)"
          : `translate3d(0, ${-textExit * 20}px, 0) scale(${1 - textExit * 0.02})`;
        textWrap.style.filter =
          !isBlackout && textExit > 0.05 ? `blur(${textExit * 4}px)` : "none";
        textWrap.style.pointerEvents = isBlackout ? "none" : "auto";
      }

      canvas.style.opacity = String(frameOpacity);

      const activePhase = getActivePhase(progress);
      if (activePhase !== lastLoggedPhase) {
        lastLoggedPhase = activePhase;
        const currentFrame = frameIndexForProgress(progress, firstFrameReady) + 1;
        console.log(
          `[Hero2] Active phase: ${activePhase} | progress: ${progress.toFixed(
            3
          )} | frame: ${currentFrame}`
        );
      }
    };

    const drawFrame = (requestedFrame, force = false) => {
      if (!canvas.width || !canvas.height) return;

      let frameIndex = -1;
      for (let index = requestedFrame; index >= 0; index -= 1) {
        if (images[index]) {
          frameIndex = index;
          break;
        }
      }
      if (frameIndex < 0) {
        for (let index = requestedFrame + 1; index < TOTAL_FRAMES; index += 1) {
          if (images[index]) {
            frameIndex = index;
            break;
          }
        }
      }
      if (frameIndex < 0) return;
      if (!force && frameIndex === lastDrawnFrame) return;

      const image = images[frameIndex];
      if (!image || !image.naturalWidth || !image.naturalHeight) return;

      const scale = Math.max(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight
      );
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;

      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      lastDrawnFrame = frameIndex;
    };

    const loadFrame = (index) => {
      const url = FRAME_URLS[index];
      if (!url) return Promise.reject(new Error(`Invalid frame index ${index}`));

      const image = new Image();
      pendingImages.set(index, image);
      console.log(`[Hero2] Loading frame ${index + 1}/${TOTAL_FRAMES}: ${url}`);

      return new Promise((resolve, reject) => {
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          console.log(
            `[Hero2] Frame ready ${index + 1}: ${image.naturalWidth}x${image.naturalHeight}`
          );
          resolve(image);
        };

        const fail = (err) => {
          if (settled) return;
          settled = true;
          console.error(`[Hero2] Failed to load frame ${index + 1} (${url}):`, err);
          reject(new Error(`Unable to load ${url}`));
        };

        const tryDecodeThenFinish = () => {
          if (typeof image.decode === "function") {
            image
              .decode()
              .then(() => {
                finish();
              })
              .catch((decodeErr) => {
                console.warn(
                  `[Hero2] Decode failed for frame ${index + 1}, using onload fallback:`,
                  decodeErr
                );
                if (image.naturalWidth > 0) {
                  finish();
                } else {
                  fail(decodeErr);
                }
              });
          } else {
            finish();
          }
        };

        image.onload = () => {
          tryDecodeThenFinish();
        };

        image.onerror = (err) => {
          fail(err);
        };

        image.src = url;

        if (image.complete && image.naturalWidth > 0) {
          tryDecodeThenFinish();
        }
      });
    };

    const queueFrame = (index) => {
      if (
        index < 0 ||
        index >= TOTAL_FRAMES ||
        images[index] ||
        pendingImages.has(index) ||
        queuedFrames.has(index) ||
        failedFrames.has(index)
      ) {
        return;
      }
      queuedFrames.add(index);
    };

    const startInitialBatch = () => {
      if (initialBatchStarted) return;
      initialBatchStarted = true;
      console.log(`[Hero2] Starting initial preload batch (1-${INITIAL_PRELOAD_COUNT})`);
      for (
        let index = 1;
        index < Math.min(INITIAL_PRELOAD_COUNT, TOTAL_FRAMES);
        index += 1
      ) {
        queueFrame(index);
      }
      pumpQueue();
    };

    const pumpQueue = () => {
      while (
        !disposed &&
        activeLoads < MAX_CONCURRENT_LOADS &&
        queuedFrames.size > 0
      ) {
        let nextIndex = null;
        let nearestDistance = Infinity;
        for (const index of queuedFrames) {
          const distance = Math.abs(index - targetFrameRef.current);
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
              console.log(
                `[Hero2] First frame ready: ${image.naturalWidth}x${image.naturalHeight}`
              );
              try {
                markImagesReady?.("hero");
              } catch (_) {}
              resizeCanvas();
              drawFrame(0, true);
              console.log("[Hero2] Initial frame drawn successfully onto canvas");
              updatePhaseStyles(currentProgressRef.current);
              startInitialBatch();
            } else {
              const currentFrame = frameIndexForProgress(
                currentProgressRef.current,
                firstFrameReady
              );
              if (currentFrame === nextIndex) {
                drawFrame(currentFrame);
              }
            }

            const rect = section.getBoundingClientRect();
            if (
              firstFrameReady &&
              rect.top <= window.innerHeight &&
              rect.bottom >= 0
            ) {
              queueFramesAround(targetFrameRef.current);
            }
          })
          .catch((error) => {
            if (!disposed) {
              failedFrames.add(nextIndex);
              console.error(
                `[Hero2] Failed to load frame: ${FRAME_URLS[nextIndex]}`,
                error
              );
              if (nextIndex === 0) {
                startInitialBatch();
              }
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
      const firstIndex = Math.max(0, targetIndex - FRAME_BEHIND);
      const lastIndex = Math.min(TOTAL_FRAMES - 1, targetIndex + FRAME_AHEAD);
      for (let index = firstIndex; index <= lastIndex; index += 1) {
        queueFrame(index);
      }
      pumpQueue();
    };

    const evictDistantFrames = (targetIndex) => {
      const displayedIndex = frameIndexForProgress(
        currentProgressRef.current,
        firstFrameReady
      );
      const keepFrom = Math.min(targetIndex, displayedIndex) - FRAME_BEHIND - 10;
      const keepThrough = Math.max(targetIndex, displayedIndex) + FRAME_AHEAD + 10;

      // Keep frame 0 always cached so it never needs reloading
      for (let index = 1; index < images.length; index += 1) {
        if (images[index] && (index < keepFrom || index > keepThrough)) {
          images[index].removeAttribute("src");
          images[index] = null;
        }
      }
      for (const index of queuedFrames) {
        if (index > 0 && (index < keepFrom || index > keepThrough)) {
          queuedFrames.delete(index);
        }
      }
    };

    const animate = () => {
      animationFrameId = null;
      const target = targetProgressRef.current;
      const difference = target - currentProgressRef.current;
      const next =
        Math.abs(difference) < 0.0005
          ? target
          : currentProgressRef.current + difference * LERP;
      currentProgressRef.current = next;

      updatePhaseStyles(next);

      const frameIndex = frameIndexForProgress(next, firstFrameReady);
      if (frameIndex !== lastRequestedFrame) {
        lastRequestedFrame = frameIndex;
        drawFrame(frameIndex);

        if (Math.abs(frameIndex - lastEvictedFrame) >= 8) {
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
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = canvas.clientWidth || window.innerWidth;
      const displayHeight = canvas.clientHeight || window.innerHeight;
      const targetWidth = Math.max(1, Math.round(displayWidth * dpr));
      const targetHeight = Math.max(1, Math.round(displayHeight * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      lastDrawnFrame = -1;
      drawFrame(frameIndexForProgress(currentProgressRef.current, firstFrameReady), true);
    };

    const updateScrollState = () => {
      const sectionRect = section.getBoundingClientRect();
      const scrollRange = sectionRect.height - window.innerHeight;
      const progress =
        scrollRange > 0 ? clamp(-sectionRect.top / scrollRange) : 0;
      const targetIndex = frameIndexForProgress(progress, firstFrameReady);
      targetProgressRef.current = progress;
      targetFrameRef.current = targetIndex;

      console.log(
        `[Hero2] Scroll progress: ${progress.toFixed(3)} | section top: ${sectionRect.top.toFixed(
          1
        )} | target frame: ${targetIndex + 1}`
      );

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

    resizeCanvas();
    updateScrollState();
    queueFrame(0);
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
