// lib/content.js
// Single source of truth for all editable English content across the website.

export const PRELOADER_CONTENT = {
  stages: [
    { min: 0, max: 25, en: "Lighting the fire" },
    { min: 25, max: 55, en: "Kneading the dough" },
    { min: 55, max: 85, en: "Baking fresh bread" },
    { min: 85, max: 100, en: "Served hot" },
  ],
  skip: {
    en: "Skip",
  },
};

export const BRAND = {
  name: {
    en: "MRA",
  },
  suffix: {
    en: "Bakery & Restaurant",
  },
  logo: "/logo/mra-red-white.webp",
  tagline: {
    en: "Forged in Flame, Crafted By Tradition",
  },
  established: 1996,
  phone: "+91 95672 00001",
  phoneFormatted: "+91 95672 00001",
  email: "hello@mra-bakery.com",
  currency: {
    en: "INR",
  },
  headquarters: {
    en: "Mavoor Road, Kozhikode, Kerala, India",
  },
};

export const NAV_LINKS = [
  { id: "hero-track", label: { en: "Home" } },
  { id: "story", label: { en: "About Us" } },
  { id: "menu", label: { en: "Menu" } },
  { id: "branches", label: { en: "Locations" } },
  { id: "contact", label: { en: "Contact Us" } },
];

export const HERO_CONTENT = {
  overlays: [
    {
      range: [0.0, 0.12],
      title: {
        en: "Fresh off the spit",
      },
      subtitle: {
        en: "Hand-stacked prime cuts slowly roasted over fragrant charcoal embers",
      },
    },
    {
      range: [0.75, 1.0],
      title: {
        en: "Cooked over real fire",
      },
      subtitle: {
        en: "Ancient Levant fire roasting meets stone hearth artisan baking",
      },
    },
  ],
  scrollHint: {
    en: "SCROLL TO IGNITE",
  },
};

export const STORY_CONTENT = {
 
  heading: {
    en: "Forged in Flame, Crafted",
    highlight: "by Tradition",
  },
  paragraphs: {
    en: [
      "For three decades, MRA has mastered the art of authentic live charcoal grills, stone bakery, and handcrafted desserts.",
      "Every dish is made fresh daily with prime cuts and natural oak charcoal — zero shortcuts, pure flavor.",
    ],
  },
  stats: [
    {
      value: 28,
      suffix: "+",
      label: { en: "Years of Heritage" },
      sub: { en: "Since 1996" },
    },
    {
      value: 14,
      suffix: "",
      label: { en: "Flagship Branches" },
      sub: { en: "Across UAE & KSA" },
    },
    {
      value: 1.8,
      suffix: "M+",
      label: { en: "Happy Guests" },
      sub: { en: "Served yearly" },
    },
  ],
};

export const SIGNATURE_DISHES = [
  {
    id: "sig-shawarma",
    title: {
      en: "Shawarma",
    },
    category: "shawarma",
    price: 68,
    badge: { en: "Signature • #1 Bestseller" },
    description: {
      en: "Shawarma ",
    },
    image: "/food_products/shawarma (1).png",
    spicy: false,
    veg: false,
    prepTime: "12 mins",
    calories: "540 kcal",
  },
  {
    id: "sig-al-faham",
    title: {
      en: "Al Faham ",
    },
    category: "grills",
    price: 74,
    badge: { en: "Fire Master Special" },
    description: {
      en: "Chicken grille.",
    },
    image: "/food_products/alfarm.jpeg",
    spicy: false,
    veg: false,
    prepTime: "25 mins",
    calories: "1120 kcal",
  },
  {
    id: "sig-fish-fry",
    title: {
      en: "Fish Fry",
    },
    category: "grills",
    price: 36,
    badge: { en: "Crispy & Spiced" },
    description: {
      en: "Fish fried with aromatic spices.",
    },
    image: "/food_products/fishfry.jpg",
    spicy: true,
    veg: false,
    prepTime: "8 mins",
    calories: "410 kcal",
  },
  {
    id: "sig-chicken-biriyani",
    title: {
      en: "Chicken Biriyani",
    },
    category: "kerala-rice",
    price: 240,
    badge: { en: "Kerala Dum Classic" },
    description: {
      en: "Layered rice and spiced chicken cooked dum-style .",
    },
    image: "/food_products/chickenbiriyani.jpg",
    spicy: true,
    veg: false,
    prepTime: "30 mins",
  },
];

