# Storage Layer Architecture

## Overview
Three-layer architecture for persistent storage of hydration error data:
1. **Generic Storage Interface** - Basic CRUD operations
2. **Storage Instances** - Specialized storages for lists and details
3. **Service Layer** - Business logic coordinator

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│   HydrationErrorService (Business Logic)    │
│   - addError(), removeError(), etc.         │
└────────────┬────────────────┬───────────────┘
             │                │
    ┌────────▼───────┐ ┌─────▼──────────┐
    │ errorListStorage│ │errorDetailStorage│
    │  (by origin)   │ │   (by UUID)    │
    └────────┬───────┘ └────┬────────────┘
             │              │
        ┌────▼──────────────▼────┐
        │   IndexDBStorage<T>    │
        │ (Generic Implementation)│
        └────────────────────────┘
```

## Layer 1: Generic Storage Interface

**File:** `baseStorage.ts`

Generic IndexDB storage that can store any type with string keys:

```typescript
interface IStorage<T> {
  init(): Promise<void>;
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll(): Promise<T[]>;
}
```

## Layer 2: Storage Instances

Two specialized storage instances created from the generic class:

### Error List Storage
```typescript
IndexDBStorage<ErrorsList>(
  'hydration-extension',  // Database name
  'errors_lists',         // Object store name  
  'origin'                // Primary key
)
```
**Stores:** `{ origin, errors[], timestamp }`

### Error Detail Storage
```typescript
IndexDBStorage<HydrationErrorFull>(
  'hydration-extension',  // Database name
  'error_details',        // Object store name
  'id'                    // Primary key (UUID)
)
```
**Stores:** Full error with HTML and diff data

## Layer 3: Service Layer

**File:** `hydrationErrorService.ts`

High-level service that coordinates both storages:

```typescript
interface IHydrationErrorService {
  init(origin: string): Promise<void>;
  addError(error: HydrationErrorFull): Promise<void>;
  getErrorsList(): Promise<HydrationErrorBasic[]>;
  getErrorDetail(id: string): Promise<HydrationErrorFull | null>;
  removeError(id: string): Promise<void>;
  clearAllErrors(): Promise<void>;
  getAllErrorDetails(): Promise<HydrationErrorFull[]>;
}
```

## Database Structure

```
Database: hydration-extension (v1)
  ├── Object Store: errors_lists
  │    ├── Primary Key: origin
  │    ├── Index: timestamp
  │    └── Data: { origin, errors[], timestamp }
  │
  └── Object Store: error_details
       ├── Primary Key: id (UUID)
       ├── Index: timestamp
       └── Data: { id, url, timestamp, initialHtml, postHydrationHtml, diffResult }
```

## Usage

### Recommended: Use Service Layer

```typescript
import { hydrationErrorService } from '@/storage';

// Initialize for origin
await hydrationErrorService.init('https://example.com');

// Add error (saves detail + updates list automatically)
const error: HydrationErrorFull = {
  id: crypto.randomUUID(),
  url: window.location.href,
  timestamp: Date.now(),
  initialHtml: '...',
  postHydrationHtml: '...',
  diffResult: { ... }
};
await hydrationErrorService.addError(error);

// Get list (fast)
const errors = await hydrationErrorService.getErrorsList();

// Get detail (on-demand)
const detail = await hydrationErrorService.getErrorDetail(errorId);

// Remove error (removes detail + updates list)
await hydrationErrorService.removeError(errorId);

// Clear all
await hydrationErrorService.clearAllErrors();
```

### Advanced: Use Storage Directly

```typescript
import { IndexDBStorage } from '@/storage';

// Create custom storage
const myStorage = new IndexDBStorage<MyType>(
  'my-db',
  'my-store',
  'id'
);

await myStorage.init();
await myStorage.set('key1', myData);
const data = await myStorage.get('key1');
```

## Key Benefits

### 1. Separation of Concerns
- **Generic storage** - Reusable for any data type
- **Storage instances** - Specialized for specific data
- **Service** - Business logic in one place

### 2. Type Safety
```typescript
// Each storage is typed
errorListStorage: IStorage<ErrorsList>
errorDetailStorage: IStorage<HydrationErrorFull>
```

### 3. Encapsulation
Service handles coordination:
```typescript
// One call handles both storages
await service.addError(error);
// vs manually:
// await detailStorage.set(error.id, error);
// const list = await listStorage.get(origin);
// list.errors.push(...);
// await listStorage.set(origin, list);
```

### 4. Testability
- Can mock individual layers
- Can test storage independently
- Can test service logic separately

### 5. Reusability
The generic `IndexDBStorage<T>` can be used for other data:
```typescript
const settingsStorage = new IndexDBStorage<Settings>(...);
const cacheStorage = new IndexDBStorage<CacheItem>(...);
```

## Data Flow Examples

### Adding an Error

```
App calls:
  hydrationErrorService.addError(fullError)
    ↓
Service:
  1. errorDetailStorage.set(error.id, error)
  2. errorListStorage.get(origin)
  3. Append to list
  4. errorListStorage.set(origin, updatedList)
    ↓
IndexDB:
  ✓ error_details['uuid-1'] = { full data }
  ✓ errors_lists['https://example.com'] = { origin, errors[], timestamp }
```

### Removing an Error

```
App calls:
  hydrationErrorService.removeError(id)
    ↓
Service:
  1. errorDetailStorage.remove(id)
  2. errorListStorage.get(origin)
  3. Filter out from list
  4. errorListStorage.set(origin, updatedList)
    ↓
IndexDB:
  ✓ error_details['uuid-1'] deleted
  ✓ errors_lists updated without that error
```

## Performance

| Operation | Service Method | Time | Details |
|-----------|---------------|------|---------|
| Add error | `addError()` | ~150ms | 2 writes (detail + list) |
| Get list | `getErrorsList()` | ~10ms | 1 read (small data) |
| Get detail | `getErrorDetail()` | ~100ms | 1 read (large data) |
| Remove error | `removeError()` | ~120ms | 1 delete + 1 update |
| Clear all | `clearAllErrors()` | ~500ms | N deletes + 1 update |

## File Structure

```
src/storage/
├── index.ts                      # Public exports
├── types.ts                      # Interfaces and types
├── baseStorage.ts                # Generic IStorage<T> implementation
├── hydrationErrorService.ts      # High-level service
├── example.ts                    # Usage examples
└── README.md                     # This file
```

## Migration from Old API

If you were using the old monolithic storage:

```typescript
// Old ❌
await storage.init(origin);
await storage.setErrorDetail(error);
const list = await storage.getErrorsList();
list.push({ id, url, timestamp });
await storage.setErrorsList(list);

// New ✅
await hydrationErrorService.init(origin);
await hydrationErrorService.addError(error);
```

## Next Steps

1. ✅ Generic storage interface
2. ✅ Two storage instances (list + detail)
3. ✅ Service layer with business logic
4. ⏳ Integration with Redux
5. ⏳ Panel initialization hook
6. ⏳ UI components
