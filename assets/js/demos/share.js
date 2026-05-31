// Web Share API demo.

(function () {
  "use strict";

  const status   = document.getElementById("status");
  const btnUrl   = document.getElementById("share-url");
  const btnText  = document.getElementById("share-text");
  const btnFile  = document.getElementById("share-file");

  if (!("share" in navigator)) {
    window.iPadOS?.setStatus(status, "err", "navigator.share not supported");
    [btnUrl, btnText, btnFile].forEach((b) => (b.disabled = true));
    return;
  }
  window.iPadOS?.setStatus(status, "ok", "Web Share available");

  btnUrl.addEventListener("click", async () => {
    try {
      await navigator.share({
        title: "iPadOS Safari Showcase",
        text: "A demo of every modern web feature in Safari on iPadOS.",
        url: location.origin + "/",
      });
      window.iPadOS?.setStatus(status, "ok", "Shared");
    } catch (e) {
      if (e.name !== "AbortError") {
        window.iPadOS?.setStatus(status, "err", e.message);
      }
    }
  });

  btnText.addEventListener("click", async () => {
    try {
      await navigator.share({
        text: "Look what Safari on iPad can do: " + location.href,
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        window.iPadOS?.setStatus(status, "err", e.message);
      }
    }
  });

  btnFile.addEventListener("click", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 600, 400);
    g.addColorStop(0, "#2563eb");
    g.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = "white";
    ctx.font = "600 36px -apple-system, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("iPadOS Showcase", 40, 200);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], "ipados-showcase.png", { type: "image/png" });
      if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
        window.iPadOS?.setStatus(status, "warn", "This system can't share files");
        return;
      }
      try {
        await navigator.share({
          files: [file],
          title: "Made on iPad",
          text: "A PNG generated in the browser.",
        });
      } catch (e) {
        if (e.name !== "AbortError") {
          window.iPadOS?.setStatus(status, "err", e.message);
        }
      }
    }, "image/png");
  });
})();
