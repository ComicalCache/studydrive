const pending = new Map();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "download-chunk") {
    return;
  }

  let entry = pending.get(msg.downloadId);
  if (!entry) {
    entry = { chunks: new Array(msg.totalChunks), received: 0, filename: msg.filename };

    pending.set(msg.downloadId, entry);
  }

  entry.chunks[msg.chunkIndex] = msg.chunk;
  entry.received++;

  pending.delete(msg.downloadId);

  const base64 = entry.chunks.join("");
  const dataUrl = "data:application/pdf;base64," + base64;

  const startDownload = (urlToDownload) => {
    chrome.downloads.download(
      {
        url: urlToDownload,
        filename: entry.filename,
        conflictAction: "uniquify",
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      },
    );
  };

  if (typeof URL.createObjectURL === "function") {
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        startDownload(blobUrl);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      })
      .catch((err) => {
        sendResponse({ error: err.toString() });
      });
  } else {
    startDownload(dataUrl);
  }

  return true;
});
