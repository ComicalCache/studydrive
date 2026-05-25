// Runs in ISOLATED world — handles UI button and communicates with background
(function () {
  if (document.querySelector('.sd-pdf-download-btn')) return;

  const scriptContent = Array.from(document.querySelectorAll('script'))
    .map(s => s.textContent)
    .join('');

  const previewMatch = /"file_preview":"([^"]+)"/.exec(scriptContent);
  if (!previewMatch) {
    console.log('[SD] No file_preview found — not a doc page');
    return;
  }

  let fileName = 'document.pdf';
  const nameMatch = /"filename":"([^"]+)"/.exec(scriptContent);
  if (nameMatch) {
    fileName = nameMatch[1].replace(/\\\//g, '/');
    if (!fileName.endsWith('.pdf')) {
      fileName = fileName.replace(/\.[^.]+$/, '') + '.pdf';
    }
  }
  console.log('[SD] fileName:', fileName);

  const btn = document.createElement('button');
  btn.className = 'sd-pdf-download-btn';
  btn.textContent = '⬇ Download PDF';
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

  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });

  btn.addEventListener('click', () => {
    btn.textContent = '⏳ Exporting...';
    btn.disabled = true;
    console.log('[SD] Requesting PDF export from PSPDFKit');

    const handler = (e) => {
      window.removeEventListener('sd-export-result', handler);
      const detail = JSON.parse(e.detail);
      console.log('[SD] Export result:', detail.error || (detail.size + ' bytes'));

      if (detail.error) {
        btn.textContent = '✗ ' + detail.error;
        setTimeout(() => { btn.textContent = '⬇ Download PDF'; btn.disabled = false; }, 3000);
        return;
      }

      chrome.runtime.sendMessage(
        { action: 'download', base64: detail.base64, filename: fileName },
        (resp) => {
          console.log('[SD] Background response:', resp);
          if (resp && resp.success) {
            btn.textContent = '✓ Downloaded';
          } else {
            btn.textContent = '✗ Failed';
          }
          setTimeout(() => { btn.textContent = '⬇ Download PDF'; btn.disabled = false; }, 2500);
        }
      );
    };
    window.addEventListener('sd-export-result', handler);
    window.dispatchEvent(new CustomEvent('sd-export-pdf'));
  });

  document.body.appendChild(btn);
})();
