"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BRAND, NAV_LINKS, FOOTER_CONTENT } from "@/lib/content";
import { useApp } from "@/context/AppContext";
import { useSmoothScroll } from "@/context/SmoothScrollContext";
import { Flame, Send, ArrowUp, ShieldCheck } from "lucide-react";

export default function Footer() {
  const { t } = useApp();
  const { scrollTo } = useSmoothScroll();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  const scrollToTop = () => {
    scrollTo(0);
  };

  return (
    <footer id="contact" className="relative w-full bg-[#050505] text-[#f5ecd9] pt-20 pb-12 border-t border-[#1a1a1a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-neutral-900">
          {/* Brand & Vision (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative h-12 w-32 flex items-center">
                <Image
                  src="/logo/mra-red-white.webp"
                  alt="MRA Bakery & Restaurant"
                  fill
                  className="object-contain object-start brightness-110"
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#f5ecd9]/65 font-light leading-relaxed max-w-sm mb-6">
              {t(FOOTER_CONTENT.about)}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black border border-[#ffffff]/30 text-[11px] text-[#ffffff]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ef4444]" />
              <span>{t(FOOTER_CONTENT.halalCertified)}</span>
            </div>
          </div>

          {/* Quick Navigation Links (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#ffffff] mb-5">
              {t(FOOTER_CONTENT.quickLinksTitle)}
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollTo(`#${link.id}`);
                    }}
                    className="text-xs uppercase tracking-wider text-[#f5ecd9]/75 hover:text-[#ef4444] transition-colors"
                  >
                    {t(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Circle (4 cols) */}
          <div className="lg:col-span-4">
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#ffffff] mb-3">
              {t(FOOTER_CONTENT.newsletterTitle)}
            </h4>
            <p className="text-xs text-[#f5ecd9]/65 font-light leading-relaxed mb-4">
              {t(FOOTER_CONTENT.newsletterDesc)}
            </p>

            {subscribed ? (
              <div className="p-3 rounded-xl bg-[#0d0d0d] border border-emerald-500/40 text-emerald-400 text-xs">
                {"Welcome to The Hearth Circle. Invitation sent."}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(FOOTER_CONTENT.newsletterPlaceholder)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#0d0d0d] border border-[#242424] focus:border-[#ffffff] focus:outline-none text-xs text-[#f5ecd9] placeholder-neutral-500"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ef4444] to-[#ffffff] text-black font-semibold text-xs tracking-wider uppercase active:scale-95 transition-transform"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="mt-6 text-xs text-[#f5ecd9]/50">
              <span className="font-mono">{BRAND.phoneFormatted}</span> •{" "}
              <span>{BRAND.email}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back-to-Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#f5ecd9]/50">
          <div>
            © 2026 {t(BRAND.name)}. {t(FOOTER_CONTENT.rights)}
          </div>

          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-800 bg-[#0d0d0d] text-[#f5ecd9]/80 hover:text-[#ffffff] hover:border-[#ffffff]/40 transition-colors cursor-pointer"
          >
            <span>{"Back to top"}</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
