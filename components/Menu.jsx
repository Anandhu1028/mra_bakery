
"use client";

import React, { useState, useRef, useEffect } from "react";
import { MENU_CATEGORIES, MENU_ITEMS, BRAND } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { Flame, Sparkles, Leaf, Star } from "lucide-react";

export default function Menu() {
  const { t } = useApp();
  const [activeCategory, setActiveCategory] = useState("all");
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const filteredItems =
    activeCategory === "all"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <section
      ref={sectionRef}
      id="menu"
      className="relative w-full py-28 md:py-36 bg-black text-[#f5ecd9] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Heading */}
        <div
          className={`text-center max-w-3xl mx-auto mb-14 transition-all duration-1000 ${
            isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          

          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#f5ecd9] tracking-tight">
            {"From Malabar to the Middle East"}
          </h2>

          <p className="mt-4 text-[#f5ecd9]/70 text-base font-light">
            {"Malabar biryanis, Kerala favorites, charcoal grills, shawarma, mezze, fresh breads, and regional desserts"}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-14 gap-2.5 no-scrollbar">
          {MENU_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-[#c63536] text-white  font-semibold shadow-[0_4px_22px_rgba(198,53,54,0.55)] scale-105"
                    : "bg-[#0d0d0d] border border-[#2a2a2a] text-[#f5ecd9]/75 hover:text-white hover:border-white/40 hover:bg-[#161616]"
                }`}
              >
                {t(cat.name)}
              </button>
            );
          })}
        </div>

        {/* Two-Column Menu Items List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group p-5 sm:p-6 rounded-2xl bg-[#0d0d0d] border border-[#242424] hover:border-[#ffffff]/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-black/60"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-base sm:text-lg text-[#f5ecd9] group-hover:text-[#ef4444] transition-colors font-medium">
                      {t(item.name)}
                    </h3>

                    {item.isChefPick && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffffff]/15 text-[#ffffff] text-[10px] uppercase font-semibold">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {"Chef's Pick"}
                      </span>
                    )}

                    {item.spicy && (
                      <span
                        title="Spicy"
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#ef4444]/15 text-[#ef4444] text-[10px] font-semibold"
                      >
                        <Flame className="w-2.5 h-2.5" />
                        {"Spicy"}
                      </span>
                    )}

                    {item.veg && (
                      <span
                        title="Vegetarian"
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 text-[10px] font-semibold"
                      >
                        <Leaf className="w-2.5 h-2.5" />
                        {"Veg"}
                      </span>
                    )}
                  </div>

                 
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#f5ecd9]/65 font-light leading-relaxed mb-4">
                  {t(item.desc)}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