export const BAKERY_SECTION = {
  badge: {
    en: "ANCIENT STONE HEARTH • 450°C CLAY OVENS",
  },
  title: {
    en: "The Art of Living Dough & Scorched Crust",
  },
  subtitle: {
    en: "Our bakery operates without pause. Flour, water,flame.",
  },
  hoursTitle: {
    en: "Stone Oven Baking Schedule",
  },
  hoursDetail: {
    en: "Fresh artisanal batches exit the hearth every 30 minutes from 06:00 AM to 01:30 AM daily.",
  },
  features: [
    {
      title: { en: "48-Hour Cold Fermentation" },
      desc: { en: "Unlocks deep complex nutty flavors and ensures airy, digestible dough." },
    },
    {
      title: { en: "Volcanic Basalt Stone Deck" },
      desc: { en: "Distributes blisteringly uniform 450°C heat for that authentic charred bubble crust." },
    },
    {
      title: { en: "Heritage Olive Oil & Herbs" },
      desc: { en: "Cold-pressed extra virgin olive oil from ancient groves, paired with mountain za'atar." },
    },
  ],
};

export const MENU_CATEGORIES = [
  { id: "all", name: { en: "All Dishes" } },
  { id: "kerala-rice", name: { en: "Kerala Biryani & Rice" } },
  { id: "kerala-favorites", name: { en: "Kerala Favorites" } },
  { id: "grills", name: { en: "Charcoal Grills" } },
  { id: "wraps", name: { en: "Shawarma & Wraps" } },
  { id: "platters", name: { en: "Arabic Platters" } },
  { id: "bakery", name: { en: "Kerala Breads" } },
  { id: "sides", name: { en: "Sides & Mezze" } },
  { id: "drinks", name: { en: "Drinks" } },
  { id: "desserts", name: { en: "Desserts" } },
];

