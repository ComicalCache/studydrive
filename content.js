(function () {
  if (document.querySelector(".sd-pdf-download-btn")) return;

  const scriptContent = Array.from(document.querySelectorAll("script"))
    .map((s) => s.textContent)
    .join("");

  const previewMatch = /"file_preview":"([^"]+)"/.exec(scriptContent);
  if (!previewMatch) {
    return;
  }

  let fileName = "document.pdf";
  const nameMatch = /"filename":"((?:[^"\\]|\\.)*)"/.exec(scriptContent);
  if (nameMatch) {
    // The match is still JSON-escaped source text (e.g. "Buchführung" contains
    // a literal backslash, not "ü") — decode it as a JSON string so accented/special
    // characters come through correctly instead of leaving stray backslashes that
    // chrome.downloads.download() rejects with "Invalid filename".
    try {
      fileName = JSON.parse('"' + nameMatch[1] + '"');
    } catch (e) {
      fileName = nameMatch[1].replace(/\\\//g, "/");
    }

    if (!fileName.endsWith(".pdf")) {
      fileName = fileName.replace(/\.[^.]+$/, "") + ".pdf";
    }
  }

  const btn = document.createElement("button");
  btn.className = "sd-pdf-download-btn";
  btn.textContent = "⬇ Download PDF";
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: transform 0.15s, background 0.15s;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "scale(1.05)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "scale(1)";
  });

  const CHUNK_SIZE = 20 * 1024 * 1024;

  async function sendInChunks(base64, filename) {
    const downloadId = `sd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.max(1, Math.ceil(base64.length / CHUNK_SIZE));

    let result;
    for (let idx = 0; idx < totalChunks; idx++) {
      const chunk = base64.slice(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
      result = await chrome.runtime.sendMessage({
        action: "download-chunk",
        downloadId,
        chunkIndex: idx,
        totalChunks,
        chunk,
        filename,
      });
    }

    return result;
  }

  btn.addEventListener("click", () => {
    btn.textContent = "⏳ Exporting...";
    btn.disabled = true;

    const handler = async (e) => {
      window.removeEventListener("sd-export-result", handler);
      const detail = JSON.parse(e.detail);

      if (detail.error) {
        btn.textContent = "✗ " + detail.error;

        setTimeout(() => {
          btn.textContent = "⬇ Download PDF";
          btn.disabled = false;
        }, 3000);

        return;
      }

      try {
        const resp = await sendInChunks(detail.base64, fileName);
        btn.textContent = resp && resp.success ? "✓ Downloaded" : "✗ " + (resp?.error || "Failed");
      } catch (err) {
        btn.textContent = "✗ Failed";
      }

      setTimeout(() => {
        btn.textContent = "⬇ Download PDF";
        btn.disabled = false;
      }, 2500);
    };

    window.addEventListener("sd-export-result", handler);
    window.dispatchEvent(new CustomEvent("sd-export-pdf"));
  });

  document.body.appendChild(btn);
})();
