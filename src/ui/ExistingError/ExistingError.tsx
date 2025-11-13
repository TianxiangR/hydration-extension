import { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectActiveErrorId } from '../../store/selectors';
import { hydrationErrorStorageService } from '../../storage';
import { HydrationErrorFull } from '../../store/types';
import { HydrationDiffViewer } from '../HydrationDiffViewer/HydrationDiffViewer';
import { getRelativeUrl } from '../../utils/url';
import { formatTimestampFull } from '../../utils/time';
import './ExistingError.css';

export const ExistingError = () => {
  const activeErrorId = useAppSelector(selectActiveErrorId);
  const [errorData, setErrorData] = useState<HydrationErrorFull | null>(null);

  // Load error details when activeErrorId changes
  useEffect(() => {
    if (activeErrorId) {
      hydrationErrorStorageService.getErrorDetail(activeErrorId).then(data => {
        setErrorData(data);
      });
    } else {
      setErrorData(null);
    }
  }, [activeErrorId]);


  if (!activeErrorId) {
    return (
      <div className="status-message status-info">
        <span className="status-icon">📋</span>
        <div>
          <div className="status-text">No Errors Available</div>
          <div className="status-subtext">No hydration errors have been detected yet. Navigate to pages with React to start checking.</div>
        </div>
      </div>
    );
  }

  if (!errorData) {
    return (
      <div className="status-message status-loading">
        <span className="status-icon">
          <div className="spinner"></div>
        </span>
        <div>
          <div className="status-text">Loading error details...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="existing-error-header">
        <div className="error-meta">
          <div className="error-meta-item">
            <span className="error-meta-label">Time:</span>
            <span className="error-meta-value">{formatTimestampFull(errorData.timestamp)}</span>
          </div>
          <div className="error-meta-item">
            <span className="error-meta-label">URL:</span>
            <span className="error-meta-value error-url" title={errorData.url}>
              {getRelativeUrl(errorData.url)}
            </span>
          </div>
          <div className="error-meta-item">
            <span className="error-meta-label">ID:</span>
            <span className="error-meta-value error-id" title={errorData.id}>
              {errorData.id}
            </span>
          </div>
        </div>
      </div>

      <HydrationDiffViewer errorData={errorData} />
    </>
  );
};

