import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, AppStatus, ActiveTab, HydrationErrorFull } from '../types';

const initialState: UIState = {
  activeErrorId: null,
  sidePanelExpanded: true,
  appStatus: 'idle',
  activeTab: 'current-website',
  currentError: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Set the active error ID
    setActiveErrorId: (state, action: PayloadAction<string | null>) => {
      state.activeErrorId = action.payload;
    },
    
    // Toggle side panel
    toggleSidePanel: (state) => {
      state.sidePanelExpanded = !state.sidePanelExpanded;
    },
    
    // Set side panel expanded state
    setSidePanelExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidePanelExpanded = action.payload;
    },
    
    // Set app status
    setAppStatus: (state, action: PayloadAction<AppStatus>) => {
      state.appStatus = action.payload;
    },
    
    // Set active tab
    setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
      state.activeTab = action.payload;
    },
    
    // Set current error (isolated copy for current page)
    setCurrentError: (state, action: PayloadAction<HydrationErrorFull | null>) => {
      state.currentError = action.payload;
    },
  },
});

export const {
  setActiveErrorId,
  toggleSidePanel,
  setSidePanelExpanded,
  setAppStatus,
  setActiveTab,
  setCurrentError,
} = uiSlice.actions;

export default uiSlice.reducer;

