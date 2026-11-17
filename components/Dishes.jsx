"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { SIGNATURE_DISHES, BRAND } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { Clock, Sparkles } from "lucide-react";

export default function Dishes() {
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
      id="signatures"
      className="relative w-full py-28 md:py-36 bg-black text-[#f5ecd9] overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#ef4444]/3 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          

          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#f5ecd9] tracking-tight">
            {"Crafted Under Living Embers"}
          </h2>
          <p className="mt-4 text-[#f5ecd9]/70 text-base sm:text-lg font-light">
            {"Four signature classics, fire-roasted and stone-baked"}
          </p>
        </div>

        {/* Cards Grid (Luxury hover with orange glow and slow image zoom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {SIGNATURE_DISHES.map((dish, idx) => (
            <div
              key={dish.id}
              style={{ transitionDelay: `${idx * 150}ms` }}
              className={`group relative rounded-2xl bg-[#0d0d0d] border border-[#242424] hover:border-[#ef4444]/70 overflow-hidden flex flex-col justify-between transition-all duration-700 hover:shadow-[0_0_35px_rgba(239,68,68,0.25)] hover:-translate-y-1.5 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
            >
              {/* Image Container with slow zoom */}
              <div className="relative w-full h-64 overflow-hidden bg-neutral-950">
                <Image
                  src={dish.image}
                  alt={t(dish.title)}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110 brightness-90 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/30 to-transparent" />

                {/* Badge Tag */}
                <div className="absolute top-3.5 start-3.5 z-10 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#ffffff]/40 text-[10px] uppercase tracking-wider text-[#ffffff] font-semibold">
                  {t(dish.badge)}
                </div>

                {/* Fire / Time indicator */}
                <div className="absolute bottom-3 end-3 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[11px] text-[#f5ecd9]/80 font-mono">
                  <Clock className="w-3 h-3 text-[#ef4444]" />
                  <span>{dish.prepTime}</span>
                </div>
              </div>

              {/* Dish Content Body */}
              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  {/* Primary Title */}
                  <h3 className="font-serif text-lg text-[#f5ecd9] font-normal leading-snug group-hover:text-[#ef4444] transition-colors mb-3">
                    {t(dish.title)}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#f5ecd9]/70 leading-relaxed font-light line-clamp-3 mb-6">
                    {t(dish.description)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
