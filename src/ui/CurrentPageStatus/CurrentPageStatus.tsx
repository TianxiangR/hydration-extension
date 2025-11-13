import { useAppSelector } from '../../store/hooks';
import { selectAppStatus, selectCurrentError } from '../../store/selectors';
import { HydrationDiffViewer } from '../HydrationDiffViewer/HydrationDiffViewer';
import { getRelativeUrl } from '../../utils/url';
import './CurrentPageStatus.css';

export const CurrentPageStatus = () => {
  const appStatus = useAppSelector(selectAppStatus);
  const currentError = useAppSelector(selectCurrentError); // Read from Redux

  const renderContent = () => {
    switch (appStatus) {
      case 'idle':
        return (
          <div className="status-message status-info">
            <span className="status-icon">ℹ️</span>
            <div>
              <div className="status-text">Initializing...</div>
              <div className="status-subtext">Waiting for page to load</div>
            </div>
          </div>
        );

      case 'loading':
        return (
          <div className="status-message status-loading">
            <span className="status-icon">
              <div className="spinner"></div>
            </span>
            <div>
              <div className="status-text">Page Loading...</div>
              <div className="status-subtext">Detecting React framework</div>
            </div>
          </div>
        );

      case 'react-detected':
        return (
          <div className="status-message status-info">
            <span className="status-icon">⚛️</span>
            <div>
              <div className="status-text">React Detected!</div>
              <div className="status-subtext">Monitoring hydration process</div>
            </div>
          </div>
        );

      case 'checking-hydration':
        return (
          <div className="status-message status-loading">
            <span className="status-icon">
              <div className="spinner"></div>
            </span>
            <div>
              <div className="status-text">Checking Hydration...</div>
              <div className="status-subtext">Comparing SSR and client HTML</div>
            </div>
          </div>
        );

      case 'no-react':
        return (
          <div className="status-message status-info">
            <span className="status-icon">❌</span>
            <div>
              <div className="status-text">No React Detected</div>
              <div className="status-subtext">This page doesn't appear to use React</div>
            </div>
          </div>
        );

      case 'hydration-complete':
        if (currentError) {
          return (
            <>
              <div className="current-page-header">
                <div className="header-badge header-badge-error">⚠️ Hydration Error</div>
                <div className="header-info">
                  <div className="header-label">Current Page</div>
                  <div className="header-url" title={currentError.url}>
                    {getRelativeUrl(currentError.url)}
                  </div>
                </div>
              </div>

              <HydrationDiffViewer errorData={currentError} />
            </>
          );
        } else {
          return (
            <div className="status-message status-success">
              <span className="status-icon">✅</span>
              <div>
                <div className="status-text">Hydration Successful!</div>
                <div className="status-subtext">SSR and client HTML match perfectly</div>
              </div>
            </div>
          );
        }
      
      default:
        return null;
    }
  };

  return <>{renderContent()}</>;
};

