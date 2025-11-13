import { IndexDBStorage } from './baseStorage';
import { IHydrationErrorService } from './types';
import { HydrationErrorFull, HydrationErrorBasic } from '../store/types';
import { store } from '../store';
import { addError as addErrorToRedux, removeError as removeErrorFromRedux, clearAllErrors as clearAllErrorsFromRedux } from '../store/slices/errorsSlice';

// Type for errors list stored per origin
interface ErrorsList {
  origin: string;
  errors: HydrationErrorBasic[];
  timestamp: number;
}

/**
 * High-level service for managing hydration errors
 * Coordinates between error list storage and error detail storage
 */
class HydrationErrorStorageService implements IHydrationErrorService {
  private errorListStorage: IndexDBStorage<ErrorsList>;
  private errorDetailStorage: IndexDBStorage<HydrationErrorFull>;
  private currentOrigin: string = '';

  constructor() {
    // Storage for error lists (keyed by origin)
    this.errorListStorage = new IndexDBStorage<ErrorsList>(
      'hydration-extension',
      'errors_lists',
      'origin'
    );

    // Storage for error details (keyed by id/UUID)
    this.errorDetailStorage = new IndexDBStorage<HydrationErrorFull>(
      'hydration-extension',
      'error_details',
      'id'
    );
  }

  /**
   * Initialize both storages for the given origin
   */
  async init(origin: string): Promise<void> {
    this.currentOrigin = origin;
    
    // Initialize both storages in parallel
    await Promise.all([
      this.errorListStorage.init(),
      this.errorDetailStorage.init(),
    ]);

    console.log(`HydrationErrorService initialized for origin: ${origin}`);
  }

  /**
   * Add a new error - saves full detail, updates list, and updates Redux
   */
  async addError(error: HydrationErrorFull): Promise<void> {
    // 1. Save full error detail
    await this.errorDetailStorage.set(error.id, error);

    // 2. Get current errors list
    const errorsList = await this.errorListStorage.get(this.currentOrigin);
    const currentErrors = errorsList?.errors || [];

    // 3. Check if error already exists in list
    const exists = currentErrors.some(e => e.id === error.id);
    if (!exists) {
      const basicError: HydrationErrorBasic = {
        id: error.id,
        url: error.url,
        timestamp: error.timestamp,
        origin: error.origin,
        brief: error.diffResult.initialRoot.substring(0, 100),
      };

      // 4. Add basic info to list
      currentErrors.push(basicError);

      // 5. Save updated list
      await this.errorListStorage.set(this.currentOrigin, {
        origin: this.currentOrigin,
        errors: currentErrors,
        timestamp: Date.now(),
      });

      // 6. Update Redux
      store.dispatch(addErrorToRedux(basicError));
    }

    console.log(`Error ${error.id} added to storage`);
  }

  /**
   * Get errors list for current origin (does NOT update Redux)
   */
  async getErrorsList(): Promise<HydrationErrorBasic[]> {
    const errorsList = await this.errorListStorage.get(this.currentOrigin);
    const errors = errorsList?.errors || [];
    return errors;
  }

  /**
   * Get full error detail by ID
   */
  async getErrorDetail(id: string): Promise<HydrationErrorFull | null> {
    return await this.errorDetailStorage.get(id);
  }

  /**
   * Remove an error - removes detail, updates list, and updates Redux
   */
  async removeError(id: string): Promise<void> {
    // 1. Remove error detail
    await this.errorDetailStorage.remove(id);

    // 2. Get current errors list
    const errorsList = await this.errorListStorage.get(this.currentOrigin);
    if (!errorsList) return;

    // 3. Remove from list
    const updatedErrors = errorsList.errors.filter(e => e.id !== id);

    // 4. Save updated list
    await this.errorListStorage.set(this.currentOrigin, {
      origin: this.currentOrigin,
      errors: updatedErrors,
      timestamp: Date.now(),
    });

    // 5. Update Redux
    store.dispatch(removeErrorFromRedux(id));

    console.log(`Error ${id} removed from storage`);
  }

  /**
   * Clear all errors for current origin - removes details, clears list, and updates Redux
   */
  async clearAllErrors(): Promise<void> {
    // 1. Get current errors list
    const errorsList = await this.errorListStorage.get(this.currentOrigin);
    if (!errorsList) return;

    // 2. Remove all error details
    await Promise.all(
      errorsList.errors.map(error => this.errorDetailStorage.remove(error.id))
    );

    // 3. Clear the errors list for this origin
    await this.errorListStorage.set(this.currentOrigin, {
      origin: this.currentOrigin,
      errors: [],
      timestamp: Date.now(),
    });

    // 4. Update Redux
    store.dispatch(clearAllErrorsFromRedux());

    console.log(`All errors cleared for origin: ${this.currentOrigin}`);
  }
}

// Export singleton instance
export const hydrationErrorStorageService = new HydrationErrorStorageService();

