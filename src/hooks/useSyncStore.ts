import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectInitialized } from '../store/selectors';
import { setOrigin, loadErrors, setInitialized } from '../store/slices/errorsSlice';
import { hydrationErrorStorageService } from '../storage';

/**
 * Hook to sync Redux store with IndexDB
 * Loads persisted error data from IndexDB into Redux on mount
 */
export const useSyncStore = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectInitialized);

  useEffect(() => {
    // Only initialize once
    if (initialized) {
      console.log('Store already initialized');
      return;
    }

    const initStore = async () => {
      try {
        // Get the origin from the inspected window
        chrome.devtools.inspectedWindow.eval(
          'window.location.origin',
          async (result, isException) => {
            if (isException) {
              console.error('Failed to get origin from inspected window:', result);
              return;
            }

            const origin = result as unknown as string;
            console.log('Initializing store for origin:', origin);

            try {
              // Set origin in Redux
              dispatch(setOrigin(origin));

              // Initialize storage service with origin
              await hydrationErrorStorageService.init(origin);

              // Load errors from IndexDB
              const errors = await hydrationErrorStorageService.getErrorsList();
              
              // Update Redux with loaded errors
              dispatch(loadErrors(errors));
              
              // Mark as initialized
              dispatch(setInitialized(true));

              console.log('✅ Store initialized from IndexDB');
            } catch (error) {
              console.error('Error during store initialization:', error);
              // Even if there's an error, mark as initialized to prevent retry loop
              dispatch(setInitialized(true));
            }
          }
        );
      } catch (error) {
        console.error('Failed to initialize store:', error);
      }
    };

    initStore();
  }, [dispatch, initialized]);
};

