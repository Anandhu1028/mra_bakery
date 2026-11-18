"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CakeSlice,
  CookingPot,
  Flame,
  Leaf,
  Star,
  Utensils,
} from "lucide-react";
import { MENU_CATEGORIES } from "@/lib/menu-data";
import { useApp } from "@/context/AppContext";

const MENU_TABS = [
  { id: "all", name: { en: "All Dishes" }, Icon: Utensils },
  ...MENU_CATEGORIES.map(({ id, name }) => ({
    id,
    name: { en: name },
    Icon: Utensils,
  })),
];

const MENU_IMAGES = Object.fromEntries(
  MENU_CATEGORIES.slice(0, 18).map(({ id }, index) => [
    id,
    `/menu/category-${String(index + 1).padStart(2, "0")}.jpg`,
  ])
);

const MENU_ITEMS = MENU_CATEGORIES.flatMap((category) =>
  category.items.map((name, index) => ({
    id: `${category.id}-${index + 1}`,
    name: { en: name },
    category: category.id,
    desc: { en: category.name },
    image: MENU_IMAGES[category.id],
  }))
);

export default function Menu() {
  const { t } = useApp();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const visibleItems =
    activeCategory === "all"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === activeCategory);
  const visibleTabs = showAllCategories ? MENU_TABS : MENU_TABS.slice(0, 11);

  const selectCategory = (category) => {
    setActiveCategory(category);
  };

  return (
    <section
      id="menu"
      className="relative w-full scroll-mt-16 overflow-hidden bg-white py-14 text-[#2d241d] sm:scroll-mt-20 sm:py-16 md:py-20 lg:scroll-mt-24 xl:py-24"
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">
        <header
          className="mx-auto mb-8 max-w-3xl text-center transition-all duration-700 sm:mb-10"
        >
          <h2
            className="text-balance text-3xl uppercase leading-tight tracking-[0.035em] text-[#2d241d] sm:text-4xl md:text-5xl"
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
          className="mb-8 transition-all duration-700 sm:mb-10"
        >
          <div
            id="menu-category-tabs"
            className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-2"
          >
            {visibleTabs.map(({ id, name, Icon }) => {
              const isActive = activeCategory === id;

              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectCategory(id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-semibold tracking-wide transition-all duration-200 sm:px-4 sm:py-2.5 sm:text-[11px] ${
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
          {!showAllCategories && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                aria-controls="menu-category-tabs"
                aria-expanded={showAllCategories}
                onClick={() => setShowAllCategories(true)}
                className="rounded-full border border-[#f25050] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c33e3e] transition-colors hover:bg-[#fff3f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25050] focus-visible:ring-offset-2 sm:text-[11px]"
              >
                Load More Categories
              </button>
            </div>
          )}
        </nav>

        <div
          id="menu-items-grid"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4"
        >
          {visibleItems.map((item) => {
            const image = item.image;
            const FallbackIcon = item.veg
              ? Leaf
              : item.category.includes("dessert") ||
                  item.category.includes("ice-cream") ||
                  item.category === "falooda"
                ? CakeSlice
                : CookingPot;

            return (
              <article
                key={item.id}
                className="group flex min-w-0 min-h-[156px] overflow-hidden rounded-2xl border border-[#eee4d5] bg-white shadow-[0_8px_24px_rgba(61,47,30,0.055)] transition-all duration-700 hover:-translate-y-1 hover:border-[#d8bc8a] hover:shadow-[0_16px_34px_rgba(61,47,30,0.12)] sm:min-h-[170px] lg:min-h-[184px]"
              >
                <div className="relative min-h-[156px] w-[38%] shrink-0 overflow-hidden bg-[#f3eadc] sm:min-h-[170px] sm:w-[40%] lg:min-h-[184px]">
                  {image ? (
                    <Image
                      src={image}
                      alt={t(item.name)}
                      fill
                      sizes="(max-width: 639px) 38vw, (max-width: 1023px) 20vw, (max-width: 1535px) 12vw, 9vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full min-h-[156px] items-center justify-center bg-[radial-gradient(circle_at_30%_25%,#fffaf0,#eee0ca)] sm:min-h-[170px] lg:min-h-[184px]">
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

                <div className="flex min-w-0 flex-1 flex-col items-start p-3 sm:p-3.5 lg:p-4">
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
      </div>
    </section>
  );
}