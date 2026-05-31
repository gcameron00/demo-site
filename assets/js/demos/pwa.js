// PWA install-state detector.

(function () {
  "use strict";

  const state  = document.getElementById("state");
  const label  = document.getElementById("state-label");
  const desc   = document.getElementById("state-desc");

  function refresh() {
    const standalone =
      matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) {
      state.classList.add("is-installed");
      label.textContent = "Standalone mode — you did it.";
      desc.textContent = "This window has no Safari chrome around it.";
    } else {
      state.classList.remove("is-installed");
      label.textContent = "In Safari tab";
      desc.textContent =
        "Follow the steps below to install. This panel updates when you come back.";
    }
  }
  refresh();

  // Listen for the display-mode flipping.
  matchMedia("(display-mode: standalone)").addEventListener?.("change", refresh);
  window.addEventListener("visibilitychange", refresh);
})();
