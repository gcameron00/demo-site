# iPadOS Safari Showcase

A static web site that demonstrates many of the modern web platform features that ship in **Safari on iPadOS**. Each demo is small, focused, and meant to be *experienced* on an iPad — pencil input on a real canvas, scroll-driven animations on a real scroll surface, P3 color on a real wide-gamut display, and so on.

The site is intentionally framework-free: plain HTML, CSS, and JavaScript, served as static files from **Cloudflare Pages**.

---

## What it shows

Demos are grouped by theme:

**Input & sensors**
- Apple Pencil & multi-touch via Pointer Events (pressure, tilt, azimuth)
- DeviceMotion / DeviceOrientation (gyro & accelerometer)
- Web Share API and Web Share Target
- Camera access via `getUserMedia`

**Modern CSS**
- `backdrop-filter` glassmorphism that mirrors iPadOS UI
- Scroll-driven animations (`animation-timeline: scroll()` / `view()`)
- Container queries and the `:has()` selector
- Dynamic viewport units (`dvh`, `svh`, `lvh`) for Safari's collapsing toolbars
- Wide-gamut P3 color via `color(display-p3 …)` and `color-mix()`
- Cross-document **View Transitions** between every page

**Audio, graphics & speech**
- WebGL — interactive 3D scene
- Web Audio — touch-playable synthesizer keyboard
- Web Speech — `speechSynthesis` with all available iPadOS voices

**Platform integration**
- Installable **PWA** (manifest, theme color, apple-touch-icon, standalone display)
- Safe-area aware layout (`env(safe-area-inset-*)`)
- Pull-to-refresh, momentum scrolling, scroll snap

See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the full build roadmap and per-demo status.

---

## Project layout

```
.
├── index.html              # Home — feature grid
├── about/                  # About page
├── demos/                  # One folder per demo, each with its own index.html
│   ├── index.html          # Demos catalog
│   ├── pencil/             # Apple Pencil drawing
│   ├── glass/              # backdrop-filter glassmorphism
│   ├── scroll/             # Scroll-driven animations
│   ├── motion/             # DeviceMotion / DeviceOrientation
│   ├── webgl/              # WebGL 3D scene
│   ├── audio/              # Web Audio synth
│   ├── speech/             # Speech synthesis
│   ├── color/              # Wide-gamut P3 color
│   ├── share/              # Web Share API
│   ├── camera/             # getUserMedia
│   ├── pwa/                # Add to Home Screen guide
│   └── modern-css/         # :has(), container queries, dvh
├── assets/
│   ├── css/styles.css      # Shared design system
│   ├── js/main.js          # Shared nav + view transitions
│   ├── js/demos/           # Per-demo scripts
│   ├── icons/              # PWA icons
│   └── favicon.svg
├── manifest.webmanifest    # PWA manifest
├── _headers                # Cloudflare Pages response headers
└── README.md
```

Each demo page is fully self-contained: link in the global stylesheet, link in its own script, and use shared layout primitives. There is no build step.

---

## Running locally

Any static file server works. From the repo root:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or with Node:

```sh
npx serve .
```

**Caveat**: some Safari features (camera, microphone, DeviceMotion permission prompts, Web Share, installable PWA) only work over **HTTPS** or on `localhost`. If you test from another device on your LAN, use a tunnel (`cloudflared tunnel`, `ngrok`) so the origin is HTTPS — otherwise those demos will be disabled.

To experience the site as intended:

1. Open it on an iPad running a recent iPadOS in Safari.
2. Tap the Share icon → **Add to Home Screen** to test PWA install.
3. Pair an Apple Pencil for the pencil demo.

---

## Deploying to Cloudflare Pages

This repo is a static site with **no build step**.

**Cloudflare Pages config:**

| Field | Value |
| --- | --- |
| Framework preset | None |
| Build command | *(leave blank)* |
| Build output directory | `/` |
| Root directory | `/` |
| Environment variables | *(none)* |

Connect the GitHub repo, accept the defaults, and every push to `main` will deploy. Preview deployments are created automatically for every PR.

Custom response headers (CSP, permissions policy, caching) live in [`_headers`](./_headers) and are picked up automatically by Cloudflare Pages.

---

## Browser support

The site is built **Safari-first** — specifically for the iPadOS Safari shipping at the time of writing. It will still render on Chrome, Firefox, and desktop Safari, but a handful of demos depend on iPadOS-only behavior (e.g. Apple Pencil pressure/tilt, DeviceMotion permission prompts, Add to Home Screen as the PWA install gesture). When an API isn't available, the demo page detects it and shows a friendly fallback explaining what would happen on iPad.

---

## Contributing

See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the roadmap and demo backlog. To add a new demo:

1. Create `demos/<slug>/index.html` following the structure of an existing demo page.
2. Put any demo-specific script in `assets/js/demos/<slug>.js`.
3. Add an entry to the catalog grid in `demos/index.html` and the feature grid in `index.html`.
4. List the new demo in `IMPLEMENTATION_PLAN.md`.

There is no lint or test step; just push.
