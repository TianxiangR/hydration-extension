import { useEffect } from 'react';
import { HydrationMessage, ReactHydrationFinishedMessage } from '../content';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAppStatus, setActiveErrorId, setCurrentError } from '../store/slices/uiSlice';
import { hydrationErrorStorageService } from '../storage';
import { HydrationErrorFull } from '../store/types';
import { selectInitialized } from '../store/selectors';
import { devToolsConnection } from '../devtools/connection';

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

    const handler = async (message: HydrationMessage) => {
      console.log('message received in useCurrentPageHydrationStatus', message);
      switch (message?.type) {
        case 'page-loading': {
          dispatch(setAppStatus('loading'));
          dispatch(setActiveErrorId(null)); // Clear active error on page reload
          dispatch(setCurrentError(null)); // Clear current error on page reload
          break;
        }
        case 'react-detected': {
          dispatch(setAppStatus('react-detected'));
          break;
        }
        case 'checking-hydration': {
          dispatch(setAppStatus('checking-hydration'));
          break;
        }
        case 'no-react-detected': {
          dispatch(setAppStatus('no-react'));
          break;
        }
        case 'react-hydration-finished': {
          const hydrationMessage = message as ReactHydrationFinishedMessage;
          if (hydrationMessage.data.isEqual === false && hydrationMessage.data.diff) {
            // Create error data
            const errorData: HydrationErrorFull = {
              id: hydrationMessage.data.id!,
              url: hydrationMessage.data.url!,
              timestamp: hydrationMessage.data.timestamp!,
              origin: new URL(hydrationMessage.data.url!).origin,
              brief: hydrationMessage.data.initialRoot!.substring(0, 100),
              initialHtml: hydrationMessage.data.initialHtml!,
              postHydrationHtml: hydrationMessage.data.postHydrationHtml!,
              diffResult: {
                initialRoot: hydrationMessage.data.initialRoot!,
                hydratedRoot: hydrationMessage.data.hydratedRoot!,
                diff: hydrationMessage.data.diff,
              },
            };
            
            // Store in Redux state for current page display (isolated copy)
            dispatch(setCurrentError(errorData));
            
            // Save to storage (service will update Redux)
            await hydrationErrorStorageService.addError(errorData);
            
            // Set as active error
            dispatch(setActiveErrorId(errorData.id));
            
            // Update status
            dispatch(setAppStatus('hydration-complete'));
          } else {
            dispatch(setCurrentError(null));
            dispatch(setAppStatus('hydration-complete'));
          }
          break;
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

