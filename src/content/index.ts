import { ChangeObject, diffLines } from "diff";
import { hydrationDiff } from "../utils/hydrationDiff";
import { format as prettierFormat } from "prettier/standalone";
import * as prettierPluginHtml from "prettier/plugins/html";
import { MessageType } from "../types/message";
import { removeAllComments } from "../utils/dom";
import { PortConnection } from "../utils/portConnection";

type ContentMessage = {
  type: string;
  [key: string]: unknown;
};

// Create content script connection instance using the generic PortConnection
const contentConnection = new PortConnection<ContentMessage>({
  portName: 'content',
  logPrefix: '[Content Connection]',
});

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
  contentConnection.sendMessage({ type: MessageType.PAGE_LOADING });

  let initialHtml = '';
  let reactDetected = false;
  let reactDetectionTimeout: number | null = null;

  window.addEventListener('DOMContentLoaded', () => {
    initialHtml = document.documentElement.outerHTML;

    // Set timeout to check if React was detected
    reactDetectionTimeout = window.setTimeout(() => {
      if (!reactDetected) {
        console.log('No React detected after 5 seconds');
        contentConnection.sendMessage({ type: MessageType.NO_REACT_DETECTED });
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
    contentConnection.sendMessage({ type: MessageType.REACT_DETECTED });
  });

  window.addEventListener('react-hydration-finished', async () => {
    contentConnection.sendMessage({ type: MessageType.CHECKING_HYDRATION });

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
        type: MessageType.REACT_HYDRATION_FINISHED,
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
        type: MessageType.REACT_HYDRATION_FINISHED,
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
