# Browser Extension

Cite any webpage in one click without leaving your browser.

## What it does

The OpenCitation browser extension adds a toolbar button to Chrome, Edge, and Firefox. Click it on any page to instantly generate a citation for that URL. You can copy it or open it in the full app to save it to a List.

- One-click citation generation for the current tab
- Choose APA, MLA, Chicago, or Harvard from the popup
- Copy to clipboard or open in OpenCitation
- Right-click any link and choose **Cite this page**

## Installation — Chrome & Edge

### From the Chrome Web Store (coming soon)

The extension will be available on the Chrome Web Store. Until then, install it manually using Developer Mode.

### Manual install (Developer Mode)

1. Download or clone the [OpenCitation repository](https://github.com/aicoder2009/opencitation).
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the `browser-extension/` directory from the repository.
6. The OpenCitation icon appears in your toolbar. Pin it for easy access.

## Installation — Firefox

Firefox uses a slightly different manifest format. The extension works with minor changes — see the repository README for details. Full Firefox support is on the roadmap.

## Using the extension

1. Navigate to any webpage you want to cite.
2. Click the OpenCitation icon in the browser toolbar.
3. Select your citation style from the dropdown.
4. Click **Generate Citation**.
5. Click **Copy** to copy it, or **Open in app** to save it to a List.

### Right-click context menu

Right-click any link on a page and choose **Cite this page with OpenCitation** to generate a citation for the linked URL without navigating to it.

## Browser support

| Browser | Status |
|---|---|
| Chrome | Supported (Manifest V3) |
| Edge (Chromium) | Supported |
| Firefox | Partial — minor manifest changes needed |
| Safari | Not currently supported |
