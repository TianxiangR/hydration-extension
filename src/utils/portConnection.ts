/**
 * Generic Port Connection Manager
 * 
 * Manages Chrome runtime port connections with auto-reconnection.
 * Handles disconnects (e.g., BFCache, navigation, service worker restart).
 * Uses exponential backoff with a max delay of 5 seconds, retries indefinitely.
 */

export interface PortConnectionConfig {
  /** Port name for the connection */
  portName: string;
  /** Optional function to get dynamic port connection options */
  getConnectOptions?: () => chrome.runtime.ConnectInfo;
  /** Optional callback when connection is established */
  onConnect?: (port: chrome.runtime.Port) => void;
  /** Optional callback when connection is lost */
  onDisconnect?: () => void;
  /** Log prefix for debugging */
  logPrefix?: string;
}

export class PortConnection<TMessage = any> {
  private port: chrome.runtime.Port | null = null;
  private listeners: Set<(message: TMessage) => void> = new Set();
  private reconnectAttempts = 0;
  private reconnectDelay = 100; // ms
  private reconnectTimeoutId: number | null = null;
  private config: Required<PortConnectionConfig>;

  constructor(config: PortConnectionConfig) {
    this.config = {
      portName: config.portName,
      getConnectOptions: config.getConnectOptions || (() => ({ name: config.portName })),
      onConnect: config.onConnect || (() => {}),
      onDisconnect: config.onDisconnect || (() => {}),
      logPrefix: config.logPrefix || '[Port Connection]',
    };
  }

  /**
   * Initialize the connection
   */
  public connect(): void {
    if (this.port) {
      console.log(`${this.config.logPrefix} Already connected`);
      return;
    }

    try {
      const connectOptions = this.config.getConnectOptions();
      this.port = chrome.runtime.connect(connectOptions);

      console.log(`${this.config.logPrefix} Connected:`, this.port.name);
      this.reconnectAttempts = 0;

      // Set up message listener
      this.port.onMessage.addListener(this.handleMessage);

      // Set up disconnect handler with auto-reconnect
      this.port.onDisconnect.addListener(this.handleDisconnect);

      // Call custom onConnect callback
      this.config.onConnect(this.port);
    } catch (error) {
      console.error(`${this.config.logPrefix} Failed to connect:`, error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming messages from the port
   */
  private handleMessage = (message: TMessage) => {
    console.log(`${this.config.logPrefix} Message received:`, message);
    
    // Notify all registered listeners
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error(`${this.config.logPrefix} Listener error:`, error);
      }
    });
  };

  /**
   * Handle port disconnection
   */
  private handleDisconnect = () => {
    console.warn(`${this.config.logPrefix} Port disconnected — likely BFCache, navigation, or service worker restart`);
    
    this.port = null;
    
    // Call custom onDisconnect callback
    this.config.onDisconnect();
    
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

    console.log(`${this.config.logPrefix} Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send a message through the port
   */
  public sendMessage(message: TMessage): void {
    if (!this.port) {
      console.warn(`${this.config.logPrefix} Cannot send message - not connected:`, message);
      // Attempt to reconnect and queue message
      this.connect();
      setTimeout(() => {
        if (this.port) {
          try {
            this.port.postMessage(message);
          } catch (error) {
            console.error(`${this.config.logPrefix} Failed to send queued message:`, error);
          }
        }
      }, 100);
      return;
    }

    try {
      this.port.postMessage(message);
    } catch (error) {
      console.error(`${this.config.logPrefix} Failed to send message:`, error);
      // Connection might be dead, trigger reconnect
      this.handleDisconnect();
    }
  }

  /**
   * Register a message listener
   * Returns an unsubscribe function
   */
  public addMessageListener(listener: (message: TMessage) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a message listener
   */
  public removeMessageListener(listener: (message: TMessage) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return this.port !== null;
  }

  /**
   * Get the current port (may be null if disconnected)
   */
  public getPort(): chrome.runtime.Port | null {
    return this.port;
  }

  /**
   * Manually disconnect (for cleanup)
   */
  public disconnect(): void {
    // Clear any pending reconnect timeout
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.port) {
      console.log(`${this.config.logPrefix} Manually disconnecting`);
      this.port.disconnect();
      this.port = null;
    }
    this.listeners.clear();
  }
}

