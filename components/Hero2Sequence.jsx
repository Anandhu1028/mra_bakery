"use client";

import { useEffect, useRef } from "react";

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
const TOTAL_FRAMES = FRAME_URLS.length;
const PHASES = {
  textIn: [0, 0.12],
  hold: [0.12, 0.25],
  textOut: [0.25, 0.37],
  frameIn: [0.37, 0.5],
  play: [0.5, 1],
};
const SCROLL_HEIGHT_VH = 700;
const LERP = 0.12;
const INTRO_REVEAL_DURATION_MS = 1400;
const HERO1_PRELOAD_PROGRESS = 0.65;
const INITIAL_PRELOAD_COUNT = 30;
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

function frameIndexForProgress(progress) {
  const [playStart, playEnd] = PHASES.play;
  const frameProgress = clamp((progress - playStart) / (playEnd - playStart));
  return Math.round(frameProgress * (TOTAL_FRAMES - 1));
}

export default function Hero2Sequence() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headlineFirstRef = useRef(null);
  const headlineSecondRef = useRef(null);
  const subtitleRef = useRef(null);
  const accentLineRef = useRef(null);
  const imagesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const targetFrameRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    if (!section || !canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      console.error("Unable to create a 2D context for Hero2Sequence.");
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
    let preloadThresholdReached = false;
    let initialBatchStarted = false;
    let disposed = false;
    let introStartTime = null;

    const updateRevealElement = (element, enterProgress, exitProgress, delay) => {
      if (!element) return;

      const revealProgress = easeInOutCubic(
        clamp((enterProgress - delay) / (1 - delay))
      );
      const opacity = revealProgress * (1 - exitProgress);
      const translateY = (1 - revealProgress) * 30 - exitProgress * 16;
      const scale = 1 - exitProgress * 0.02;
      const blur = (1 - revealProgress) * 10 + exitProgress;

      element.style.opacity = String(opacity);
      element.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      element.style.filter = `blur(${blur}px)`;
    };

    const updatePhaseStyles = (progress, loadRevealProgress) => {
      const [textInStart, textInEnd] = PHASES.textIn;
      const [textOutStart, textOutEnd] = PHASES.textOut;
      const [frameInStart, frameInEnd] = PHASES.frameIn;
      const scrollEnterProgress = easeInOutCubic(
        clamp((progress - textInStart) / (textInEnd - textInStart))
      );
      const enterProgress = Math.max(
        scrollEnterProgress,
        easeInOutCubic(loadRevealProgress)
      );
      const exitProgress = easeInOutCubic(
        clamp((progress - textOutStart) / (textOutEnd - textOutStart))
      );
      const frameInProgress = easeInOutCubic(
        clamp((progress - frameInStart) / (frameInEnd - frameInStart))
      );

      canvas.style.opacity = String(frameInProgress);
      updateRevealElement(eyebrowRef.current, enterProgress, exitProgress, 0);
      updateRevealElement(
        headlineFirstRef.current,
        enterProgress,
        exitProgress,
        0.16
      );
      updateRevealElement(
        headlineSecondRef.current,
        enterProgress,
        exitProgress,
        0.34
      );
      updateRevealElement(
        subtitleRef.current,
        enterProgress,
        exitProgress,
        0.56
      );

      if (accentLineRef.current) {
        const accentProgress = easeInOutCubic(
          clamp((enterProgress - 0.48) / 0.52)
        );
        accentLineRef.current.style.width = `${accentProgress * 120}px`;
        accentLineRef.current.style.opacity = String(
          accentProgress * (1 - exitProgress)
        );
      }
    };

    const drawFrame = (requestedFrame) => {
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

      if (frameIndex < 0 || frameIndex === lastDrawnFrame) return;

      const image = images[frameIndex];
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
      const image = new Image();
      const url = FRAME_URLS[index];
      image.decoding = "async";
      pendingImages.set(index, image);

      if (typeof image.decode === "function") {
        image.src = url;
        return image.decode().then(() => image);
      }

      return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Unable to load ${url}`));
        image.src = url;
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
            if (nextIndex === 0) firstFrameReady = true;
            drawFrame(frameIndexForProgress(currentProgressRef.current));
            startInitialBatch();

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
                `Failed to load Hero2 frame: ${FRAME_URLS[nextIndex]}`,
                error
              );
              startInitialBatch();
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
      const displayedIndex = Math.round(
        currentProgressRef.current * (TOTAL_FRAMES - 1)
      );
      const keepFrom =
        Math.min(targetIndex, displayedIndex) - FRAME_BEHIND;
      const keepThrough =
        Math.max(targetIndex, displayedIndex) + FRAME_AHEAD;

      for (let index = 1; index < images.length; index += 1) {
        if (
          images[index] &&
          (index < keepFrom || index > keepThrough)
        ) {
          images[index].removeAttribute("src");
          images[index] = null;
        }
      }

      for (const index of queuedFrames) {
        if (index < keepFrom || index > keepThrough) queuedFrames.delete(index);
      }
    };

    const startInitialBatch = () => {
      if (
        !preloadThresholdReached ||
        (!firstFrameReady && !failedFrames.has(0)) ||
        initialBatchStarted
      ) {
        return;
      }

      initialBatchStarted = true;
      for (let index = 0; index < Math.min(INITIAL_PRELOAD_COUNT, TOTAL_FRAMES); index += 1) {
        queueFrame(index);
      }
      pumpQueue();
    };

    const animate = (timestamp) => {
      animationFrameId = null;
      const target = targetProgressRef.current;
      const difference = target - currentProgressRef.current;
      const next =
        Math.abs(difference) < 0.001
          ? target
          : currentProgressRef.current + difference * LERP;
      currentProgressRef.current = next;

      const loadRevealProgress =
        introStartTime === null
          ? 0
          : clamp((timestamp - introStartTime) / INTRO_REVEAL_DURATION_MS);
      updatePhaseStyles(next, loadRevealProgress);
      const frameIndex = frameIndexForProgress(next);
      if (frameIndex !== lastRequestedFrame) {
        lastRequestedFrame = frameIndex;
        drawFrame(frameIndex);

        if (Math.abs(frameIndex - lastEvictedFrame) >= 8) {
          lastEvictedFrame = frameIndex;
          evictDistantFrames(targetFrameRef.current);
        }
      }

      if (
        next !== target ||
        (introStartTime !== null && loadRevealProgress < 1)
      ) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const scheduleAnimation = () => {
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      lastDrawnFrame = -1;
      drawFrame(frameIndexForProgress(currentProgressRef.current));
    };

    const updateScrollState = () => {
      const sectionRect = section.getBoundingClientRect();
      const scrollRange = sectionRect.height - window.innerHeight;
      const progress =
        scrollRange > 0 ? clamp(-sectionRect.top / scrollRange) : 0;
      const targetIndex = frameIndexForProgress(progress);
      targetProgressRef.current = progress;
      targetFrameRef.current = targetIndex;

      const hero1 = document.getElementById("hero1");
      if (hero1) {
        const hero1Rect = hero1.getBoundingClientRect();
        const hero1Range = hero1Rect.height - window.innerHeight;
        const hero1Progress =
          hero1Range > 0
            ? clamp(-hero1Rect.top / hero1Range)
            : hero1Rect.bottom <= 0
              ? 1
              : 0;
        if (hero1Progress >= HERO1_PRELOAD_PROGRESS) {
          preloadThresholdReached = true;
          startInitialBatch();
        }
      } else if (sectionRect.top <= window.innerHeight * 2) {
        preloadThresholdReached = true;
        startInitialBatch();
      }

      if (sectionRect.top <= window.innerHeight && sectionRect.bottom >= 0) {
        if (firstFrameReady || failedFrames.has(0)) {
          queueFramesAround(targetIndex);
        }
        evictDistantFrames(targetIndex);
      }
      scheduleAnimation();
    };

    const handleResize = () => {
      resizeCanvas();
      updateScrollState();
    };
    const handlePageLoad = () => {
      if (introStartTime === null) introStartTime = performance.now();
      scheduleAnimation();
    };

    resizeCanvas();
    queueFrame(0);
    pumpQueue();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", handleResize);
    if (document.readyState === "complete") {
      handlePageLoad();
    } else {
      window.addEventListener("load", handlePageLoad, { once: true });
    }
    updateScrollState();

    return () => {
      disposed = true;
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handlePageLoad);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      queuedFrames.clear();
      for (const image of pendingImages.values()) image.removeAttribute("src");
      pendingImages.clear();
      for (const image of images) {
        if (image) image.removeAttribute("src");
      }
      images.fill(null);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{
        height: `${SCROLL_HEIGHT_VH}vh`,
        backgroundColor: BACKGROUND_COLOR,
      }}
    >
      <div
        className="sticky top-0 h-[100dvh] w-full overflow-hidden"
        style={{ backgroundColor: BACKGROUND_COLOR }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{
            opacity: 0,
            backgroundColor: BACKGROUND_COLOR,
            filter: "none",
            mixBlendMode: "normal",
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-3 text-center sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <div
              ref={eyebrowRef}
              className="flex items-center justify-center gap-4 text-xs uppercase tracking-[0.4em] text-white/60 sm:text-sm"
              style={{
                opacity: 0,
                transform: "translate3d(0, 30px, 0)",
                filter: "blur(10px)",
              }}
            >
              <span className="h-px w-10 shrink-0 bg-red-600" aria-hidden="true" />
              <span>OUR SPECIALITIES</span>
              <span className="h-px w-10 shrink-0 bg-red-600" aria-hidden="true" />
            </div>

            <h1 className="mt-6 text-3xl font-extrabold uppercase leading-[1.05] tracking-[-0.06em] md:text-6xl md:tracking-tight lg:text-7xl">
              <span
                ref={headlineFirstRef}
                className="block bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent"
                style={{
                  opacity: 0,
                  transform: "translate3d(0, 30px, 0)",
                  filter: "blur(10px)",
                }}
              >
                CRAFTED WITH{" "}
                <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-800 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(220,38,38,0.4)]">
                  PASSION,
                </span>
              </span>
              <span
                ref={headlineSecondRef}
                className="mt-1 block bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent"
                style={{
                  opacity: 0,
                  transform: "translate3d(0, 30px, 0)",
                  filter: "blur(10px)",
                }}
              >
                SERVED WITH LOVE
              </span>
            </h1>

            <div
              ref={accentLineRef}
              aria-hidden="true"
              className="mx-auto mt-5 h-px max-w-[120px] bg-gradient-to-r from-transparent via-red-600 to-transparent"
              style={{ width: 0, opacity: 0 }}
            />

            <p
              ref={subtitleRef}
              className="mx-auto mt-6 max-w-2xl text-base text-white/70 md:text-xl"
              style={{
                opacity: 0,
                transform: "translate3d(0, 30px, 0)",
                filter: "blur(10px)",
              }}
            >
              Every bite tells a story of tradition, taste, and care.
            </p>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 md:h-28"
        style={{
          background:
            `linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, ${BACKGROUND_COLOR} 100%)`,
        }}
      />
    </section>
  );
}
