# Redux Store Structure

## Overview
This Redux store manages the state for the Hydration Extension with two main slices: **errors** and **ui**.

## File Structure
```
src/store/
├── index.ts              # Store configuration
├── types.ts              # TypeScript types
├── hooks.ts              # Typed React hooks
├── selectors.ts          # Reselect selectors
└── slices/
    ├── errorsSlice.ts    # Errors state management
    └── uiSlice.ts        # UI state management
```

## State Shape
```typescript
{
  errors: {
    errors: HydrationErrorBasic[],  // Array of basic error info
    origin: string | null            // Current origin for filtering
  },
  ui: {
    activeErrorId: string | null,    // Currently selected error
    sidePanelExpanded: boolean       // Side panel visibility
  }
}
```

## Data Storage Strategy

### Redux Store (In Memory)
Stores **basic** error information only:
- `id` (UUID)
- `url` (Full URL)
- `timestamp` (When error occurred)

### IndexDB (Persistent)
Stores **full** error data:
- All basic info (id, url, timestamp)
- `initialHtml` (Full initial HTML string)
- `postHydrationHtml` (Full post-hydration HTML)
- `diffResult` (Complete diff data including formatted HTML and line diffs)

## Usage

### In Components

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addError, removeError, clearAllErrors } from '@/store/slices/errorsSlice';
import { setActiveErrorId } from '@/store/slices/uiSlice';
import { selectErrorsByOrigin, selectActiveError } from '@/store/selectors';

function MyComponent() {
  const dispatch = useAppDispatch();
  const errors = useAppSelector(selectErrorsByOrigin);
  const activeError = useAppSelector(selectActiveError);
  
  // Add an error
  dispatch(addError({
    id: 'uuid-here',
    url: 'https://example.com',
    timestamp: Date.now()
  }));
  
  // Select an error
  dispatch(setActiveErrorId('error-id'));
  
  // Remove an error
  dispatch(removeError('error-id'));
  
  // Clear all
  dispatch(clearAllErrors());
}
```

## Actions

### Errors Slice
- `addError(error)` - Add a new error to the list
- `removeError(id)` - Remove error by ID
- `clearAllErrors()` - Clear all errors
- `setOrigin(origin)` - Set current origin for filtering
- `loadErrors(errors[])` - Load errors from persistence

### UI Slice
- `setActiveErrorId(id)` - Set the active error
- `toggleSidePanel()` - Toggle side panel visibility
- `setSidePanelExpanded(boolean)` - Set side panel state

## Selectors

- `selectAllErrors` - Get all errors
- `selectErrorsByOrigin` - Get errors filtered by current origin
- `selectErrorById(id)` - Get specific error by ID
- `selectActiveError` - Get currently selected error
- `selectActiveErrorId` - Get active error ID
- `selectSidePanelExpanded` - Get side panel state
- `selectErrorCount` - Get total error count
- `selectErrorCountByOrigin` - Get error count for current origin

## Next Steps

1. ✅ Redux store setup (COMPLETE)
2. ⏳ IndexDB persistence layer
3. ⏳ Panel initialization hook
4. ⏳ Side panel UI component
5. ⏳ Main content component with error details

