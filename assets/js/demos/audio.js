// Web Audio synth.
//
// One AudioContext, one master gain. Each keypress spawns:
//   oscillator -> lowpass -> envelope gain -> master
// Envelope is a four-segment AHDSR-ish ramp using setValueAtTime/linearRampToValueAtTime.

(function () {
  "use strict";

  const kb     = document.getElementById("kb");
  const status = document.getElementById("status");
  const waveSel = document.getElementById("wave");
  const cutoff  = document.getElementById("cutoff");

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    window.iPadOS?.setStatus(status, "err", "Web Audio not supported");
    return;
  }

  // Build the keyboard.
  const naturals = [
    { note: "C4",  midi: 60, label: "C" },
    { note: "D4",  midi: 62, label: "D" },
    { note: "E4",  midi: 64, label: "E" },
    { note: "F4",  midi: 65, label: "F" },
    { note: "G4",  midi: 67, label: "G" },
    { note: "A4",  midi: 69, label: "A" },
    { note: "B4",  midi: 71, label: "B" },
    { note: "C5",  midi: 72, label: "C" },
  ];
  // Black keys are positioned by % of keyboard width.
  // 8 white keys -> each is 12.5% wide. Black keys sit on the boundaries
  // between certain whites: C#-Eb between 0-1 & 1-2; F#-G#-Bb between 3-4, 4-5, 5-6.
  const accidentals = [
    { note: "C#4", midi: 61, label: "C♯", leftPct: 12.5 - 3 },
    { note: "D#4", midi: 63, label: "D♯", leftPct: 25.0 - 3 },
    { note: "F#4", midi: 66, label: "F♯", leftPct: 50.0 - 3 },
    { note: "G#4", midi: 68, label: "G♯", leftPct: 62.5 - 3 },
    { note: "A#4", midi: 70, label: "A♯", leftPct: 75.0 - 3 },
  ];

  for (const k of naturals) {
    const el = document.createElement("div");
    el.className = "key white";
    el.dataset.midi = String(k.midi);
    el.innerHTML = `<span class="label">${k.label}</span>`;
    kb.appendChild(el);
  }
  for (const k of accidentals) {
    const el = document.createElement("div");
    el.className = "key black";
    el.dataset.midi = String(k.midi);
    el.style.left = `${k.leftPct}%`;
    el.innerHTML = `<span class="label">${k.label}</span>`;
    kb.appendChild(el);
  }

  // ----- audio graph -----
  let ctx = null;
  let master = null;
  const active = new Map(); // pointerId -> { osc, gain, el }

  function ensureAudio() {
    if (ctx) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
    window.iPadOS?.setStatus(status, "ok", "Audio context running");
  }

  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function noteOn(midi, el, pid) {
    ensureAudio();
    if (ctx.state === "suspended") ctx.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = waveSel.value;
    osc.frequency.value = midiToHz(midi);

    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = parseInt(cutoff.value, 10);
    filt.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.01);  // attack
    gain.gain.linearRampToValueAtTime(0.6, t + 0.12);  // decay -> sustain

    osc.connect(filt).connect(gain).connect(master);
    osc.start(t);

    el.classList.add("is-down");
    active.set(pid, { osc, gain, el, midi });
  }

  function noteOff(pid) {
    const entry = active.get(pid);
    if (!entry) return;
    active.delete(pid);
    const { osc, gain, el } = entry;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2); // release
    osc.stop(t + 0.22);
    el.classList.remove("is-down");
  }

  // ----- pointer wiring -----
  kb.addEventListener("pointerdown", (ev) => {
    const el = ev.target.closest(".key");
    if (!el) return;
    ev.preventDefault();
    kb.setPointerCapture(ev.pointerId);
    noteOn(parseInt(el.dataset.midi, 10), el, ev.pointerId);
  });
  kb.addEventListener("pointermove", (ev) => {
    // Slide-to-glissando: if we're already playing a note and the pointer
    // moves onto a different key, retrigger.
    if (!active.has(ev.pointerId)) return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const keyEl = el && el.closest && el.closest(".key");
    if (!keyEl) return;
    const midi = parseInt(keyEl.dataset.midi, 10);
    const cur = active.get(ev.pointerId);
    if (cur.midi === midi) return;
    noteOff(ev.pointerId);
    noteOn(midi, keyEl, ev.pointerId);
  });
  function endNote(ev) { noteOff(ev.pointerId); }
  kb.addEventListener("pointerup", endNote);
  kb.addEventListener("pointercancel", endNote);
  kb.addEventListener("pointerleave", endNote);

  // The cutoff slider applies to subsequent key presses; we don't try to
  // glide the filter on currently-sounding notes.
})();
