const pending = new Map(); // downloadId -> { chunks, received, filename }

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'download-chunk') return;

  let entry = pending.get(msg.downloadId);
  if (!entry) {
    entry = { chunks: new Array(msg.totalChunks), received: 0, filename: msg.filename };
    pending.set(msg.downloadId, entry);
  }
  entry.chunks[msg.chunkIndex] = msg.chunk;
  entry.received++;

  if (entry.received < msg.totalChunks) {
    sendResponse({ ack: true });
    return;
  }

  pending.delete(msg.downloadId);
  const base64 = entry.chunks.join('');
  const dataUrl = 'data:application/pdf;base64,' + base64;
  console.log('[SD bg] Download request, base64 length:', base64.length, 'filename:', entry.filename);

  chrome.downloads.download({
    url: dataUrl,
    filename: entry.filename,
    conflictAction: 'uniquify'
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('[SD bg] Download error:', chrome.runtime.lastError.message);
      sendResponse({ error: chrome.runtime.lastError.message });
    } else {
      console.log('[SD bg] Download started, id:', downloadId);
      sendResponse({ success: true, downloadId });
    }
  });
  return true;
});
