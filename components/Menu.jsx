"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CakeSlice,
  ChefHat,
  Coffee,
  CookingPot,
  Fish,
  Flame,
  Leaf,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import { MENU_ITEMS } from "@/lib/content";
import { useApp } from "@/context/AppContext";

const MENU_TABS = [
  { id: "all", name: { en: "All Dishes" }, Icon: Utensils },
  { id: "malabar", name: { en: "Malabar Specials" }, Icon: ChefHat },
  { id: "arabian", name: { en: "Arabian Delights" }, Icon: Sparkles },
  { id: "grills", name: { en: "Grills & BBQ" }, Icon: Flame },
  { id: "seafood", name: { en: "Seafood" }, Icon: Fish },
  { id: "vegetarian", name: { en: "Vegetarian" }, Icon: Leaf },
  { id: "kerala-rice", name: { en: "Biryani" }, Icon: CookingPot },
  { id: "desserts", name: { en: "Desserts" }, Icon: CakeSlice },
  { id: "drinks", name: { en: "Beverages" }, Icon: Coffee },
];

const FEATURED_MENU_IDS = ["kr1", "kr2", "kr3", "g4", "g5", "w1"];

const MENU_IMAGES = {
  kr1: "/food_products/chickenbiriyani.jpg",
  kr2: "/food_products/1800e2d56a9c23e1ad9556be5e37f153.jpg",
  kr3: "/food_products/biriyani.png",
  g4: "/food_products/alfarm.avif",
  g5: "/food_products/fishfry.jpg",
  w1: "/food_products/shawarma (1).png",
};

function matchesCategory(item, category) {
  switch (category) {
    case "malabar":
      return ["kerala-rice", "kerala-favorites", "bakery", "sides"].includes(
        item.category
      );
    case "arabian":
      return ["platters", "wraps"].includes(item.category);
    case "seafood":
      return ["kf3", "g5"].includes(item.id);
    case "vegetarian":
      return item.veg;
    default:
      return item.category === category;
  }
}

export default function Menu() {
  const { t } = useApp();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFullMenu, setShowFullMenu] = useState(false);
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

  const filteredItems = MENU_ITEMS.filter((item) =>
    activeCategory === "all" ? true : matchesCategory(item, activeCategory)
  );
  const visibleItems =
    activeCategory === "all" && !showFullMenu
      ? filteredItems.filter((item) => FEATURED_MENU_IDS.includes(item.id))
      : filteredItems;

  const selectCategory = (category) => {
    setActiveCategory(category);
    setShowFullMenu(false);
  };

  return (
    <section
      ref={sectionRef}
      id="menu"
      className="relative w-full overflow-hidden bg-white py-24 text-[#2d241d] sm:py-28 md:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(212,162,76,0.11),transparent_68%)]" />
        <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(201,54,54,0.06),transparent_68%)]" />
        <Utensils className="absolute -left-5 top-24 h-24 w-24 -rotate-45 text-[#caa461]/10 sm:left-4 sm:h-32 sm:w-32" />
        <CookingPot className="absolute -right-5 top-40 h-20 w-20 rotate-12 text-[#caa461]/10 sm:right-6 sm:h-28 sm:w-28" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header
          className={`mx-auto mb-10 max-w-3xl text-center transition-all duration-700 sm:mb-12 ${
            isInView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <h2
            className="text-3xl uppercase leading-tight tracking-[0.035em] text-[#2d241d] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            From Malabar to the <span className="text-[#f25050]">Middle East</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-[#766858] sm:text-base">
            A journey through beloved regional recipes, charcoal-fired
            favorites, and the flavors that bring us together.
          </p>
        </header>

        <nav
          aria-label="Filter menu by category"
          className={`mb-10 overflow-x-auto pb-2 transition-all duration-700 sm:mb-12 ${
            isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <div className="mx-auto flex w-max items-center gap-2 sm:gap-2.5">
            {MENU_TABS.map(({ id, name, Icon }) => {
              const isActive = activeCategory === id;

              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectCategory(id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-[10px] font-semibold tracking-wide transition-all duration-200 sm:px-4 sm:text-[11px] ${
                    isActive
                      ? "border-[#f25050] bg-[#f25050] text-white shadow-[0_6px_18px_rgba(242,80,80,0.2)]"
                      : "border-[#e8dfd1] bg-white/80 text-[#716453] hover:border-[#caa461]/70 hover:bg-[#fffaf0] hover:text-[#2d241d]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t(name)}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div
          id="menu-items-grid"
          className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleItems.map((item, index) => {
            const image = MENU_IMAGES[item.id];
            const FallbackIcon = item.veg
              ? Leaf
              : item.category === "desserts"
                ? CakeSlice
                : CookingPot;

            return (
              <article
                key={item.id}
                className={`group flex min-h-[184px] overflow-hidden rounded-2xl border border-[#eee4d5] bg-white shadow-[0_8px_24px_rgba(61,47,30,0.055)] transition-all duration-700 hover:-translate-y-1 hover:border-[#d8bc8a] hover:shadow-[0_16px_34px_rgba(61,47,30,0.12)] ${
                  isInView
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}
                style={{ transitionDelay: `${Math.min(index * 55, 330)}ms` }}
              >
                <div className="relative min-h-[184px] w-[40%] shrink-0 overflow-hidden bg-[#f3eadc]">
                  {image ? (
                    <Image
                      src={image}
                      alt={t(item.name)}
                      fill
                      sizes="(max-width: 640px) 40vw, (max-width: 1280px) 20vw, 14vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full min-h-[184px] items-center justify-center bg-[radial-gradient(circle_at_30%_25%,#fffaf0,#eee0ca)]">
                      <FallbackIcon
                        className="h-12 w-12 text-[#b58b51]/60"
                        strokeWidth={1.1}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
                  {item.isChefPick && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#fffaf0]/95 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#8a642c] shadow-sm sm:left-3 sm:top-3 sm:text-[9px]">
                      <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                      Chef&apos;s Pick
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col items-start p-3.5 sm:p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {item.spicy && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0ed] px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-[#b64238]">
                        <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                        Spiced
                      </span>
                    )}
                    {item.veg && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#edf6ee] px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-[#34714a]">
                        <Leaf className="h-2.5 w-2.5" aria-hidden="true" />
                        Vegetarian
                      </span>
                    )}
                    {!item.spicy && !item.veg && !item.isChefPick && (
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a88a5e]">
                        Made fresh
                      </span>
                    )}
                  </div>

                  <h3 className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-[#332a21] transition-colors group-hover:text-[#a83b32] sm:text-base">
                    {t(item.name)}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-[#776a5b] sm:text-[11px]">
                    {t(item.desc)}
                  </p>

                </div>
              </article>
            );
          })}
        </div>

        {activeCategory === "all" && (
          <div className="mt-10 flex justify-center sm:mt-12">
            <button
              type="button"
              aria-controls="menu-items-grid"
              aria-expanded={showFullMenu}
              onClick={() => setShowFullMenu((current) => !current)}
              className="group inline-flex items-center gap-3 rounded-full border border-[#f25050] bg-[#f25050] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(242,80,80,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#df4444] hover:shadow-[0_14px_28px_rgba(242,80,80,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#caa461] focus-visible:ring-offset-2 sm:px-7 sm:text-[11px]"
            >
              {showFullMenu ? "Show Signature Picks" : "View Full Menu"}
              <ArrowRight
                className={`h-3.5 w-3.5 transition-transform ${
                  showFullMenu ? "-rotate-90" : "group-hover:translate-x-1"
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
