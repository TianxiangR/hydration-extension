/**
 * DevTools Connection
 * 
 * Port connection between DevTools panel and background script.
 * Uses the generic PortConnection class with DevTools-specific configuration.
 */

import { PortConnection } from '../utils/portConnection';

export type DevToolsMessage = {
  type: string;
  [key: string]: unknown;
};

// Create DevTools connection instance using the generic PortConnection
export const devToolsConnection = new PortConnection<DevToolsMessage>({
  portName: 'devtools',
  logPrefix: '[DevTools Connection]',
});

