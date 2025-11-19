import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAppStatus, setActiveErrorId, setCurrentError } from '../store/slices/uiSlice';
import { hydrationErrorStorageService } from '../storage';
import { HydrationErrorFull } from '../store/types';
import { selectInitialized } from '../store/selectors';
import { devToolsConnection } from '../devtools/connection';
import { MessageType } from '../types/message';
import { PageStatus } from '../types/page';

/**
 * Hook for current page hydration status
 * - Listens to background messages via DevTools connection singleton
 * - Updates Redux state (appStatus, currentError)
 * - Saves errors to storage
 * - Runs globally in the app background
 */
export const useCurrentPageHydrationStatus = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectInitialized);

  useEffect(() => {
    if (!initialized) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = async (message: any) => {
      console.log('message received in useCurrentPageHydrationStatus', message);
      
      if (message.type === MessageType.DEVTOOLS_STATUS_UPDATE) {
        const { status, currentError } = message.data;
        
        // Map PageStatus to appStatus
        switch (status) {
          case PageStatus.LOADING: {
            dispatch(setAppStatus('loading'));
            dispatch(setActiveErrorId(null)); // Clear active error on page reload
            dispatch(setCurrentError(null)); // Clear current error on page reload
            break;
          }
          case PageStatus.REACT_DETECTED: {
            dispatch(setAppStatus('react-detected'));
            break;
          }
          case PageStatus.CHECKING_HYDRATION: {
            dispatch(setAppStatus('checking-hydration'));
            break;
          }
          case PageStatus.NO_REACT_DETECTED: {
            dispatch(setAppStatus('no-react'));
            break;
          }
          case PageStatus.HYDRATION_COMPLETE: {
            if (currentError && currentError.isEqual === false && currentError.diff) {
              // Create error data
              const errorData: HydrationErrorFull = {
                id: currentError.id!,
                url: currentError.url!,
                timestamp: currentError.timestamp!,
                origin: new URL(currentError.url!).origin,
                brief: currentError.initialRoot!.substring(0, 100),
                initialHtml: currentError.initialHtml!,
                postHydrationHtml: currentError.postHydrationHtml!,
                diffResult: {
                  initialRoot: currentError.initialRoot!,
                  hydratedRoot: currentError.hydratedRoot!,
                  diff: currentError.diff,
                },
              };
              
              // Store in Redux state for current page display (isolated copy)
              dispatch(setCurrentError(errorData));
              
              // Save to storage (service will update Redux)
              await hydrationErrorStorageService.addError(errorData);
              
              // Set as active error
              dispatch(setActiveErrorId(errorData.id));
            } else {
              dispatch(setCurrentError(null));
            }
            
            // Update status
            dispatch(setAppStatus('hydration-complete'));
            break;
          }
        }
      }
    };
    
    // Register message listener using singleton
    const unsubscribe = devToolsConnection.addMessageListener(handler);
    console.log('Message listener registered for hydration status');

    // Cleanup: unsubscribe from messages
    return () => {
      unsubscribe();
      console.log('Message listener removed for hydration status');
    };
  }, [dispatch, initialized]);
};

