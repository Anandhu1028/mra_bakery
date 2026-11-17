"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { BAKERY_SECTION } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { Flame, Clock, Sparkles, CheckCircle2 } from "lucide-react";

export default function Bakery() {
  const { t } = useApp();
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="bakery"
      className="relative w-full py-28 md:py-36 bg-[#0a0a0a] text-[#f5ecd9] overflow-hidden border-y border-[#1f1f1f]"
    >
      {/* Background Volcanic/Hearth Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#ef4444]/5 via-transparent to-[#ffffff]/5 pointer-events-none" />
      <div className="absolute -bottom-24 start-1/2 -translate-x-1/2 w-[800px] h-48 bg-[#ef4444]/10 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Parallax / Hearth Showcase */}
          <div
            className={`lg:col-span-6 transition-all duration-1000 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <div className="relative rounded-2xl overflow-hidden border border-[#242424] bg-neutral-950 aspect-[4/3] group shadow-2xl shadow-black">
              <Image
                src="/frames/frame_150.jpg"
                alt="Stone Oven Hearth"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover brightness-75 group-hover:scale-105 group-hover:brightness-90 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Live Oven Status Pill */}
              <div className="absolute top-4 start-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#ef4444]/50">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-ping" />
                <span className="text-xs uppercase tracking-widest text-[#f5ecd9] font-medium">
                  {"OVENS FIRING NOW • 450°C"}
                </span>
              </div>

              {/* Hearth Schedule Floating Card */}
              <div className="absolute bottom-6 inset-x-6 p-4 rounded-xl bg-[#0d0d0d]/90 backdrop-blur-md border border-[#ffffff]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/50 flex items-center justify-center text-[#ef4444]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm text-[#f5ecd9] font-medium">
                      {t(BAKERY_SECTION.hoursTitle)}
                    </h4>
                    <p className="text-xs text-[#ffffff] font-sans mt-0.5">
                      {t(BAKERY_SECTION.hoursDetail)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Baking Ritual */}
          <div
            className={`lg:col-span-6 transition-all duration-1000 delay-200 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1 rounded-full border border-[#ffffff]/30 bg-[#0d0d0d]">
              <Flame className="w-3.5 h-3.5 text-[#ef4444]" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#ffffff] font-medium">
                {t(BAKERY_SECTION.badge)}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#f5ecd9] tracking-tight leading-tight mb-5">
              {t(BAKERY_SECTION.title)}
            </h2>

            <p className="text-[#f5ecd9]/80 text-base sm:text-lg font-light leading-relaxed mb-8">
              {t(BAKERY_SECTION.subtitle)}
            </p>

            {/* Features List */}
            <div className="space-y-6">
              {BAKERY_SECTION.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full border border-[#ffffff]/60 bg-[#0d0d0d] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#ffffff]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base text-[#f5ecd9] font-medium">
                      {t(feature.title)}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#f5ecd9]/70 font-sans font-light mt-1 leading-relaxed">
                      {t(feature.desc)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
