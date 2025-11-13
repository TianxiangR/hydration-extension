import { ChangeObject } from "diff";

// Basic error info stored in Redux
export interface HydrationErrorBasic {
  id: string; // UUID
  url: string;
  timestamp: number;
  origin: string;
  brief: string; // First 100 characters from initialRoot
}

// Full error data stored in IndexDB
export interface HydrationErrorFull extends HydrationErrorBasic {
  initialHtml: string;
  postHydrationHtml: string;
  diffResult: {
    initialRoot: string;
    hydratedRoot: string;
    diff: ChangeObject<string>[]; // ChangeObject from diff library
  };
}

export interface ErrorsState {
  errors: HydrationErrorBasic[];
  origin: string | null; // Current origin for filtering
  initialized: boolean; // Whether data has been loaded from IndexDB
}

export type AppStatus = 
  | 'idle'
  | 'loading'
  | 'react-detected'
  | 'checking-hydration'
  | 'no-react'
  | 'hydration-complete';

export type ActiveTab = 'current-website' | 'existing-errors';

export interface UIState {
  activeErrorId: string | null;
  sidePanelExpanded: boolean;
  appStatus: AppStatus;
  activeTab: ActiveTab;
  currentError: HydrationErrorFull | null; // Isolated copy for current page
}

