export const CAKE_SIZES = [
  { label: "500 g", serves: "Serves 4" },
  { label: "1 kg", serves: "Serves 8" },
  { label: "2 kg", serves: "Serves 16" },
];

export const CAKES_DATA = [
  {
    id: "classic-vanilla",
    name: "Classic Vanilla",
    tag: "Classic",
    line: "Soft vanilla sponge with fresh cream.",
    basePrice: 549,
    photo: "/cakes/classic-vanilla.webp",
    image: "/cakes/classic-vanilla.webp",
    highlights: [
      {
        icon: "Sparkles",
        title: "Whipped Cream",
        line: "Light silky cream piped by hand.",
      },
      {
        icon: "Layers",
        title: "Vanilla Sponge",
        line: "Soft crumb gently scented with vanilla.",
      },
      {
        icon: "Heart",
        title: "Pure Vanilla",
        line: "Infused with fragrant Madagascar vanilla pods.",
      },
    ],
  },
  {
    id: "dark-chocolate-truffle",
    name: "Dark Chocolate Truffle",
    tag: "Bestseller",
    line: "Dark cocoa sponge with glossy ganache.",
    basePrice: 699,
    photo: "/cakes/dark-chocolate-truffle.webp",
    image: "/cakes/dark-chocolate-truffle.webp",
    highlights: [
      {
        icon: "Sparkles",
        title: "Dark Ganache",
        line: "Smooth rich chocolate ganache glaze.",
      },
      {
        icon: "Layers",
        title: "Cocoa Layers",
        line: "Three soft tall cocoa sponge tiers.",
      },
      {
        icon: "Cookie",
        title: "Chocolate Shards",
        line: "Crisp hand-cut dark chocolate curls.",
      },
    ],
  },
  {
    id: "red-velvet-cream",
    name: "Red Velvet Cream",
    tag: "Favourite",
    line: "Velvet cocoa crumb with cream cheese.",
    basePrice: 649,
    photo: "/cakes/red-velvet-cream.webp",
    image: "/cakes/red-velvet-cream.webp",
    highlights: [
      {
        icon: "Sparkles",
        title: "Velvet Crumb",
        line: "Tender buttermilk cocoa sponge layers.",
      },
      {
        icon: "Layers",
        title: "Cream Cheese",
        line: "Silky whipped frosting between soft tiers.",
      },
      {
        icon: "Heart",
        title: "Ruby Dusting",
        line: "Delicate cocoa crumb dusting on top.",
      },
    ],
  },
  {
    id: "strawberry-cream",
    name: "Strawberry Cream",
    tag: "Fresh",
    line: "Sweet strawberry glaze with vanilla mousse.",
    basePrice: 599,
    photo: "/cakes/strawberry-cream.webp",
    image: "/cakes/strawberry-cream.webp",
    highlights: [
      {
        icon: "Cherry",
        title: "Fresh Berries",
        line: "Sun-ripened strawberry coulis and compote.",
      },
      {
        icon: "Sparkles",
        title: "Vanilla Mousse",
        line: "Light cloud of sweet whipped cream.",
      },
      {
        icon: "Layers",
        title: "Golden Sponge",
        line: "Featherlight sponge baked fresh daily.",
      },
    ],
  },
  {
    id: "butterscotch-crunch",
    name: "Butterscotch Crunch",
    tag: "Crunchy",
    line: "Golden caramel cream with toasted praline.",
    basePrice: 649,
    photo: "/cakes/butterscotch-crunch.webp",
    image: "/cakes/butterscotch-crunch.webp",
    highlights: [
      {
        icon: "Sparkles",
        title: "Butter Caramel",
        line: "Slow-simmered golden brown butter drizzle.",
      },
      {
        icon: "Cookie",
        title: "Toasted Praline",
        line: "Crispy cashew nougatine crunch pieces.",
      },
      {
        icon: "Layers",
        title: "Caramel Sponge",
        line: "Moist sponge soaked in caramel syrup.",
      },
    ],
  },
  {
    id: "black-forest",
    name: "Black Forest",
    tag: "Signature",
    line: "Dutch cocoa sponge with tart cherries.",
    basePrice: 699,
    photo: "/cakes/black-forest.webp",
    image: "/cakes/black-forest.webp",
    highlights: [
      {
        icon: "Sparkles",
        title: "Dark Shavings",
        line: "Grated 70 percent Belgian dark chocolate.",
      },
      {
        icon: "Cherry",
        title: "Tart Cherries",
        line: "Spiced sour cherry compote filling.",
      },
      {
        icon: "Layers",
        title: "Chantilly Cream",
        line: "Fresh whipped cream layered throughout.",
      },
    ],
  },
];

export function formatRupees(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
