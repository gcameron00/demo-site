// Camera (getUserMedia) demo.

(function () {
  "use strict";

  const stage  = document.getElementById("stage");
  const video  = document.getElementById("video");
  const snap   = document.getElementById("snapshot");
  const status = document.getElementById("status");
  const start  = document.getElementById("start");
  const swap   = document.getElementById("switch");
  const snapB  = document.getElementById("snap");
  const live   = document.getElementById("resume");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    window.iPadOS?.setStatus(status, "err", "getUserMedia not available");
    start.disabled = true;
    window.iPadOS?.showFallback(
      stage.parentElement,
      "Your browser doesn't expose mediaDevices.getUserMedia — open this page over HTTPS on iPad to try it."
    );
    return;
  }

  let stream = null;
  let facing = "user";

  async function startStream() {
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      video.srcObject = stream;
      start.disabled = true;
      swap.disabled = false;
      snapB.disabled = false;
      window.iPadOS?.setStatus(status, "ok", `Streaming (${facing})`);
    } catch (e) {
      window.iPadOS?.setStatus(status, "err", e.name + ": " + e.message);
    }
  }

  start.addEventListener("click", startStream);
  swap.addEventListener("click", () => {
    facing = facing === "user" ? "environment" : "user";
    startStream();
  });

  snapB.addEventListener("click", () => {
    if (!video.videoWidth) return;
    snap.width  = video.videoWidth;
    snap.height = video.videoHeight;
    snap.getContext("2d").drawImage(video, 0, 0);
    stage.classList.add("frozen");
    live.disabled = false;
  });

  live.addEventListener("click", () => {
    stage.classList.remove("frozen");
    live.disabled = true;
  });

  // Be a good citizen: stop the stream when the page is hidden / unloaded.
  function stop() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  window.addEventListener("pagehide", stop);
})();
