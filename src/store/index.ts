import { configureStore } from '@reduxjs/toolkit';
import errorsReducer from './slices/errorsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    errors: errorsReducer,
    ui: uiReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

