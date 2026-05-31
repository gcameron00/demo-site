# Implementation Plan

This document is the working roadmap for building out the iPadOS Safari showcase site. It covers the high-level phases, the per-demo backlog with current status, and the non-functional concerns (performance, accessibility, deployment) that apply across the whole site.

---

## Phase 1 — Foundations

Scope: the things every page depends on.

- [x] Project docs (`README.md`, this file)
- [x] Site information architecture (home / about / demos catalog / per-demo pages)
- [x] Shared design system in `assets/css/styles.css`
  - Light + dark via `color-scheme` and `prefers-color-scheme`
  - System font stack (SF on iPadOS), fluid type
  - Safe-area-aware layout (`env(safe-area-inset-*)`)
  - Glass surface, button, card, and grid primitives
- [x] Shared shell JS in `assets/js/main.js`
  - Cross-document **View Transitions** for page navigation
  - Capability detection helper used by demos
  - Theme toggle hook
- [x] Home page with feature grid
- [x] About page describing the project's intent
- [x] Demos catalog page

## Phase 2 — PWA & platform

Scope: making the site installable and feel native on iPad.

- [x] `manifest.webmanifest` with `display: standalone`, theme & background color
- [x] Apple-specific meta tags (`apple-mobile-web-app-capable`, status bar style)
- [x] App icons (SVG mask icon + raster apple-touch-icon)
- [x] `_headers` for security (CSP, Referrer-Policy, Permissions-Policy) and caching
- [x] PWA demo page with Add-to-Home-Screen walkthrough and live install detection

## Phase 3 — Demos

Built in roughly the order below. Each is one self-contained page under `demos/<slug>/`.

| # | Slug | Demo | Surfaces |
| - | ---- | ---- | -------- |
| 1 | `pencil` | Apple Pencil & multi-touch drawing | Pointer Events: pressure, tiltX/Y, pointerType, coalesced events |
| 2 | `glass` | Glassmorphism UI panels | `backdrop-filter`, `color-mix()`, mesh gradients |
| 3 | `scroll` | Scroll-driven animations | `animation-timeline: scroll() / view()`, scroll snap |
| 4 | `motion` | Tilt the iPad | `DeviceOrientationEvent` (with iOS permission prompt) |
| 5 | `webgl` | Interactive 3D scene | WebGL2, pointer-driven camera |
| 6 | `audio` | Touch-playable synth | Web Audio API, AudioContext resume gesture |
| 7 | `speech` | Read this page aloud | `SpeechSynthesis`, voice picker |
| 8 | `color` | Wide-gamut P3 swatches | `color(display-p3 …)`, `color-mix()`, `@media (color-gamut: p3)` |
| 9 | `share` | Share this page | `navigator.share()` with files & URL |
| 10 | `camera` | Live camera preview | `getUserMedia`, capture still frame |
| 11 | `modern-css` | `:has()`, container queries, `dvh` | New CSS selectors and units |
| 12 | `pwa` | Add to Home Screen | `display-mode: standalone`, install state |

All twelve demos in the table above are implemented in this first pass. Each one:

- Detects whether the API is available before doing anything.
- Renders a friendly fallback when it isn't (e.g. on desktop Chrome).
- Asks for permission only on a user gesture (motion, camera, audio context).
- Reuses the global design system instead of one-off styling.

## Phase 4 — Polish

These are nice-to-haves that are not yet in scope but are tracked here so they don't get lost:

- [ ] Service Worker for offline support (currently the manifest declares the PWA but there is no SW yet)
- [ ] Cross-document View Transitions with named transitions per card → demo page
- [ ] Long-press / context menu demos via `oncontextmenu` and the Web Share Target
- [ ] Stage Manager / multi-window scenarios
- [ ] WebXR / AR Quick Look (`.usdz` model embed)
- [ ] Analytics-free visit counter using Cloudflare Workers KV
- [ ] Automated Lighthouse + WebPageTest run on every PR

## Phase 5 — Deploy

- [x] Document Cloudflare Pages deployment in `README.md`
- [x] `_headers` for response headers
- [ ] First production deploy from `main`
- [ ] Custom domain (optional, deferred)

---

## Non-functional requirements

**Performance.** No build step, no framework, no JS bundler. Every page should be under a few KB of HTML and pull at most one shared CSS file and one demo-specific JS file. No third-party scripts.

**Accessibility.** Every interactive demo has an accessible name and a keyboard fallback where possible. Color contrast meets WCAG AA in both color schemes. The site does not rely on motion — `prefers-reduced-motion` disables the heavier animations.

**Privacy.** No analytics, no cookies, no tracking. The camera and microphone demos do not record or transmit anything; everything stays in the page.

**Security.** The `_headers` file sets a strict-ish CSP (`script-src 'self'`), `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` that opts the page in to only the features we actually use.

---

## Out of scope

These were considered and intentionally left out of the first pass:

- A blog or CMS — the site is a single living showcase, not a publication.
- React / Vue / Svelte / any framework — the whole point is to show what the platform can do unaided.
- Backend services — Cloudflare Pages serves static files only.
- Login or any account state.
