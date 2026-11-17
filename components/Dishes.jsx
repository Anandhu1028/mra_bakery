"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { SIGNATURE_DISHES } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { usePrefersReducedMotion } from "@/context/SmoothScrollContext";
import { ChefHat, Flame, Utensils } from "lucide-react";

export default function Dishes() {
  const { t } = useApp();
  const prefersReducedMotion = usePrefersReducedMotion();
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
      className={`relative w-full ${
        prefersReducedMotion ? "" : "-mt-[100vh]"
      } py-28 md:py-36 bg-[#fbf6ed] text-[#2d241d] overflow-hidden`}
    >
      {/* Background Ambience */}
      <div className="absolute -top-40 start-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#d4a24c]/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 end-0 w-96 h-96 bg-[#ef4444]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 transition-all duration-1000 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2
            className="text-3xl uppercase leading-tight tracking-[0.035em] text-[#2d241d] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Crafted Under Living <span className="text-[#f25050]">Embers</span>
          </h2>
          <p className="mt-4 text-[#6b5b4b] text-base sm:text-lg font-light leading-relaxed">
            {"Four signature classics, fire-roasted and stone-baked"}
          </p>
        </div>

        {/* Signature dishes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {SIGNATURE_DISHES.map((dish, idx) => (
            <div
              key={dish.id}
              style={{ transitionDelay: `${idx * 150}ms` }}
              className={`group relative rounded-[1.4rem] bg-white border border-[#e8ddcc] hover:border-[#d4a24c]/80 overflow-hidden flex flex-col transition-all duration-500 shadow-[0_8px_24px_rgba(45,36,29,0.08)] hover:shadow-[0_18px_40px_rgba(45,36,29,0.16)] hover:-translate-y-1.5 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#efe8dc]">
                <Image
                  src={dish.image}
                  alt={t(dish.title)}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Dish badge */}
                <div className="absolute top-4 start-4 z-10 max-w-[calc(100%-2rem)] px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white text-[9px] uppercase tracking-[0.12em] text-[#2d241d] font-semibold shadow-sm">
                  {t(dish.badge)}
                </div>
              </div>

              {/* Dish details */}
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-[#2d241d] font-normal leading-snug group-hover:text-[#c93636] transition-colors">
                    {t(dish.title)}
                  </h3>
                  <p className="mt-3 text-sm text-[#6b5b4b] leading-relaxed font-light line-clamp-3">
                    {t(dish.description)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`mt-10 flex flex-wrap justify-center gap-3 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e8d1a5] bg-[#fff7e6] px-4 py-2.5 text-xs font-medium text-[#5f5143] shadow-sm">
            <ChefHat className="h-4 w-4 text-[#b77d2d]" aria-hidden="true" />
            <span>Freshly prepared</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#f2c9c1] bg-[#fff0ed] px-4 py-2.5 text-xs font-medium text-[#5f5143] shadow-sm">
            <Flame className="h-4 w-4 text-[#c93636]" aria-hidden="true" />
            <span>Fire-led flavor</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e6d9c6] bg-[#f5f1e8] px-4 py-2.5 text-xs font-medium text-[#5f5143] shadow-sm">
            <Utensils className="h-4 w-4 text-[#b77d2d]" aria-hidden="true" />
            <span>Served with care</span>
          </div>
        </div>
      </div>
    </section>
  );
}
