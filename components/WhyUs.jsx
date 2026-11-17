"use client";

import React, { useRef, useState, useEffect } from "react";
import { WHY_US_FEATURES } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { Flame, Wheat, ShieldCheck, Sparkles } from "lucide-react";

const ICON_MAP = {
  Flame: Flame,
  Wheat: Wheat,
  ShieldCheck: ShieldCheck,
};

export default function WhyUs() {
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

  return (
    <section
      ref={sectionRef}
      id="why-us"
      className="relative w-full py-28 md:py-36 bg-[#0a0a0a] text-[#f5ecd9] overflow-hidden border-y border-[#1a1a1a]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1 rounded-full border border-[#ffffff]/30 bg-[#0d0d0d]">
            <Sparkles className="w-3.5 h-3.5 text-[#ffffff]" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#ffffff] font-medium">
              {"THE UNCOMPROMISING STANDARD"}
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#f5ecd9] tracking-tight">
            {"Why Connoisseurs Choose Al-Diwan"}
          </h2>
          <p className="mt-4 text-[#f5ecd9]/70 text-base font-light">
            {"Three cardinal pillars honoring ancient Levant tradition, natural fire, and uncompromised purity"}
          </p>
        </div>

        {/* 3 Minimal Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_US_FEATURES.map((item, idx) => {
            const IconComponent = ICON_MAP[item.icon] || Flame;
            return (
              <div
                key={idx}
                style={{ transitionDelay: `${idx * 120}ms` }}
                className={`relative rounded-2xl bg-[#0d0d0d] border border-[#242424] p-8 flex flex-col justify-between hover:border-[#ffffff]/60 transition-all duration-500 group hover:-translate-y-1 ${
                  isInView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
              >
                <div>
                  {/* Icon badge */}
                  <div className="w-12 h-12 rounded-xl bg-black border border-[#2a2a2a] group-hover:border-[#ef4444]/60 flex items-center justify-center mb-6 text-[#ffffff] group-hover:text-[#ef4444] transition-all">
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <h3 className="font-serif text-lg text-[#f5ecd9] font-medium mb-1">
                    {t(item.title)}
                  </h3>
                  <div className="text-xs text-[#ffffff]/80 font-sans tracking-wide mb-4">
                    {t(item.subtitle)}
                  </div>

                  <p className="text-xs text-[#f5ecd9]/70 font-light leading-relaxed">
                    {t(item.description)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between">
                  <span className="text-[10px] tracking-widest uppercase text-neutral-600 font-mono">
                    PILLAR 0{idx + 1}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ffffff]/40 group-hover:bg-[#ef4444] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
