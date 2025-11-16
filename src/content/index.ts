import { ChangeObject, diffLines } from "diff";
import { hydrationDiff } from "../utils/hydrationDiff";
import {format as prettierFormat } from "prettier/standalone";
import * as prettierPluginHtml from "prettier/plugins/html"; // this path may work

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
  // Notify that page is loading
  chrome.runtime.sendMessage({ type: 'page-loading' });

  let initialHtml = '';
  let reactDetected = false;
  let reactDetectionTimeout: number | null = null;

  window.addEventListener('DOMContentLoaded', () => {
    initialHtml = document.documentElement.outerHTML;

      // Set timeout to check if React was detected
  reactDetectionTimeout = window.setTimeout(() => {
    if (!reactDetected) {
      console.log('No React detected after 5 seconds');
      chrome.runtime.sendMessage({ type: 'no-react-detected' });
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
    chrome.runtime.sendMessage({ type: 'react-detected' });
  });

  window.addEventListener('react-hydration-finished', async  () => {
    chrome.runtime.sendMessage({ type: 'checking-hydration' });
 
    const postHydrationHtml = document.documentElement.outerHTML;
    const hydrationResult = hydrationDiff(initialHtml, postHydrationHtml);
    console.log('hydrationResult', hydrationResult);
    if (hydrationResult?.isEqual === false) {
      console.log('hydrationResult.isEqual === false', hydrationResult);
      const initialRoot = new DOMParser().parseFromString(hydrationResult.initialRoot, 'text/html');
      const hydratedRoot = new DOMParser().parseFromString(hydrationResult.hydratedRoot, 'text/html');
      const formattedInitialRoot = await prettierFormat(initialRoot.documentElement.outerHTML, { 
        parser: 'html', plugins: [prettierPluginHtml],
      });
      const formattedHydratedRoot = await prettierFormat(hydratedRoot.documentElement.outerHTML, { 
        parser: 'html', plugins: [prettierPluginHtml],
      });

      console.log(formattedInitialRoot);
      console.log( formattedHydratedRoot);
      
      const diff = diffLines(formattedInitialRoot, formattedHydratedRoot);

      chrome.runtime.sendMessage({
        type: 'react-hydration-finished',
        data: {
          initialRoot: formattedInitialRoot,
          hydratedRoot: formattedHydratedRoot,
          diff,
          isEqual: false,
        },
      });
    } else {
      chrome.runtime.sendMessage({
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
