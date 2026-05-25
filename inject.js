// Runs in MAIN world at document_start
// Intercepts fetch/XHR to capture PDF data as PSPDFKit loads it
(function () {
  let capturedPdfBuffer = null;

  // Intercept fetch
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);
    try {
      const url = (typeof args[0] === 'string') ? args[0] : args[0]?.url || '';
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/pdf') || ct.includes('application/octet-stream') || url.includes('file-preview')) {
        const clone = response.clone();
        const buffer = await clone.arrayBuffer();
        if (buffer.byteLength > 0) {
          console.log('[SD inject] Captured PDF via fetch:', buffer.byteLength, 'bytes, url:', url.substring(0, 80));
          capturedPdfBuffer = buffer;
        }
      }
    } catch (e) {
      // Don't break page if our interception fails
    }
    return response;
  };

  // Intercept XHR
  const origXHROpen = XMLHttpRequest.prototype.open;
  const origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._sd_url = url;
    return origXHROpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        const ct = this.getResponseHeader('content-type') || '';
        if ((ct.includes('application/pdf') || ct.includes('application/octet-stream') || (this._sd_url && this._sd_url.includes('file-preview'))) && this.response) {
          let buffer;
          if (this.response instanceof ArrayBuffer) {
            buffer = this.response;
          } else if (this.response instanceof Blob) {
            // Handle blob asynchronously
            this.response.arrayBuffer().then(buf => {
              if (buf.byteLength > 0) {
                console.log('[SD inject] Captured PDF via XHR blob:', buf.byteLength, 'bytes');
                capturedPdfBuffer = buf;
              }
            });
            return;
          }
          if (buffer && buffer.byteLength > 0) {
            console.log('[SD inject] Captured PDF via XHR:', buffer.byteLength, 'bytes');
            capturedPdfBuffer = buffer;
          }
        }
      } catch (e) {}
    });
    return origXHRSend.apply(this, args);
  };

  console.log('[SD inject] Fetch/XHR interceptors installed');

  // Listen for export request from content script
  window.addEventListener('sd-export-pdf', () => {
    console.log('[SD inject] Export requested, have buffer:', !!capturedPdfBuffer, 'size:', capturedPdfBuffer?.byteLength);

    if (!capturedPdfBuffer) {
      window.dispatchEvent(new CustomEvent('sd-export-result', {
        detail: JSON.stringify({ error: 'No PDF captured yet. Wait for document to fully load.' })
      }));
      return;
    }

    const bytes = new Uint8Array(capturedPdfBuffer);
    const chunks = [];
    const chunkSize = 65536;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(String.fromCharCode(...bytes.slice(i, i + chunkSize)));
    }
    const base64 = btoa(chunks.join(''));
    window.dispatchEvent(new CustomEvent('sd-export-result', {
      detail: JSON.stringify({ base64, size: capturedPdfBuffer.byteLength })
    }));
  });
})();
