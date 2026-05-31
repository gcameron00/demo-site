// Shared shell script — runs on every page.
//
// Responsibilities:
//   1. Mark the current nav link with aria-current.
//   2. Expose a tiny capability-detection helper on `window.iPadOS`
//      that individual demo pages can use to short-circuit when an
//      API isn't available.
//   3. Surface install state for the PWA demo via the
//      `display-mode: standalone` media query.
//
// Intentionally no framework, no bundler, no dependencies.

(function () {
  "use strict";

  // ---- Active nav link ------------------------------------------------
  const here = location.pathname.replace(/\/index\.html$/, "/");
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    const target = href.replace(/\/index\.html$/, "/");
    if (target === here || (target !== "/" && here.startsWith(target))) {
      a.setAttribute("aria-current", "page");
    }
  });

  // ---- Capability detection ------------------------------------------
  const caps = {
    pointerEvents: "PointerEvent" in window,
    pencilPressure: "PointerEvent" in window, // refined at first event
    backdropFilter:
      CSS.supports("backdrop-filter", "blur(10px)") ||
      CSS.supports("-webkit-backdrop-filter", "blur(10px)"),
    scrollTimeline: CSS.supports("animation-timeline", "scroll()"),
    containerQueries: CSS.supports("container-type", "inline-size"),
    has: (() => {
      try {
        return document.querySelector(":has(*)") !== undefined;
      } catch (_) {
        return false;
      }
    })(),
    p3: matchMedia("(color-gamut: p3)").matches,
    deviceMotion: typeof DeviceMotionEvent !== "undefined",
    requiresMotionPermission:
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function",
    webShare: "share" in navigator,
    webShareFiles: "canShare" in navigator,
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    speechSynthesis: "speechSynthesis" in window,
    webAudio: "AudioContext" in window || "webkitAudioContext" in window,
    webGL: (() => {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch (_) {
        return false;
      }
    })(),
    viewTransitions: "startViewTransition" in document,
    standalone:
      matchMedia("(display-mode: standalone)").matches ||
      // Safari-specific
      window.navigator.standalone === true,
    isIPad: /iPad|Macintosh/.test(navigator.userAgent) && "ontouchend" in document,
  };

  // ---- Tiny helpers --------------------------------------------------
  function setStatus(el, state, message) {
    if (!el) return;
    el.classList.remove("is-ok", "is-warn", "is-err");
    if (state) el.classList.add("is-" + state);
    if (message != null) el.textContent = message;
  }

  function showFallback(container, message) {
    if (!container) return;
    const div = document.createElement("div");
    div.className = "fallback";
    div.textContent = message;
    container.appendChild(div);
  }

  window.iPadOS = { caps, setStatus, showFallback };
})();
