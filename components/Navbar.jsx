"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { NAV_LINKS } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { useSmoothScroll } from "@/context/SmoothScrollContext";
import {
  Home as HomeIcon,
  Info,
  MapPin,
  Menu as MenuIcon,
  Phone,
  ShoppingBag,
  Utensils,
  X,
} from "lucide-react";
import CartDrawer from "@/components/CartDrawer";

const NAV_LINK_ICONS = {
  "hero-track": HomeIcon,
  story: Info,
  menu: Utensils,
  branches: MapPin,
  contact: Phone,
};

export default function Navbar() {
  const { t, cartCount, openCart, headerCounterBump } = useApp();
  const { scrollTo } = useSmoothScroll();
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLinkId, setActiveLinkId] = useState("hero-track");

  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerHeight * 0.85;
      setIsScrolledPastHero(window.scrollY > threshold);

      const activationLine = Math.max(100, window.innerHeight * 0.3);
      let currentLinkId = NAV_LINKS[0]?.id ?? "hero-track";

      for (const link of NAV_LINKS) {
        const sectionId = link.id === "hero-track" ? "hero" : link.id;
        const section = document.getElementById(sectionId);

        if (section && section.getBoundingClientRect().top <= activationLine) {
          currentLinkId = link.id;
        } else if (section) {
          break;
        }
      }

      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      ) {
        currentLinkId = NAV_LINKS[NAV_LINKS.length - 1]?.id ?? currentLinkId;
      }

      setActiveLinkId(currentLinkId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (id === "hero-track" || id === "home") {
      scrollTo(0);
      return;
    }
    scrollTo(`#${id}`);
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
          isScrolledPastHero
            ? "bg-[#120f0d]/95 backdrop-blur-2xl py-1.5 sm:py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            : "bg-gradient-to-b from-[#100d0b]/95 via-[#100d0b]/55 to-transparent py-2 sm:py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo with Increased Size and Masked Light Sweep Shining */}
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollTo(0);
            }}
            className="flex items-center gap-2 group focus:outline-none"
            aria-label="MRA Bakery & Restaurant Home"
          >
            <div
              className={`relative transition-all duration-300 flex items-center ${
                isScrolledPastHero
                  ? "h-11 w-28 sm:h-13 sm:w-36"
                  : "h-12 w-32 sm:h-15 sm:w-42 md:h-16 md:w-44"
              }`}
            >
              {/* Main Crisp MRA Logo */}
              <Image
                src="/logo/mra-red-white.webp"
                alt="MRA Bakery & Restaurant"
                fill
                priority
                sizes="(max-width: 640px) 130px, 180px"
                className="object-contain object-start brightness-110 drop-shadow-[0_4px_16px_rgba(239,68,68,0.25)] transition-transform duration-300 group-hover:scale-105"
              />

              {/* Diagonal Light Sweep Shine Effect (Clipped strictly to the logo mask) */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  WebkitMaskImage: "url(/logo/mra-red-white.webp)",
                  maskImage: "url(/logo/mra-red-white.webp)",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskPosition: "left center",
                  maskPosition: "left center",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  mixBlendMode: "screen",
                }}
              >
                <div
                  className="w-[45%] h-[190%] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                  style={{
                    position: "absolute",
                    top: "-45%",
                    left: 0,
                    animation: "navbarLogoShine 3.2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </a>

          {/* Desktop Nav Links (Clean, non-intrusive) */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-6 lg:gap-8"
          >
            {NAV_LINKS.map((link) => {
              const Icon = NAV_LINK_ICONS[link.id];
              const isActive = activeLinkId === link.id;

              return (
                <button
                  key={link.id}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => scrollToSection(link.id)}
                  className={`relative inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors focus:outline-none focus:text-white ${
                    isActive
                      ? "border-[#f25050]/50 bg-[#5b2420]/75 text-[#fff8ed] shadow-[0_0_18px_rgba(242,80,80,0.12)]"
                      : "text-[#eadcc8]/80 hover:border-[#d4a24c]/20 hover:bg-white/[0.03] hover:text-[#d4a24c]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t(link.label)}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {cartCount > 0 && (
              <button
                onClick={openCart}
                aria-label={`View cart (${cartCount} items)`}
                className={`relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white/[0.04] border border-[#d4a24c]/40 text-[#f5ecd9] hover:border-[#d4a24c] hover:bg-[#d4a24c]/10 transition-all focus:outline-none focus:ring-2 focus:ring-[#d4a24c] ${
                  headerCounterBump ? "scale-115 border-[#d4a24c] bg-[#d4a24c]/20 ring-2 ring-[#d4a24c]/50" : "scale-100"
                }`}
                style={{
                  transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s, border-color 0.2s",
                }}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a24c]" />
                <span
                  className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#d4a24c] text-black text-[10px] font-bold font-mono shadow-md ${
                    headerCounterBump ? "scale-125 bg-white text-black" : "scale-100"
                  }`}
                  style={{
                    transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {cartCount}
                </span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
              className="md:hidden p-2 text-[#f5ecd9] hover:text-[#d4a24c] focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 bottom-0 right-0 w-full max-w-xs bg-[#15120f] border-s border-white/10 p-6 flex flex-col justify-start transition-transform duration-300 ease-out ${
            mobileMenuOpen
              ? "translate-x-0"
              : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="relative h-11 w-32">
                <Image
                  src="/logo/mra-red-white.webp"
                  alt="MRA Bakery & Restaurant"
                  fill
                  className="object-contain object-start brightness-110 drop-shadow-[0_2px_10px_rgba(239,68,68,0.2)]"
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[#d7c8b3] transition-colors hover:text-[#d4a24c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            <div className="py-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => {
                const Icon = NAV_LINK_ICONS[link.id];
                const isActive = activeLinkId === link.id;

                return (
                  <button
                    key={link.id}
                    aria-current={isActive ? "location" : undefined}
                    onClick={() => scrollToSection(link.id)}
                    className={`flex w-full items-center gap-3 rounded-full border px-3 py-3 text-start text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
                      isActive
                        ? "border-[#f25050]/50 bg-[#5b2420]/75 text-[#fff8ed] shadow-[0_0_18px_rgba(242,80,80,0.12)]"
                        : "border-transparent border-b-white/10 text-[#eadcc8]/85 hover:border-b-white/25 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t(link.label)}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
