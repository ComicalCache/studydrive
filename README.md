# StudyDrive PDF Downloader

Chromium extension that adds a download button to StudyDrive document pages.

## Disclaimer

This tool is intended for users who have legitimate download access to documents on StudyDrive (e.g. through the rewards system or a premium subscription). Only use this extension to download documents you are authorized to download. The authors are not responsible for any misuse.

## Installation

1. Open `chrome://extensions` in your browser
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder

## Usage

1. Log in to [studydrive.net](https://www.studydrive.net) with your account
2. Navigate to any document page (e.g. `studydrive.net/en/doc/...`)
3. Wait for the PDF preview to finish rendering
4. Click the green **⬇ Download PDF** button in the bottom-right corner
5. The PDF will be saved to your downloads folder

## How it works

The extension intercepts the PDF data that PSPDFKit (the viewer) fetches to render the preview. When you click download, it saves that already-loaded data as a PDF file. No additional network requests are made.

## Requirements

- Chromium-based browser (Chrome, Edge, Brave, etc.)
- Active StudyDrive account (must be logged in)
