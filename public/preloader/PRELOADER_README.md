# MRA Bakery & Restaurant — Minimal Logo Preloader

## Tunable Constants in `components/Preloader.jsx`

All animation timings and dimensions can be customized at the top of [components/Preloader.jsx](file:///d:/projects/shawarma-site/components/Preloader.jsx):

```javascript
// Path to the brand logo
export const LOGO_SRC = "/logo/mra-red-white.webp";

// Horizontal 360° spin duration in seconds (default: 3.5s)
export const ROTATION_SPEED = 3.5;

// Light sweep shine cycle across the logo in seconds (default: 2.0s)
export const SHINE_INTERVAL = 2.0;

// Minimum visible duration before exit can trigger (default: 1800ms)
export const MIN_DISPLAY_MS = 1800;

// Maximum safety timeout before exiting anyway (default: 5000ms)
export const MAX_DISPLAY_MS = 5000;

// Session storage key to display only once per session
export const SESSION_KEY = "mra_preloader_seen";

// Subtle ambient ember particles count (default: 18, max 20)
export const PARTICLE_COUNT = 18;
```

### Changing the Logo Size
The logo size is configured directly on the responsive container in `components/Preloader.jsx`:
- **Desktop & Tablet**: `clamp(220px, 32vw, 420px)`
- **Mobile**: `60vw` (maximum `92vw` bounded)
- **Aspect Ratio**: Locked to `1600 / 1014` to prevent distortion.

### How the Masked Shine Effect Works
The diagonal white light sweep uses CSS `mask-image: url(/logo/mra-red-white.webp)` and `mix-blend-mode: screen`. This ensures the shine is strictly clipped to the logo's alpha silhouette and never bleeds outside the oval shape.
