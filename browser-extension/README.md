# OpenCitation Browser Extension

Instantly cite any webpage in APA, MLA, Chicago, or Harvard format.

## Features

- **One-click citations**: Generate properly formatted citations for any webpage
- **Multiple styles**: Support for APA, MLA, Chicago, and Harvard citation formats
- **Copy to clipboard**: Easily copy citations with one click
- **Open in app**: Jump to the full OpenCitation app for more features
- **Right-click context menu**: Cite pages directly from the context menu
- **Wikipedia 2000s styling**: Clean, nostalgic interface

## Installation

### Development/Local Testing

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `browser-extension` directory
5. The extension icon should appear in your toolbar

### Production (Future)

The extension will be available on the Chrome Web Store.

## Configuration

By default, the extension connects to `http://localhost:3000` for the API. To change this:

1. Open `popup.js`
2. Update the `API_BASE_URL` constant to your server URL

## Usage

1. Navigate to any webpage you want to cite
2. Click the OpenCitation icon in your browser toolbar
3. Select your preferred citation style (APA, MLA, Chicago, Harvard)
4. Click "Generate Citation"
5. Copy the citation or open it in the full app

## Icon Generation

To create proper icons, you'll need to generate PNG files at these sizes:
- 16x16 pixels (icon16.png)
- 32x32 pixels (icon32.png)
- 48x48 pixels (icon48.png)
- 128x128 pixels (icon128.png)

Place them in the `icons/` directory.

## Development

The extension uses Manifest V3 and consists of:

- `manifest.json` - Extension configuration
- `popup.html` - Popup UI structure
- `popup.css` - Wikipedia 2000s styling
- `popup.js` - Popup functionality
- `background.js` - Service worker for background tasks
- `content.js` - Content script for extracting page metadata

## Browser Support

- Chrome (primary)
- Edge (Chromium-based)
- Firefox (with minor manifest changes)

## License

MIT License - See main project LICENSE file.
