chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'download') {
    console.log('[SD bg] Download request, base64 length:', msg.base64?.length, 'filename:', msg.filename);
    const dataUrl = 'data:application/pdf;base64,' + msg.base64;
    chrome.downloads.download({
      url: dataUrl,
      filename: msg.filename,
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
  }
});
