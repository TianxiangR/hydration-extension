import { HydrationErrorFull, HydrationErrorBasic } from '../store/types';

// Storage key prefixes
export const STORAGE_KEYS = {
  ERRORS_LIST_PREFIX: 'errors_list_', // Prefix + origin = full key
  ERROR_DETAIL_PREFIX: 'error_detail_', // Prefix + UUID = full key
} as const;

// Helper functions to generate keys
export const getErrorsListKey = (origin: string): string => {
  return `${STORAGE_KEYS.ERRORS_LIST_PREFIX}${origin}`;
};

export const getErrorDetailKey = (id: string): string => {
  return `${STORAGE_KEYS.ERROR_DETAIL_PREFIX}${id}`;
};

// Generic storage interface with basic CRUD operations
export interface IStorage<T> {
  // Initialize storage
  init(): Promise<void>;
  
  // Basic CRUD operations
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Get all items
  getAll(): Promise<T[]>;
}

// High-level service interface for hydration errors
export interface IHydrationErrorService {
  // Initialize with origin
  init(origin: string): Promise<void>;
  
  // Add a new error (saves detail + updates list)
  addError(error: HydrationErrorFull): Promise<void>;
  
  // Get errors list for current origin
  getErrorsList(): Promise<HydrationErrorBasic[]>;
  
  // Get full error detail by ID
  getErrorDetail(id: string): Promise<HydrationErrorFull | null>;
  
  // Remove an error (removes detail + updates list)
  removeError(id: string): Promise<void>;
  
  // Clear all errors for current origin only
  clearAllErrors(): Promise<void>;
}

// Database schema
export interface StorageSchema {
  key: string;
  value: any;
  timestamp: number;
}

