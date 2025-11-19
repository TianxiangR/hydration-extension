import { ChangeObject, diffLines } from "diff";
import { hydrationDiff } from "../utils/hydrationDiff";
import { format as prettierFormat } from "prettier/standalone";
import * as prettierPluginHtml from "prettier/plugins/html";
import { removeAllComments } from "../utils/dom";

/**
 * Content Script Connection Manager
 * 
 * Manages the Chrome runtime port connection between content script and background.
 * Handles auto-reconnection on disconnect (e.g., BFCache, navigation, service worker restart).
 * Uses exponential backoff with a max delay of 5 seconds, retries indefinitely.
 */
class ContentConnection {
  private port: chrome.runtime.Port | null = null;
  private reconnectAttempts = 0;
  private reconnectDelay = 100; // ms
  private reconnectTimeoutId: number | null = null;

  /**
   * Initialize the connection
   */
  public connect(): void {
    if (this.port) {
      console.log('[Content Connection] Already connected');
      return;
    }

    try {
      this.port = chrome.runtime.connect({ name: 'content' });

      console.log('[Content Connection] Connected:', this.port.name);
      this.reconnectAttempts = 0;

      // Set up disconnect handler with auto-reconnect
      this.port.onDisconnect.addListener(this.handleDisconnect);
    } catch (error) {
      console.error('[Content Connection] Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle port disconnection
   */
  private handleDisconnect = () => {
    console.warn('[Content Connection] Port disconnected — likely BFCache, navigation, or service worker restart');
    
    this.port = null;
    
    // Schedule reconnection
    this.scheduleReconnect();
  };

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    // Clear any existing timeout
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectAttempts++;
    // Cap the delay at 5 seconds to avoid too long waits
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      5000
    );

    console.log(`[Content Connection] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send a message to the background script
   */
  public sendMessage(message: { type: string; [key: string]: unknown }): void {
    if (!this.port) {
      console.warn('[Content Connection] Cannot send message - not connected, attempting to reconnect:', message);
      this.connect();
      // Queue the message to be sent after reconnection attempt
      setTimeout(() => {
        if (this.port) {
          try {
            this.port.postMessage(message);
          } catch (error) {
            console.error('[Content Connection] Failed to send queued message:', error);
          }
        }
      }, 100);
      return;
    }

    try {
      this.port.postMessage(message);
    } catch (error) {
      console.error('[Content Connection] Failed to send message:', error);
      // Connection might be dead, trigger reconnect
      this.handleDisconnect();
    }
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return this.port !== null;
  }

  /**
   * Manually disconnect (for cleanup)
   */
  public disconnect(): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.port) {
      console.log('[Content Connection] Manually disconnecting');
      this.port.disconnect();
      this.port = null;
    }
  }
}

// Create singleton instance
const contentConnection = new ContentConnection();

const injectScript = async () => {
  return new Promise((resolve, reject) => {
    const scriptUrl = chrome.runtime.getURL('injected.js');
    const script = document.createElement('script');
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      reject(new Error('Failed to inject script'));
    };
    script.src = scriptUrl;
    (document.head || document.documentElement || document).append(script);
  });
}

const installReactDevToolGlobalHook = () => {
  const seen = new WeakSet<object>();
  const hook = {
    renderers: new Map(),
    supportsFiber: true,
    onCommitFiberRoot(rendererId: unknown, root: object) {
      if (seen.has(root)) {
        return;
      }
      console.log('React detected!')

      seen.add(root);
      console.log('react-hydration-finished', rendererId, root);
      window.dispatchEvent(
        new CustomEvent('react-hydration-finished', { detail: { rendererId, root } })
      );
    },
    onPostCommitFiberRoot() {},
    onCommitFiberUnmount() {},
    inject(renderer: unknown) {
      console.log('React inject called - React detected!', renderer);
      // Dispatch React detected event
      window.dispatchEvent(new CustomEvent('react-detected'));
      
      const id = Math.random().toString(16).slice(2);
      this.renderers.set(id, renderer);
      return id;
    },
  };
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    value: hook,
    configurable: false,
    writable: false,
  });
}

const runScript = (fn: () => void) => {
  window.dispatchEvent(new CustomEvent('run-script', { detail: { script: `(${fn.toString()})()` } }));
}

export type PageLoadingMessage = {
  type: 'page-loading';
}

export type ReactDetectedMessage = {
  type: 'react-detected';
}

export type CheckingHydrationMessage = {
  type: 'checking-hydration';
}

export type ReactHydrationFinishedMessage = {
  type: 'react-hydration-finished';
  data: {
    id?: string; // UUID
    url?: string; // Full URL
    timestamp?: number;
    initialHtml?: string; // Full initial HTML
    postHydrationHtml?: string; // Full post-hydration HTML
    initialRoot?: string;
    hydratedRoot?: string;
    diff?: ChangeObject<string>[];
    isEqual: boolean;
  };
}

export type NoReactDetectedMessage = {
  type: 'no-react-detected';
}

export type HydrationMessage = 
  | PageLoadingMessage 
  | ReactDetectedMessage 
  | CheckingHydrationMessage
  | ReactHydrationFinishedMessage
  | NoReactDetectedMessage;

async function main() {
  // Initialize connection
  contentConnection.connect();

  // Notify that page is loading
  contentConnection.sendMessage({ type: 'page-loading' });

  let initialHtml = '';
  let reactDetected = false;
  let reactDetectionTimeout: number | null = null;

  window.addEventListener('DOMContentLoaded', () => {
    initialHtml = document.documentElement.outerHTML;

    // Set timeout to check if React was detected
    reactDetectionTimeout = window.setTimeout(() => {
      if (!reactDetected) {
        console.log('No React detected after 5 seconds');
        contentConnection.sendMessage({ type: 'no-react-detected' });
      }
    }, 5000);
  });

  // Listen for React detection via inject method
  window.addEventListener('react-detected', () => {
    reactDetected = true;
    if (reactDetectionTimeout) {
      clearTimeout(reactDetectionTimeout);
    }
    console.log('React detected via inject!');
    contentConnection.sendMessage({ type: 'react-detected' });
  });

  window.addEventListener('react-hydration-finished', async () => {
    contentConnection.sendMessage({ type: 'checking-hydration' });

    const postHydrationHtml = document.documentElement.outerHTML;
    const hydrationResult = hydrationDiff(initialHtml, postHydrationHtml);
    console.log('hydrationResult', hydrationResult);
    if (hydrationResult?.isEqual === false) {
      console.log('hydrationResult.isEqual === false', hydrationResult);
      const initialDoc = new DOMParser().parseFromString(hydrationResult.initialRoot, 'text/html');
      const hydratedDoc = new DOMParser().parseFromString(hydrationResult.hydratedRoot, 'text/html');
      removeAllComments(initialDoc.documentElement);
      removeAllComments(hydratedDoc.documentElement);
      const formattedInitialRoot = await prettierFormat(initialDoc.body.innerHTML, { 
        parser: 'html', plugins: [prettierPluginHtml],
      });
      console.log('formattedInitialRoot', formattedInitialRoot);
      const formattedHydratedRoot = await prettierFormat(hydratedDoc.body.innerHTML, { 
        parser: 'html', plugins: [prettierPluginHtml],
      });

      console.log(formattedInitialRoot);
      console.log(formattedHydratedRoot);
      
      const diff = diffLines(formattedInitialRoot, formattedHydratedRoot);

      contentConnection.sendMessage({
        type: 'react-hydration-finished',
        data: {
          id: crypto.randomUUID(),
          url: window.location.href,
          timestamp: Date.now(),
          initialHtml,
          postHydrationHtml,
          initialRoot: initialDoc.body.innerHTML,
          hydratedRoot: hydratedDoc.body.innerHTML,
          diff,
          isEqual: false,
        },
      });
    } else {
      contentConnection.sendMessage({
        type: 'react-hydration-finished',
        data: {
          isEqual: true,
        },
      });
    }
  });

  await injectScript();
  runScript(installReactDevToolGlobalHook);
}

main();
export {};
