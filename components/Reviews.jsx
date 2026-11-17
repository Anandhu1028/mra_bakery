"use client";

import React, { useRef, useState, useEffect } from "react";
import { REVIEWS_DATA } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { Star, Quote, Sparkles } from "lucide-react";

export default function Reviews() {
  const { t } = useApp();
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Double the list for seamless marquee loop
  const marqueeList = [...REVIEWS_DATA, ...REVIEWS_DATA, ...REVIEWS_DATA];

  return (
    <section
      ref={sectionRef}
      id="reviews"
      className="relative w-full py-28 md:py-36 bg-[#0a0a0a] text-[#f5ecd9] overflow-hidden border-t border-[#1f1f1f]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-16 text-center">
        

        <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#f5ecd9] tracking-tight">
          {"Voices From Our Tables"}
        </h2>
        <p className="mt-4 text-[#f5ecd9]/70 text-base font-light max-w-2xl mx-auto">
          {"“Honest reviews from food critics and fire-loving fans”"}
        </p>
      </div>

      {/* Marquee Carousel Track */}
      <div className="relative w-full overflow-hidden mask-fade-edges">
        {/* Gradient edge overlays for smooth fade */}
        <div className="absolute top-0 bottom-0 start-0 w-24 sm:w-40 bg-gradient-to-e from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 end-0 w-24 sm:w-40 bg-gradient-to-s from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex gap-6 py-4">
          {marqueeList.map((review, idx) => (
            <div
              key={`${review.id}-${idx}`}
              className="w-[340px] sm:w-[420px] shrink-0 rounded-2xl bg-[#0d0d0d] border border-[#242424] hover:border-[#ffffff]/50 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-lg shadow-black/80"
            >
              <div>
                {/* Header with Star Rating and Quote mark */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#ffffff]">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-[#ef4444]/40" />
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-[#f5ecd9]/80 font-serif italic leading-relaxed mb-6">
                  "{t(review.comment)}"
                </p>
              </div>

              {/* Author & Role */}
              <div className="pt-4 border-t border-neutral-900 flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-sm text-[#f5ecd9] font-medium">
                    {review.name}
                  </h4>
                  <p className="text-[11px] text-[#ffffff]/80 font-sans">
                    {t(review.role)}
                  </p>
                </div>

                <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-400 font-mono">
                  ★
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
