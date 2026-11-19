const MAX_SHOWCASE_FRAMES = 120;
const buildFrameSequence = (total, directory) =>
  Array.from({ length: Math.min(total, MAX_SHOWCASE_FRAMES) }, (_, index) => {
    const frame = String(index + 1).padStart(3, "0");
    return `/${directory}/frame_${frame}.webp`;
  });
const buildEzgifFrameSequence = (total, directory) =>
  Array.from({ length: total }, (_, index) => {
    const frame = String(index + 1).padStart(3, "0");
    return `/${directory}/ezgif-frame-${frame}.jpg`;
  });
const buildPngFrameSequence = (total, directory) =>
  Array.from({ length: total }, (_, index) => {
    const frame = String(index + 1).padStart(5, "0");
    return `/${directory}/${frame}.png`;
  });

export const BIRYANI_FRAMES = buildFrameSequence(105, "biriyani_frames-webp");

export const TANDOORI_FRAMES = buildFrameSequence(120, "tandoori_frames-webp");

export const FRIED_RICE_FRAMES = buildFrameSequence(120, "friedrice_frames-webp");

export const PLUM_CAKE_FRAMES = buildFrameSequence(120, "plumcake_frames-webp");

export const SHAWARMA_FRAMES = buildFrameSequence(65, "shawarma_frames-webp");

export const VANCHO_FRAMES = buildFrameSequence(63, "vancho_frames-webp");

export const STRAWBERRY_FRAMES = buildFrameSequence(55, "strobery_frames-webp");

export const BURGER_FRAMES = buildPngFrameSequence(190, "burger_frame");

export const VEGSOUP_FRAMES = buildEzgifFrameSequence(238, "vegsoup_frame");

export const SHOWCASE_SCENES = [
  {
    id: "burger",
    title: "Double Smash Burger",
    tagline: "FIRE-GRILLED, STACKED WITH FLAVOUR",
    frames: BURGER_FRAMES,
    glow: "rgba(216, 111, 54, 0.18)",
  },
  {
    id: "veg-soup",
    title: "Vegetable Soup",
    tagline: "FRESH VEGETABLES, SLOW-SIMMERED TO PERFECTION",
    frames: VEGSOUP_FRAMES,
    glow: "rgba(128, 157, 88, 0.18)",
  },
  {
    id: "biryani",
    title: "Chicken Dum Biriyani",
    tagline: "THE ROYAL TASTE OF TRADITION",
    frames: BIRYANI_FRAMES,
    glow: "rgba(229, 169, 60, 0.18)",
  },
  {
    id: "tandoori",
    title: "Tandoori",
    tagline: "CHARCOAL-KISSED, SPICE-RICH PERFECTION",
    frames: TANDOORI_FRAMES,
    glow: "rgba(216, 111, 54, 0.18)",
  },
  {
    id: "fried-rice",
    title: "Fried Rice",
    tagline: "WOK-TOSSED WITH AROMATIC FLAVOURS",
    frames: FRIED_RICE_FRAMES,
    glow: "rgba(223, 173, 82, 0.18)",
  },
  {
    id: "shawarma",
    title: "Shawarma",
    tagline: "AUTHENTIC ARABIC FLAVOUR",
    frames: SHAWARMA_FRAMES,
    glow: "rgba(224, 122, 56, 0.18)",
  },
  {
    id: "plum-cake",
    title: "Plum Cake",
    tagline: "A CELEBRATION OF RICH, FRUITY FLAVOURS",
    frames: PLUM_CAKE_FRAMES,
    glow: "rgba(8, 8, 8, 0.12)",
  },
  {
    id: "vancho",
    title: "Vancho Cake",
    tagline: "A PERFECT BLEND OF CHOCOLATE & VANILLA",
    frames: VANCHO_FRAMES,
    glow: "rgba(212, 162, 76, 0.18)",
  },
  {
    id: "strawberry",
    title: "Strawberry Cake",
    tagline: "A MOMENT OF SWEET PERFECTION",
    frames: STRAWBERRY_FRAMES,
    glow: "rgba(224, 83, 104, 0.18)",
  },
];
