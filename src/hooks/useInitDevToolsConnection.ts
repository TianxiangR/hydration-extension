import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { devToolsConnection } from '../devtools/connection';

/**
 * Hook to initialize the DevTools connection
 *
 * - Connects to background script on mount (after Redux initialization)
 * - Auto-reconnects on disconnect (handled by singleton)
 * - Disconnects on unmount
 *
 * This should be called once at the app root level.
 */
export const useInitDevToolsConnection = () => {
  const initialized = useAppSelector(state => state.errors.initialized);

  useEffect(() => {
    // Wait for Redux to be initialized before connecting
    if (!initialized) return;

    // Connect using singleton (auto-reconnects on disconnect)
    devToolsConnection.connect();
    console.log('✅ DevTools connection initialized');

    // Notify background that DevTools is ready, include inspected tab ID
    devToolsConnection.sendMessage({ 
      type: 'devtools-ready',
      tabId: chrome.devtools.inspectedWindow.tabId
    });

    // No cleanup needed - singleton handles connection lifecycle and auto-reconnects
  }, [initialized]);
};

