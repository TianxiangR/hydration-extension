// // background.js
// const devtoolsPorts = new Map<number, chrome.runtime.Port>(); // tabId → devtools port

import { ReactHydrationFinishedMessage } from "../content";

// // Cache the latest message for each tab
// // This allows devtools to get the current state when it opens
// const messageCache = new Map(); // tabId → latest message

// // DevTools panel connects once
// chrome.runtime.onConnect.addListener((port) => {
//   if (port.name.startsWith('devtools:')) {
//     const tabId = Number(port.name.split(':')[1]);
//     console.log('DevTools connected for tab', tabId);
//     devtoolsPorts.set(tabId, port);
    
//     // Listen for messages from devtools (like 'devtools-ready')
//     port.onMessage.addListener((msg) => {
//       console.log('Message from devtools:', msg);
      
//       if (msg.type === 'devtools-ready') {
//         // DevTools panel is ready to receive messages
//         const cachedMessage = messageCache.get(tabId);
//         if (cachedMessage) {
//           console.log('Sending cached message to ready devtools:', cachedMessage);
//           port.postMessage(cachedMessage);
//         } else {
//           console.log('No cached message for tab', tabId);
//         }
//       }
//     });
    
//     port.onDisconnect.addListener(() => {
//       console.log('DevTools disconnected for tab', tabId);
//       devtoolsPorts.delete(tabId);
//       // Keep the cache even when devtools closes
//       // so it can be restored when reopened
//     });
//   }
// });

// // Relay messages from content scripts to the matching devtools port
// chrome.runtime.onMessage.addListener((msg, sender) => {
//   console.log('Message from content script:', msg);
//   console.log('Sender:', sender);
  
//   if (!sender.tab?.id) return;
  
//   const tabId = sender.tab.id;
  
//   // Always cache the latest message for this tab
//   messageCache.set(tabId, msg);
//   console.log('Cached message for tab', tabId);
  
//   // If devtools is open, send the message immediately
//   const port = devtoolsPorts.get(tabId);
//   if (port) {
//     console.log('Forwarding message to devtools');
//     port.postMessage(msg);
//   } else {
//     console.log('DevTools not open, message cached for later');
//   }
// });

// // Clean up cache when tab is closed
// chrome.tabs.onRemoved.addListener((tabId) => {
//   console.log('Tab closed, cleaning up cache for tab', tabId);
//   messageCache.delete(tabId);
//   devtoolsPorts.delete(tabId);
// });

type PageStatus = 
  | 'idle'
  | 'loading'
  | 'react-detected'
  | 'checking-hydration'
  | 'no-react-detected'
  | 'hydration-complete';

type ContentScriptInfo = {
  tabId: number;
  port: chrome.runtime.Port;
  status: PageStatus;
  currentError: ReactHydrationFinishedMessage['data'] | null;
}

type DevtoolsInfo = {
  tabId: number;
  port: chrome.runtime.Port;
}

const ports = {
  devtools: new Map<number, DevtoolsInfo>(),
  content: new Map<number, ContentScriptInfo>(),
};



const handleContentScriptConnect = (port: chrome.runtime.Port) => {
  if (port.name !== 'content' || port.sender?.tab?.id === undefined) {
    return;
  }

  const tabId = port.sender.tab.id;
  ports.content.set(tabId, {
    tabId,
    port,
    status: 'idle',
    currentError: null,
  });

  port.onMessage.addListener((msg) => {
    const contentInfo = ports.content.get(tabId);
    if (!contentInfo) {
      return;
    }

    const sendStatusUpdate = () => {
      const devtoolsInfo = ports.devtools.get(tabId);
      console.log('Sending status update to devtools', devtoolsInfo);
      if (!devtoolsInfo) {
        return;
      }
      devtoolsInfo.port.postMessage({
        type: 'devtools-status-update',
        data: {
          status: contentInfo.status,
          currentError: contentInfo.currentError,
        }
      });
    }

    switch (msg.type) {
      case 'react-hydration-finished': {
        contentInfo.currentError = msg.data;
        contentInfo.status = 'hydration-complete';
        sendStatusUpdate();
        break;
      }
      case 'page-loading': {
        contentInfo.status = 'loading';
        sendStatusUpdate();
        break;
      }
      case 'react-detected': {
        contentInfo.status = 'react-detected';
        sendStatusUpdate();
        break;
      }
      case 'checking-hydration': {
        contentInfo.status = 'checking-hydration';
        sendStatusUpdate();
        break;
      }
      case 'no-react-detected': {
        contentInfo.status = 'no-react-detected';
        sendStatusUpdate();
        break;
      }
    }
  });

  port.onDisconnect.addListener(() => {
    ports.content.delete(tabId);
  });
};

const handleDevtoolsConnect = (port: chrome.runtime.Port) => {
  console.log('Devtools connected', port);
  if (port.name !== 'devtools') {
    return;
  }

  console.log('DevTools port connected, waiting for devtools-ready message...');

  port.onMessage.addListener((msg) => {
    console.log('Message from devtools:', msg);

    switch (msg.type) {
      case 'devtools-ready': {
        // DevTools provides the inspected tab ID in the message
        const tabId = msg.tabId;
        if (typeof tabId !== 'number') {
          console.error('Invalid tabId in devtools-ready message:', msg);
          return;
        }

        console.log('Registering DevTools for tab', tabId);

        // Register the DevTools port
        ports.devtools.set(tabId, {
          tabId,
          port,
        });

        // Send initial status update
        const contentInfo = ports.content.get(tabId);
        if (contentInfo) {
          port.postMessage({
            type: 'devtools-status-update',
            data: {
              status: contentInfo.status,
              currentError: contentInfo.currentError,
            }
          });
        }
        break;
      }
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('DevTools disconnected, cleaning up...');
    // Find and remove this port from the map
    for (const [tabId, devtoolsInfo] of ports.devtools.entries()) {
      if (devtoolsInfo.port === port) {
        ports.devtools.delete(tabId);
        console.log('Removed DevTools port for tab', tabId);
        break;
      }
    }
  });
};

chrome.runtime.onConnect.addListener(handleContentScriptConnect);
chrome.runtime.onConnect.addListener(handleDevtoolsConnect);