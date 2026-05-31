// Pencil / Pointer Events demo.
//
// Single canvas, one set of pointer handlers. We use getCoalescedEvents()
// so that on Pencil we draw every sample WebKit captured between paints,
// not just the one paint-aligned event.

(function () {
  "use strict";

  const pad      = document.getElementById("pad");
  const canvas   = document.getElementById("canvas");
  const status   = document.getElementById("status");
  const tType    = document.getElementById("t-type");
  const tPress   = document.getElementById("t-pressure");
  const tTilt    = document.getElementById("t-tilt");
  const tAz      = document.getElementById("t-azimuth");
  const tCoal    = document.getElementById("t-coalesced");
  const clearBtn = document.getElementById("clear");
  const dlBtn    = document.getElementById("download");

  if (!("PointerEvent" in window)) {
    window.iPadOS?.setStatus(status, "err", "Pointer Events not supported");
    window.iPadOS?.showFallback(
      pad.parentElement,
      "This browser doesn't support Pointer Events, so this demo can't run here."
    );
    return;
  }

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const strokes = new Map(); // pointerId -> last {x, y}

  function fit() {
    const r = pad.getBoundingClientRect();
    const w = Math.floor(r.width  * dpr);
    const h = Math.floor(r.height * dpr);
    if (canvas.width === w && canvas.height === h) return;
    // Preserve existing pixels on resize by stashing into a bitmap.
    const stash = canvas.width ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
    canvas.width = w; canvas.height = h;
    if (stash) ctx.putImageData(stash, 0, 0);
  }

  const resizeObs = new ResizeObserver(fit);
  resizeObs.observe(pad);
  fit();

  function colorFor(ev) {
    switch (ev.pointerType) {
      case "pen":   return "#2563eb";
      case "touch": return "#8b5cf6";
      case "mouse": return "#06b6d4";
      default:      return "#94a3b8";
    }
  }

  function widthFor(ev) {
    // Pressure is 0..1. Fingers default to 0.5 with no sensor, Pencil reports real values.
    const p = ev.pressure || 0.5;
    return Math.max(0.6, p * 12) * dpr;
  }

  function localPoint(ev) {
    const r = canvas.getBoundingClientRect();
    return [(ev.clientX - r.left) * dpr, (ev.clientY - r.top) * dpr];
  }

  function tiltToAltAz(tx, ty) {
    // Convert tiltX/Y (degrees) to altitude/azimuth in degrees.
    // Spec ref: PointerEvent altitudeAngle/azimuthAngle.
    const rx = (tx * Math.PI) / 180;
    const ry = (ty * Math.PI) / 180;
    if (tx === 0 && ty === 0) {
      return { altitude: 90, azimuth: 0 };
    }
    const z = Math.cos(rx) * Math.cos(ry);
    const altitude = Math.atan2(z, Math.hypot(Math.sin(rx), Math.sin(ry))) * 180 / Math.PI;
    const azimuth = (Math.atan2(Math.sin(ry), Math.sin(rx)) * 180 / Math.PI + 360) % 360;
    return { altitude, azimuth };
  }

  function updateTelemetry(ev, coalescedCount) {
    tType.textContent = ev.pointerType || "—";
    tPress.textContent = (ev.pressure ?? 0).toFixed(3);
    tTilt.textContent = `${(ev.tiltX|0)}° / ${(ev.tiltY|0)}°`;
    const { altitude, azimuth } = tiltToAltAz(ev.tiltX || 0, ev.tiltY || 0);
    tAz.textContent = `${altitude.toFixed(0)}° / ${azimuth.toFixed(0)}°`;
    tCoal.textContent = String(coalescedCount);
  }

  function drawSegment(x1, y1, x2, y2, ev) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = colorFor(ev);
    ctx.lineWidth = widthFor(ev);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  pad.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    pad.setPointerCapture(ev.pointerId);
    pad.classList.add("dirty");
    const [x, y] = localPoint(ev);
    strokes.set(ev.pointerId, [x, y]);
    drawSegment(x, y, x + 0.01, y + 0.01, ev); // initial dot
    updateTelemetry(ev, 1);
    window.iPadOS?.setStatus(status, "ok", `Drawing with ${ev.pointerType}`);
  });

  pad.addEventListener("pointermove", (ev) => {
    if (!strokes.has(ev.pointerId)) return;
    ev.preventDefault();
    const events = (typeof ev.getCoalescedEvents === "function")
      ? ev.getCoalescedEvents()
      : [ev];
    let [px, py] = strokes.get(ev.pointerId);
    for (const e of events) {
      const [nx, ny] = localPoint(e);
      drawSegment(px, py, nx, ny, e);
      px = nx; py = ny;
    }
    strokes.set(ev.pointerId, [px, py]);
    updateTelemetry(ev, events.length);
  });

  function endStroke(ev) {
    if (!strokes.has(ev.pointerId)) return;
    strokes.delete(ev.pointerId);
    if (strokes.size === 0) {
      window.iPadOS?.setStatus(status, "ok", "Idle");
    }
  }

  pad.addEventListener("pointerup", endStroke);
  pad.addEventListener("pointercancel", endStroke);
  pad.addEventListener("pointerleave", endStroke);

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pad.classList.remove("dirty");
  });

  dlBtn.addEventListener("click", () => {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "ipad-showcase-doodle.png";
    a.click();
  });
})();
