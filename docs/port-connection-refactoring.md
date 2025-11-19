# Port Connection Refactoring

## Overview

Refactored the connection management code to use a generic, reusable `PortConnection` class instead of duplicate implementations in DevTools and content script.

## Changes

### 1. Created Generic `PortConnection` Class

**File:** `src/utils/portConnection.ts`

A generic connection manager that handles:
- Chrome runtime port connections
- Auto-reconnection with exponential backoff
- Message passing with type safety
- Listener management (observer pattern)
- Configurable logging and callbacks

**Key Features:**
- Generic type parameter `<TMessage>` for type-safe message handling
- Configuration-based initialization via `PortConnectionConfig`
- Auto-reconnect with exponential backoff (100ms → 200ms → ... → 5000ms max)
- Message queueing when disconnected
- Optional `onConnect` and `onDisconnect` callbacks
- Customizable log prefix for debugging

**API:**
```typescript
interface PortConnectionConfig {
  portName: string;
  getConnectOptions?: () => chrome.runtime.ConnectInfo;
  onConnect?: (port: chrome.runtime.Port) => void;
  onDisconnect?: () => void;
  logPrefix?: string;
}

class PortConnection<TMessage> {
  connect(): void
  sendMessage(message: TMessage): void
  addMessageListener(listener: (message: TMessage) => void): () => void
  removeMessageListener(listener: (message: TMessage) => void): void
  isConnected(): boolean
  getPort(): chrome.runtime.Port | null
  disconnect(): void
}
```

### 2. Refactored DevTools Connection

**File:** `src/devtools/connection.ts`

**Before:** 150+ lines of connection management code
**After:** Direct instantiation of `PortConnection` (~4 lines)

- Removed duplicate connection logic
- No wrapper class needed (direct usage)
- Type-safe with `DevToolsMessage` type

**Usage:**
```typescript
const devToolsConnection = new PortConnection<DevToolsMessage>({
  portName: 'devtools',
  logPrefix: '[DevTools Connection]',
});

devToolsConnection.connect();
devToolsConnection.sendMessage({ 
  type: MessageType.DEVTOOLS_READY, 
  tabId: chrome.devtools.inspectedWindow.tabId 
});
```

### 3. Refactored Content Script Connection

**File:** `src/content/index.ts`

**Before:** ~130 lines of `ContentConnection` class
**After:** Direct instantiation of `PortConnection` (~4 lines)

- Removed duplicate connection logic
- No wrapper needed (direct usage)
- Type-safe with `ContentMessage` type

**Usage:**
```typescript
const contentConnection = new PortConnection<ContentMessage>({
  portName: 'content',
  logPrefix: '[Content Connection]',
});

contentConnection.connect();
contentConnection.sendMessage({ 
  type: MessageType.PAGE_LOADING 
});
```

## Benefits

### 1. **Code Reusability**
- Single source of truth for port connection logic
- ~200+ lines of duplicate code eliminated
- Easier to maintain and test

### 2. **Type Safety**
- Generic type parameter ensures message type consistency
- TypeScript enforces correct message shapes
- Better IDE autocomplete and error detection

### 3. **Flexibility**
- Configuration-based approach allows easy customization
- Can be used for any Chrome extension port connection
- Optional callbacks for custom behavior

### 4. **Maintainability**
- Bug fixes and improvements benefit all connections
- Consistent logging format
- Clear separation of concerns

### 5. **Better Performance**
- Same bundling strategy (separate builds)
- Content script: 298.81 kB (gzipped: 82.12 kB)
- Background script: 4.28 kB (gzipped: 1.12 kB)
- DevTools bundled in UI: 241.94 kB (gzipped: 76.25 kB)
- Slightly smaller bundle sizes due to simpler code

## Future Extensions

The generic `PortConnection` can be easily extended for:
- Other extension scripts (popup, options page, etc.)
- Different connection strategies (e.g., message retry logic)
- Connection pooling or multiplexing
- Advanced reconnection strategies
- Connection health monitoring

## Migration Guide

### For New Connections

```typescript
import { PortConnection } from '../utils/portConnection';

type MyMessage = {
  type: string;
  // ... other fields
};

const myConnection = new PortConnection<MyMessage>({
  portName: 'my-port-name',
  logPrefix: '[My Connection]',
  onConnect: (port) => {
    console.log('Connected!', port);
  },
  onDisconnect: () => {
    console.log('Disconnected!');
  },
});

myConnection.connect();
```

### For Existing Code

1. Import `PortConnection` instead of custom connection class
2. Define message type
3. Instantiate with configuration
4. Replace method calls (most are 1:1)

## Testing

✅ Build successful
✅ No linter errors
✅ Type safety maintained
✅ Bundle sizes improved (UI slightly smaller: 241.94 kB vs 242.45 kB)

