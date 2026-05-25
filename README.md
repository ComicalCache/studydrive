# StudyDrive PDF Downloader

Chromium extension that adds a download button to StudyDrive document pages.

## Disclaimer

This tool is intended for users who have legitimate download access to documents on StudyDrive (e.g. through the rewards system or a premium subscription). Only use this extension to download documents you are authorized to download. The authors are not responsible for any misuse.

## Download

1. Click the green **Code** button on the repository page
2. Select **Download ZIP**
3. Extract the ZIP file to a folder on your computer

## Installation

1. Open `chrome://extensions` in your browser (or `edge://extensions`, `brave://extensions`, etc.)
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extracted folder (the one containing `manifest.json`)
5. The extension icon should appear in your toolbar

## Usage

1. Log in to [studydrive.net](https://www.studydrive.net) with your account
2. Navigate to any document page (e.g. `studydrive.net/en/doc/...`)
3. Wait for the PDF preview to finish rendering in the viewer
4. Click the green **⬇ Download PDF** button in the bottom-right corner
5. The PDF will be saved to your downloads folder with the original filename

## Troubleshooting

- **Button doesn't appear:** Make sure you're on a document page (`/doc/` in the URL) and the PDF preview has loaded.
- **"No PDF captured yet" error:** The document hasn't fully loaded. Wait a few seconds for the viewer to render, then try again.
- **Extension not working after browser update:** Go to `chrome://extensions`, remove the extension, and re-add it with "Load unpacked".

## How it works

The extension intercepts the PDF data that PSPDFKit (the embedded viewer) fetches to render the document preview. When you click the download button, it saves that already-loaded data as a PDF file. No additional network requests are made.

## Requirements

- Chromium-based browser (Chrome, Edge, Brave, Vivaldi, Opera, etc.)
- Active StudyDrive account (must be logged in)
