/**
 * DevTools panel initialization
 * 
 * Creates the "Hydration Detector" panel in Chrome DevTools.
 * The panel displays the main UI (index.html) where React components
 * manage the DevTools connection via Redux.
 */
chrome.devtools.panels.create(
  "Hydration Detector",          // Panel title
  "icon48.png",                  // Panel icon
  "index.html",                  // The page to show inside the panel
  (panel) => {
    console.log("✅ DevTools panel created:", panel);
  }
);
