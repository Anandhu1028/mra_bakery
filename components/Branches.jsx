"use client";

import React, { useRef, useEffect, useState } from "react";
import { BRANCHES_DATA } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { MapPin } from "lucide-react";

export default function Branches() {
  const { t } = useApp();
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="branches"
      className="relative w-full pt-[46px] pb-28 md:pb-36 bg-white text-[#2d241d] overflow-hidden"
    >
      <div className="absolute -top-40 end-0 h-96 w-96 rounded-full bg-[#d4a24c]/10 blur-[130px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-14 transition-[opacity,transform] duration-500 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >

          <h2
            className="text-3xl uppercase leading-tight tracking-[0.035em] text-[#2d241d] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Find Us Across <span className="text-[#f25050]">Kerala &amp; Dubai</span>
          </h2>
          <p className="mt-4 text-[#6b5b4b] text-base font-light">
            {"Explore our locations in Calicut, Kochi, Kannur, and Dubai."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {BRANCHES_DATA.map((branch, idx) => (
            <div
              key={branch.id}
              className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border border-[#e8ddcc] bg-[#efe8dc] transition-[opacity,transform,border-color] duration-300 ease-out hover:border-[#d4a24c]/80 sm:aspect-[5/4] motion-reduce:transition-none ${
                isInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <div
                role="img"
                aria-label="Restaurant interior"
                className="absolute inset-0 bg-cover bg-center transition-transform duration-400 ease-out group-hover:scale-105 motion-reduce:transition-none"
                style={{ backgroundImage: `url("${branch.image}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-5 sm:p-6">
                <MapPin className="h-4 w-4 shrink-0 text-[#e8c46a]" />
                <h3 className="font-serif text-xl font-medium text-white sm:text-2xl">
                  {t(branch.city)}
                </h3>
              </div>
              <div className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm sm:bottom-6 sm:right-6">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
