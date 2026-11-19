"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export const DEBUG = process.env.NODE_ENV === "development";

const REQUIRED_IMAGE_GROUPS = ["hero", "cake-sequence"];
const KNOWN_IMAGE_GROUPS = [...REQUIRED_IMAGE_GROUPS, "cake-menu"];
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SmoothScrollContext = createContext(null);

function subscribeToReducedMotion(callback) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot
  );
}

export function SmoothScrollProvider({ children }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lenisRef = useRef(null);
  const fpsRef = useRef(null);
  const readyImageGroupsRef = useRef(new Set());
  const refreshFrameRef = useRef(null);
  const hasRefreshedRef = useRef(false);

  const scheduleScrollTriggerRefresh = useCallback(() => {
    const allImagesReady = REQUIRED_IMAGE_GROUPS.every((group) =>
      readyImageGroupsRef.current.has(group)
    );

    if (
      !allImagesReady ||
      hasRefreshedRef.current ||
      refreshFrameRef.current !== null
    ) {
      return;
    }

    refreshFrameRef.current = requestAnimationFrame(() => {
      refreshFrameRef.current = null;
      ScrollTrigger.refresh();
      hasRefreshedRef.current = true;
    });
  }, []);

  const markImagesReady = useCallback(
    (group) => {
      if (!KNOWN_IMAGE_GROUPS.includes(group)) {
        throw new Error(`Unknown scroll image group: ${group}`);
      }

      readyImageGroupsRef.current.add(group);
      scheduleScrollTriggerRefresh();
    },
    [scheduleScrollTriggerRefresh]
  );

  const scrollTo = useCallback((target, options) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
      return;
    }

    if (typeof window === "undefined") return;

    let top;
    if (typeof target === "number") {
      top = target;
    } else {
      const element =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!(element instanceof Element)) return;
      top = element.getBoundingClientRect().top + window.scrollY;
    }

    window.scrollTo(0, top + (options?.offset || 0));
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    if (lenisRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.18,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: true,
    });
    lenisRef.current = lenis;

    let frameCount = 0;
    let lastFpsTime = performance.now();
    const tickerCallback = (time) => {
      lenis.raf(time * 1000);

      if (!DEBUG || !fpsRef.current) return;

      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        fpsRef.current.textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastFpsTime = now;
      }
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(tickerCallback);
    scheduleScrollTriggerRefresh();

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;

      if (refreshFrameRef.current !== null) {
        cancelAnimationFrame(refreshFrameRef.current);
        refreshFrameRef.current = null;
      }
    };
  }, [prefersReducedMotion, scheduleScrollTriggerRefresh]);

  const contextValue = useMemo(
    () => ({ markImagesReady, scrollTo }),
    [markImagesReady, scrollTo]
  );

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      {children}
      {DEBUG && (
        <div
          ref={fpsRef}
          className="fixed top-20 end-4 z-[100] rounded-full border border-white/40 bg-black/90 px-3 py-1.5 font-mono text-xs text-white"
        >
          FPS: --
        </div>
      )}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    throw new Error("useSmoothScroll must be used within a SmoothScrollProvider");
  }
  return context;
}
