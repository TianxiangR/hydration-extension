// Export main service (singleton)
export { hydrationErrorStorageService  } from './hydrationErrorStorageService';

// Export types for consumers
export type { IHydrationErrorService } from './types';

// Advanced exports (for custom implementations)
export { IndexDBStorage } from './baseStorage';
export type { IStorage } from './types';

