(function () {
  let capturedPdfBuffer = null;

  function pdf_magic(buffer) {
    if (!buffer || buffer.byteLength < 5) {
      return false;
    }

    const head = new Uint8Array(buffer, 0, 5);

    return (
      head[0] === 0x25 &&
      head[1] === 0x50 &&
      head[2] === 0x44 &&
      head[3] === 0x46 &&
      head[4] === 0x2d
    );
  }

  // Intercept fetch.
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);

    try {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      const ct = response.headers.get("content-type") || "";

      if (
        ct.includes("application/pdf") ||
        ct.includes("application/octet-stream") ||
        url.includes("file-preview")
      ) {
        const buffer = await response.clone().arrayBuffer();
        if (pdf_magic(buffer)) {
          capturedPdfBuffer = buffer;
        }
      }
    } catch (e) {}

    return response;
  };

  // Intercept XHR.
  const origXHROpen = XMLHttpRequest.prototype.open;
  const origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._sd_url = url;

    return origXHROpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      try {
        const ct = this.getResponseHeader("content-type") || "";

        if (
          (ct.includes("application/pdf") ||
            ct.includes("application/octet-stream") ||
            (this._sd_url && this._sd_url.includes("file-preview"))) &&
          this.response
        ) {
          let buffer;

          if (this.response instanceof ArrayBuffer) {
            buffer = this.response;
          } else if (this.response instanceof Blob) {
            this.response.arrayBuffer().then((buf) => {
              if (pdf_magic(buf)) {
                capturedPdfBuffer = buf;
              }
            });

            return;
          }

          if (pdf_magic(buffer)) {
            capturedPdfBuffer = buffer;
          }
        }
      } catch (e) {}
    });

    return origXHRSend.apply(this, args);
  };

  window.addEventListener("sd-export-pdf", () => {
    if (!capturedPdfBuffer) {
      window.dispatchEvent(
        new CustomEvent("sd-export-result", {
          detail: JSON.stringify({ error: "Wait for document to fully load" }),
        }),
      );

      return;
    }

    const bytes = new Uint8Array(capturedPdfBuffer);

    const chunks = [];
    const chunkSize = 65536;
    for (let idx = 0; idx < bytes.length; idx += chunkSize) {
      chunks.push(String.fromCharCode(...bytes.slice(idx, idx + chunkSize)));
    }

    const base64 = btoa(chunks.join(""));
    window.dispatchEvent(
      new CustomEvent("sd-export-result", {
        detail: JSON.stringify({ base64, size: capturedPdfBuffer.byteLength }),
      }),
    );
  });
})();