export const MENU_ITEMS = [
  // Kerala biryani and rice
  {
    id: "kr1",
    name: { en: "Malabar Chicken Dum Biriyani" },
    category: "kerala-rice",
    price: 240,
    spicy: true,
    veg: false,
    isChefPick: true,
    desc: {
      en: "Layered rice and spiced chicken cooked dum-style ",
    },
  },
  {
    id: "kr2",
    name: { en: "Thalassery Beef Biriyani" },
    category: "kerala-rice",
    price: 280,
    spicy: true,
    veg: false,
    isChefPick: false,
    desc: {
      en: "Malabar-style rice layered with slow-cooked beef, fried onions, and aromatic spices.",
    },
  },
  {
    id: "kr3",
    name: { en: "Ghee Rice with Kerala Chicken Roast" },
    category: "kerala-rice",
    price: 260,
    spicy: false,
    veg: false,
    isChefPick: false,
    desc: {
      en: "Fragrant ghee rice served with peppery chicken roast and crisp onions.",
    },
  },
  {
    id: "kr4",
    name: { en: "Vegetable Malabar Biriyani" },
    category: "kerala-rice",
    price: 180,
    spicy: true,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Aromatic rice cooked with seasonal vegetables, herbs, and warm Malabar spices.",
    },
  },

  // Kerala favorites
  {
    id: "kf1",
    name: { en: "Kerala Chicken Curry with Appam" },
    category: "kerala-favorites",
    price: 220,
    spicy: true,
    veg: false,
    isChefPick: true,
    desc: {
      en: "Tender chicken in a coconut-rich Kerala curry with soft, lacy appam.",
    },
  },
  {
    id: "kf2",
    name: { en: "Malabar Beef Roast" },
    category: "kerala-favorites",
    price: 240,
    spicy: true,
    veg: false,
    isChefPick: false,
    desc: {
      en: "Slow-roasted beef with curry leaves, black pepper, and toasted coconut.",
    },
  },
  {
    id: "kf3",
    name: { en: "Kerala Fish Curry with Matta Rice" },
    category: "kerala-favorites",
    price: 280,
    spicy: true,
    veg: false,
    isChefPick: false,
    desc: {
      en: "Kerala-style fish curry with kokum, served with red matta rice.",
    },
  },
  {
    id: "kf4",
    name: { en: "Puttu with Kadala Curry" },
    category: "kerala-favorites",
    price: 140,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Steamed rice puttu with black chickpeas simmered in coconut gravy.",
    },
  },

  // Charcoal grills
  {
    id: "g1",
    name: { en: "Smoky Lamb Rib Chops (Kastaletta)" },
    category: "grills",
    price: 98,
    spicy: false,
    veg: false,
    isChefPick: true,
    desc: {
      en: "Aleppo-rosemary lamb chops, grilled over cedarwood.",
    },
  },
  {
    id: "g3",
    name: { en: "Persian Saffron Shish Tawook" },
    category: "grills",
    price: 68,
    spicy: false,
    veg: false,
    isChefPick: false,
    desc: {
      en: "Saffron chicken skewers with labneh and garlic.",
    },
  },
  {
    id: "g4",
    name: { en: "Al Faham Charcoal Chicken" },
    category: "grills",
    price: 74,
    spicy: true,
    veg: false,
    isChefPick: true,
    desc: {
      en: "Charcoal-grilled chicken marinated with warm Arabic spices and lemon.",
    },
  },
  {
    id: "g5",
    name: { en: "Malabar Spiced Grilled Prawns" },
    category: "grills",
    price: 280,
    spicy: true,
    veg: false,
    isChefPick: false,
    desc: {
      en: "Prawns rubbed with Malabar pepper, curry leaf, and lime, then grilled over charcoal.",
    },
  },

  // Shawarma and wraps
  {
    id: "w1",
    name: { en: "Chicken Shawarma Roll" },
    category: "wraps",
    price: 68,
    spicy: false,
    veg: false,
    isChefPick: true,
    desc: {
      en: "Slow-roasted chicken, garlic sauce, pickles, and crisp vegetables in flatbread.",
    },
  },
  {
    id: "w2",
    name: { en: "Fire-Roasted Halloumi Wrap" },
    category: "wraps",
    price: 36,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Coal-grilled halloumi with olives, rocca, and pomegranate.",
    },
  },
  {
    id: "w3",
    name: { en: "Falafel & Tahini Wrap" },
    category: "wraps",
    price: 48,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Crisp chickpea falafel with tahini, pickles, and fresh herbs.",
    },
  },

  // Arabic platters
  {
    id: "p2",
    name: { en: "Smoked Kabsa with Half Spring Chicken" },
    category: "platters",
    price: 68,
    spicy: true,
    veg: false,
    isChefPick: false,
    desc: {
      en: "Smoked chicken kabsa with black lime, cardamom, and cashews.",
    },
  },
  {
    id: "p1",
    name: { en: "Arabic Chicken Mandi" },
    category: "platters",
    price: 320,
    spicy: false,
    veg: false,
    isChefPick: true,
    desc: {
      en: "Slow-cooked mandi rice with fragrant spices and tender roasted chicken.",
    },
  },
  {
    id: "p3",
    name: { en: "Mixed Grill Platter" },
    category: "platters",
    price: 460,
    spicy: false,
    veg: false,
    isChefPick: false,
    desc: {
      en: "A sharing plate of shish tawook, lamb kebab, and charcoal-grilled vegetables.",
    },
  },

  // Kerala breads and Arabic bakery
  {
    id: "b1",
    name: { en: "Akkawi Cheese & Za'atar Manousheh" },
    category: "bakery",
    price: 42,
    spicy: false,
    veg: true,
    isChefPick: true,
    desc: {
      en: "Stone-baked flatbread topped with Akkawi cheese and fragrant za'atar.",
    },
  },
  {
    id: "b2",
    name: { en: "Malabar Parotta (2 Pieces)" },
    category: "bakery",
    price: 28,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Flaky, layered Kerala flatbread served warm.",
    },
  },
  {
    id: "b3",
    name: { en: "Appam (3 Pieces)" },
    category: "bakery",
    price: 32,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Soft-centered, lacy rice pancakes with crisp edges.",
    },
  },
  {
    id: "b4",
    name: { en: "Pathiri (3 Pieces)" },
    category: "bakery",
    price: 30,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Delicate steamed rice flatbreads, a Malabar favorite.",
    },
  },

  // Sides and mezze
  {
    id: "s1",
    name: { en: "Smoked Charcoal Mutabbal & Pomegranate" },
    category: "sides",
    price: 32,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Smoky aubergine mutabbal with tahini and pomegranate.",
    },
  },
  {
    id: "s2",
    name: { en: "Classic Hummus with Khubz" },
    category: "sides",
    price: 38,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Silky chickpea hummus with tahini, lemon, and warm Arabic bread.",
    },
  },
  {
    id: "s3",
    name: { en: "Pazham Pori" },
    category: "sides",
    price: 35,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Kerala banana fritters with a light, crisp golden coating.",
    },
  },

  // Drinks
  {
    id: "d1",
    name: { en: "Rose Damascus Lemonade with Mint" },
    category: "drinks",
    price: 26,
    spicy: false,
    veg: true,
    isChefPick: true,
    desc: {
      en: "Rose lemonade with fresh mint and sparkling water.",
    },
  },
  {
    id: "d2",
    name: { en: "Sulaimani Chai" },
    category: "drinks",
    price: 18,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Light Kerala black tea brewed with lemon and warming spices.",
    },
  },
  {
    id: "d3",
    name: { en: "Spiced Sambaram" },
    category: "drinks",
    price: 20,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Chilled buttermilk with ginger, green chili, and curry leaves.",
    },
  },
  {
    id: "d4",
    name: { en: "Mint Laban" },
    category: "drinks",
    price: 24,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Cooling yogurt drink blended with mint and a pinch of salt.",
    },
  },

  // Desserts
  {
    id: "sw1",
    name: { en: "Molten Ashta Kunafa on Embers" },
    category: "desserts",
    price: 45,
    spicy: false,
    veg: true,
    isChefPick: true,
    desc: {
      en: "Warm kataifi kunafa with ashta cream and pistachio.",
    },
  },
  {
    id: "sw2",
    name: { en: "Palada Payasam" },
    category: "desserts",
    price: 45,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Slow-simmered rice ada pudding with milk, sugar, and cardamom.",
    },
  },
  {
    id: "sw3",
    name: { en: "Malabar Unniyappam" },
    category: "desserts",
    price: 35,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Sweet rice and banana fritters scented with cardamom and sesame.",
    },
  },
  {
    id: "sw4",
    name: { en: "Umm Ali" },
    category: "desserts",
    price: 55,
    spicy: false,
    veg: true,
    isChefPick: false,
    desc: {
      en: "Warm Arabic pastry pudding with milk, nuts, and raisins.",
    },
  },
];

