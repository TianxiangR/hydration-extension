// background.js
const devtoolsPorts = new Map<number, chrome.runtime.Port>(); // tabId → devtools port

// Cache the latest message for each tab
// This allows devtools to get the current state when it opens
const messageCache = new Map(); // tabId → latest message

// DevTools panel connects once
chrome.runtime.onConnect.addListener((port) => {
  if (port.name.startsWith('devtools:')) {
    const tabId = Number(port.name.split(':')[1]);
    console.log('DevTools connected for tab', tabId);
    devtoolsPorts.set(tabId, port);
    
    // Listen for messages from devtools (like 'devtools-ready')
    port.onMessage.addListener((msg) => {
      console.log('Message from devtools:', msg);
      
      if (msg.type === 'devtools-ready') {
        // DevTools panel is ready to receive messages
        const cachedMessage = messageCache.get(tabId);
        if (cachedMessage) {
          console.log('Sending cached message to ready devtools:', cachedMessage);
          port.postMessage(cachedMessage);
        } else {
          console.log('No cached message for tab', tabId);
        }
      }
    });
    
    port.onDisconnect.addListener(() => {
      console.log('DevTools disconnected for tab', tabId);
      devtoolsPorts.delete(tabId);
      // Keep the cache even when devtools closes
      // so it can be restored when reopened
    });
  }
});

// Relay messages from content scripts to the matching devtools port
chrome.runtime.onMessage.addListener((msg, sender) => {
  console.log('Message from content script:', msg);
  console.log('Sender:', sender);
  
  if (!sender.tab?.id) return;
  
  const tabId = sender.tab.id;
  
  // Always cache the latest message for this tab
  messageCache.set(tabId, msg);
  console.log('Cached message for tab', tabId);
  
  // If devtools is open, send the message immediately
  const port = devtoolsPorts.get(tabId);
  if (port) {
    console.log('Forwarding message to devtools');
    port.postMessage(msg);
  } else {
    console.log('DevTools not open, message cached for later');
  }
});

// Clean up cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('Tab closed, cleaning up cache for tab', tabId);
  messageCache.delete(tabId);
  devtoolsPorts.delete(tabId);
});

export {}