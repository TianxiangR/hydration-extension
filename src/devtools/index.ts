chrome.devtools.panels.create(
  "Hydration Detector",          // Panel title
  "icon48.png",                  // Panel icon
  "index.html",                  // The page to show inside the panel
  (panel) => {
    console.log("✅ DevTools panel created:", panel);
  }
);
const tabId = chrome.devtools.inspectedWindow.tabId;
console.log('tabId', tabId);

export const devToolPort = chrome.runtime.connect({ name: `devtools:${tabId}` });