export const WHY_US_FEATURES = [
  {
  icon: "Flame",
  title: {
    en: "100% Real Charcoal & Oak",
  },
  subtitle: {
    en: "No Gas. No Electric.",
  },
  description: {
    en: "Naturally fire-grilled for rich smoky flavor and tender ",
  },
},
{
  icon: "Wheat",
  title: {
    en: "Fresh Daily Stone Bakery",
  },
  subtitle: {
    en: "Fresh Batches Every 30 Minutes",
  },
  description: {
    en: "Stone-baked breads made fresh with naturally fermented",
  },
},
{
  icon: "ShieldCheck",
  title: {
    en: "Certified Pure Halal",
  },
  subtitle: {
    en: "Premium Ethically Sourced Meats",
  },
  description: {
    en: "Hand-selected Australian lamb and fresh free-range poultry",
  },
},
];

export const BRANCHES_DATA = [
  {
    id: "calicut",
    city: { en: "Calicut" },
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "kochi",
    city: { en: "Kochi" },
    image:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "kannur",
    city: { en: "Kannur" },
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "dubai",
    city: { en: "Dubai" },
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85",
  },
];

export const REVIEWS_DATA = [
  {
    id: "r1",
    name: "Chef Tariq Al-Hashimi",
    role: { en: "Gastronomy Critic, Dubai Food Guide" },
    rating: 5,
    comment: {
      en: "The Wagyu shawarma is transcendent. The smoke from the wood ember spit combined with the freshly tossed saj bread is unmatched in the Middle East.",
    },
  },
  {
    id: "r2",
    name: "Layla Mansoori",
    role: { en: "Hospitality Editor, Gulf Vogue" },
    rating: 5,
    comment: {
      en: "Watching the baker pull hot akkawi fatayer from a 450-degree basalt oven at 1 AM while the spit turns in glowing embers is an absolute culinary spectacle.",
    },
  },
  {
    id: "r3",
    name: "Dr. Karim Boulos",
    role: { en: "Verified Regular Patron" },
    rating: 5,
    comment: {
      en: "Their Al Faham chicken has ruined all other grilled chickens for me. Authentic charcoal smoke makes every bite juicy and fragrant.",
    },
  },
  {
    id: "r4",
    name: "Fatima Al-Qasimi",
    role: { en: "Food & Travel Enthusiast" },
    rating: 5,
    comment: {
      en: "The stone bakery and designer cakes are exceptional. Authentic craftsmanship you can taste in every single bite.",
    },
  },
];

export const FOOTER_CONTENT = {
  about: {
    en: "MRA Bakery & Restaurant is an authentic destination dedicated to wood-fired grills, stone-baked bread, and artisanal cakes.",
  },
  quickLinksTitle: { en: "Navigation" },
  legalTitle: { en: "Assurance" },
  newsletterTitle: { en: "MRA VIP Circle" },
  newsletterDesc: {
    en: "Subscribe for exclusive menu drops, special celebrations, and VIP perks.",
  },
  newsletterPlaceholder: {
    en: "Enter your email...",
  },
  newsletterButton: {
    en: "Join",
  },
  rights: {
    en: "All rights reserved. MRA Bakery & Restaurant Group.",
  },
  halalCertified: {
    en: "100% Certified Halal • Natural Fire Only",
  },
};
