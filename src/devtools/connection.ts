/**
 * DevTools Connection Singleton
 * 
 * Manages the Chrome runtime port connection between DevTools panel and background script.
 * Handles auto-reconnection on disconnect (e.g., BFCache, navigation, service worker restart).
 * Uses exponential backoff with a max delay of 5 seconds, retries indefinitely.
 */

import { HydrationMessage } from '../content';

type MessageListener = (message: HydrationMessage) => void;

class DevToolsConnection {
  private static instance: DevToolsConnection;
  private port: chrome.runtime.Port | null = null;
  private listeners: Set<MessageListener> = new Set();
  private reconnectAttempts = 0;
  private reconnectDelay = 100; // ms

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DevToolsConnection {
    if (!DevToolsConnection.instance) {
      DevToolsConnection.instance = new DevToolsConnection();
    }
    return DevToolsConnection.instance;
  }

  /**
   * Initialize the connection
   * Should be called once when the DevTools panel loads
   */
  public connect(): void {
    if (this.port) {
      console.log('[DevTools Connection] Already connected');
      return;
    }

    try {
      this.port = chrome.runtime.connect({
        name: `devtools:${chrome.devtools.inspectedWindow.tabId}`
      });

      console.log('[DevTools Connection] Connected:', this.port.name);
      this.reconnectAttempts = 0;

      // Set up message listener
      this.port.onMessage.addListener(this.handleMessage);

      // Set up disconnect handler with auto-reconnect
      this.port.onDisconnect.addListener(this.handleDisconnect);
    } catch (error) {
      console.error('[DevTools Connection] Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming messages from background script
   */
  private handleMessage = (message: HydrationMessage) => {
    console.log('[DevTools Connection] Message received:', message);
    
    // Notify all registered listeners
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('[DevTools Connection] Listener error:', error);
      }
    });
  };

  /**
   * Handle port disconnection
   */
  private handleDisconnect = () => {
    console.warn('[DevTools Connection] Port disconnected — likely BFCache, navigation, or service worker restart');
    
    this.port = null;
    
    // Schedule reconnection
    this.scheduleReconnect();
  };

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    // Cap the delay at 5 seconds to avoid too long waits
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      5000
    );

    console.log(`[DevTools Connection] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send a message to the background script
   */
  public sendMessage(message: { type: string; [key: string]: unknown }): void {
    if (!this.port) {
      console.warn('[DevTools Connection] Cannot send message - not connected:', message);
      return;
    }

    try {
      this.port.postMessage(message);
    } catch (error) {
      console.error('[DevTools Connection] Failed to send message:', error);
      // Connection might be dead, trigger reconnect
      this.handleDisconnect();
    }
  }

  /**
   * Register a message listener
   * Returns an unsubscribe function
   */
  public addMessageListener(listener: MessageListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a message listener
   */
  public removeMessageListener(listener: MessageListener): void {
    this.listeners.delete(listener);
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
    if (this.port) {
      console.log('[DevTools Connection] Manually disconnecting');
      this.port.disconnect();
      this.port = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const devToolsConnection = DevToolsConnection.getInstance();

