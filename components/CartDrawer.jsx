"use client";

import React from "react";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatRupees } from "@/lib/cakes";

export default function CartDrawer() {
  const { cart, cartCount, isCartOpen, closeCart, updateQuantity, removeFromCart } = useApp();

  const totalAmount = cart.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isCartOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <aside
        className={`absolute top-0 bottom-0 right-0 w-full max-w-md bg-[#0a0a0a] border-l border-[#d4a24c]/30 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Order Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#242424]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4a24c]/15 text-[#d4a24c] border border-[#d4a24c]/30">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#f5ecd9]">Your Order</h2>
              <p className="text-[11px] text-[#f5ecd9]/60">
                {cartCount === 0 ? "Cart is empty" : `${cartCount} item${cartCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-2 text-[#f5ecd9]/60 hover:text-white transition-colors rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="h-16 w-16 rounded-full border border-dashed border-[#d4a24c]/30 flex items-center justify-center text-[#d4a24c]/40 mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="font-serif text-lg text-[#f5ecd9]/80">No cakes added yet</p>
              <p className="text-xs text-[#f5ecd9]/50 max-w-xs mt-1">
                Explore our signature cakes and add your favourites to order.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="flex gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] items-center"
              >
                {item.image && (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#f5ecd9] truncate">{item.name}</h3>
                  <p className="text-[11px] text-[#d4a24c]">
                    Size: {item.size} {item.serves ? `(${item.serves})` : ""}
                  </p>
                  <p className="text-xs font-semibold text-[#f5ecd9] mt-1">
                    {formatRupees(item.price * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-white/15 rounded-full bg-black/40">
                    <button
                      onClick={() => updateQuantity(item.id, item.size, -1)}
                      aria-label="Decrease quantity"
                      className="p-1.5 text-neutral-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono px-2 text-[#f5ecd9]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.size, 1)}
                      aria-label="Increase quantity"
                      className="p-1.5 text-neutral-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id, item.size)}
                    aria-label="Remove item"
                    className="p-1 text-neutral-500 hover:text-[#ef4444] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#242424] bg-black/60 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#f5ecd9]/70">Subtotal</span>
              <span className="font-serif text-lg font-bold text-[#d4a24c]">
                {formatRupees(totalAmount)}
              </span>
            </div>
            <p className="text-[10px] text-[#f5ecd9]/50">
              * Taxes and delivery calculated at checkout. Made fresh within 24 hours.
            </p>
            <a
              href="https://wa.me/919567200001?text=Hello%20MRA%20Bakery,%20I%20would%20like%20to%20order%20signature%20cakes."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#d4a24c] hover:bg-[#e2bd77] text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-[#d4a24c]/20"
            >
              <span>Proceed to WhatsApp Order</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
