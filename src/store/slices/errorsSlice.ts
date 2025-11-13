import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ErrorsState, HydrationErrorBasic } from '../types';

const initialState: ErrorsState = {
  errors: [],
  origin: null,
  initialized: false,
};

const errorsSlice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    // Add a new error
    addError: (state, action: PayloadAction<HydrationErrorBasic>) => {
      // Check if error with this ID already exists
      const exists = state.errors.some(error => error.id === action.payload.id);
      if (!exists) {
        state.errors.push(action.payload);
      }
    },
    
    // Remove a specific error
    removeError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter(error => error.id !== action.payload);
    },
    
    // Clear all errors
    clearAllErrors: (state) => {
      state.errors = [];
    },
    
    // Set current origin (for filtering errors by origin)
    setOrigin: (state, action: PayloadAction<string>) => {
      state.origin = action.payload;
    },
    
    // Load errors from persistence (used when initializing)
    loadErrors: (state, action: PayloadAction<HydrationErrorBasic[]>) => {
      state.errors = action.payload;
    },
    
    // Set initialized flag
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
  },
});

export const {
  addError,
  removeError,
  clearAllErrors,
  setOrigin,
  loadErrors,
  setInitialized,
} = errorsSlice.actions;

export default errorsSlice.reducer;

