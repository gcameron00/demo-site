// Speech synthesis demo.

(function () {
  "use strict";

  const status = document.getElementById("status");
  const txt    = document.getElementById("text");
  const sel    = document.getElementById("voice");
  const rate   = document.getElementById("rate");
  const pitch  = document.getElementById("pitch");
  const rateV  = document.getElementById("rate-v");
  const pitchV = document.getElementById("pitch-v");
  const speak  = document.getElementById("speak");
  const stop   = document.getElementById("stop");

  if (!("speechSynthesis" in window)) {
    window.iPadOS?.setStatus(status, "err", "Speech synthesis not supported");
    speak.disabled = true; stop.disabled = true;
    return;
  }

  let voices = [];
  function loadVoices() {
    voices = speechSynthesis.getVoices();
    sel.innerHTML = "";
    if (voices.length === 0) {
      sel.innerHTML = "<option>No voices found yet</option>";
      return;
    }
    voices.sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
    for (const v of voices) {
      const opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} — ${v.lang}${v.default ? " (default)" : ""}`;
      sel.appendChild(opt);
    }
    window.iPadOS?.setStatus(status, "ok", `${voices.length} voices ready`);
  }
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;

  rate.addEventListener("input",  () => { rateV.textContent  = (+rate.value).toFixed(2); });
  pitch.addEventListener("input", () => { pitchV.textContent = (+pitch.value).toFixed(2); });

  speak.addEventListener("click", () => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt.value);
    const chosen = voices.find((v) => v.voiceURI === sel.value);
    if (chosen) u.voice = chosen;
    u.rate  = parseFloat(rate.value);
    u.pitch = parseFloat(pitch.value);
    u.onstart = () => window.iPadOS?.setStatus(status, "ok", "Speaking…");
    u.onend   = () => window.iPadOS?.setStatus(status, "ok", "Done");
    u.onerror = (e) => window.iPadOS?.setStatus(status, "err", "Error: " + e.error);
    speechSynthesis.speak(u);
  });

  stop.addEventListener("click", () => {
    speechSynthesis.cancel();
    window.iPadOS?.setStatus(status, "ok", "Stopped");
  });
})();
