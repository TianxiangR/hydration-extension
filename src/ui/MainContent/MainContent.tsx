import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectActiveTab, selectActiveErrorId, selectErrorsByOrigin } from '../../store/selectors';
import { setActiveTab, setActiveErrorId } from '../../store/slices/uiSlice';
import { CurrentPageStatus } from '../CurrentPageStatus/CurrentPageStatus';
import { ExistingError } from '../ExistingError/ExistingError';
import './MainContent.css';

export const MainContent = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);
  const activeErrorId = useAppSelector(selectActiveErrorId);
  const errors = useAppSelector(selectErrorsByOrigin);

  // When switching to existing-errors tab with no active error, set the latest one
  useEffect(() => {
    if (activeTab === 'existing-errors' && !activeErrorId && errors.length > 0) {
      // Sort by timestamp and get the latest
      const latestError = [...errors].sort((a, b) => b.timestamp - a.timestamp)[0];
      dispatch(setActiveErrorId(latestError.id));
    }
  }, [activeTab, activeErrorId, errors, dispatch]);

  return (
    <div className="main-content-container">
      <h1 className="main-content-title">⚛️ React Hydration Checker</h1>
      
      {/* Tabs */}
      <div className="main-content-tabs">
        <button
          className={`tab-button ${activeTab === 'current-website' ? 'active' : ''}`}
          onClick={() => dispatch(setActiveTab('current-website'))}
        >
          Current Website
        </button>
        <button
          className={`tab-button ${activeTab === 'existing-errors' ? 'active' : ''}`}
          onClick={() => dispatch(setActiveTab('existing-errors'))}
        >
          Existing Errors
        </button>
      </div>

      {/* Tab content */}
      <div className="main-content-body">
        {activeTab === 'current-website' ? <CurrentPageStatus /> : <ExistingError />}
      </div>
    </div>
  );
};

