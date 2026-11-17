"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [headerCounterBump, setHeaderCounterBump] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }, []);

  const t = (translatable) => {
    if (!translatable) return "";
    if (typeof translatable === "string") return translatable;
    return translatable.en || "";
  };

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.id === item.id && i.size === item.size
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + (item.quantity || 1),
        };
        return next;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });

    // Trigger header counter bump
    setHeaderCounterBump(true);
    setTimeout(() => {
      setHeaderCounterBump(false);
    }, 400);
  }, []);

  const removeFromCart = useCallback((id, size) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  }, []);

  const updateQuantity = useCallback((id, size, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id && i.size === size) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  }, []);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        t,
        cart,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        removeFromCart,
        updateQuantity,
        headerCounterBump,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
