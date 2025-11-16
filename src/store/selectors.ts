import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Errors selectors
export const selectAllErrors = (state: RootState) => state.errors.errors;
export const selectOrigin = (state: RootState) => state.errors.origin;
export const selectInitialized = (state: RootState) => state.errors.initialized;

// Filter errors by current origin
export const selectErrorsByOrigin = createSelector(
  [selectAllErrors, selectOrigin],
  (errors, origin) => {
    if (!origin) return errors;
    return errors.filter(error => {
      try {
        const errorOrigin = new URL(error.url).origin;
        return errorOrigin === origin;
      } catch {
        return false;
      }
    });
  }
);

// Get error by ID
export const selectErrorById = (id: string) =>
  createSelector([selectAllErrors], (errors) =>
    errors.find((error) => error.id === id)
  );

// UI selectors
export const selectActiveErrorId = (state: RootState) => state.ui.activeErrorId;
export const selectSidePanelExpanded = (state: RootState) => state.ui.sidePanelExpanded;
export const selectAppStatus = (state: RootState) => state.ui.appStatus;
export const selectActiveTab = (state: RootState) => state.ui.activeTab;
export const selectCurrentError = (state: RootState) => state.ui.currentError;

// Get active error
export const selectActiveError = createSelector(
  [selectAllErrors, selectActiveErrorId],
  (errors, activeId) => {
    if (!activeId) return null;
    return errors.find((error) => error.id === activeId) || null;
  }
);

// Count errors
export const selectErrorCount = createSelector(
  [selectAllErrors],
  (errors) => errors.length
);

// Count errors by origin
export const selectErrorCountByOrigin = createSelector(
  [selectErrorsByOrigin],
  (errors) => errors.length
);

