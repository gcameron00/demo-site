// DeviceOrientation demo.
//
// On iOS / iPadOS, we MUST call DeviceOrientationEvent.requestPermission()
// from a user gesture before any motion events are delivered.

(function () {
  "use strict";

  const status = document.getElementById("status");
  const start  = document.getElementById("start");
  const tA = document.getElementById("t-alpha");
  const tB = document.getElementById("t-beta");
  const tG = document.getElementById("t-gamma");
  const outer  = document.getElementById("ring-outer");
  const middle = document.getElementById("ring-middle");
  const inner  = document.getElementById("ring-inner");

  if (typeof DeviceOrientationEvent === "undefined") {
    window.iPadOS?.setStatus(status, "err", "DeviceOrientation not supported");
    start.disabled = true;
    window.iPadOS?.showFallback(
      start.parentElement.parentElement,
      "This browser has no DeviceOrientationEvent. On iPad, you'd be tilting a 3-axis gimbal here."
    );
    return;
  }

  let listening = false;

  function attach() {
    if (listening) return;
    listening = true;
    start.disabled = true;
    window.iPadOS?.setStatus(status, "ok", "Listening — tilt your device");
    window.addEventListener("deviceorientation", onOrient, true);
  }

  function onOrient(ev) {
    const a = ev.alpha || 0;  // z axis: 0–360
    const b = ev.beta  || 0;  // x axis: -180–180
    const g = ev.gamma || 0;  // y axis: -90–90
    tA.textContent = a.toFixed(0) + "°";
    tB.textContent = b.toFixed(0) + "°";
    tG.textContent = g.toFixed(0) + "°";

    outer.style.transform  = `rotateZ(${a}deg)`;
    middle.style.transform = `rotateX(${b}deg)`;
    inner.style.transform  = `rotateY(${g}deg)`;
  }

  start.addEventListener("click", async () => {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS / iPadOS prompt.
        const r = await DeviceOrientationEvent.requestPermission();
        if (r === "granted") attach();
        else window.iPadOS?.setStatus(status, "err", "Permission denied");
      } else {
        // Non-iOS: just attach.
        attach();
      }
    } catch (err) {
      window.iPadOS?.setStatus(status, "err", "Permission error: " + err.message);
    }
  });
})();
