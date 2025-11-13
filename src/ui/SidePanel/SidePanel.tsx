import { useMemo, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectErrorsByOrigin, selectActiveErrorId } from '../../store/selectors';
import { setActiveErrorId, setActiveTab } from '../../store/slices/uiSlice';
import { hydrationErrorStorageService } from '../../storage';
import { getRelativeUrl } from '../../utils/url';
import { formatTimestampRelative } from '../../utils/time';
import './SidePanel.css';

export const SidePanel = () => {
  const dispatch = useAppDispatch();
  const errors = useAppSelector(selectErrorsByOrigin);
  const activeErrorId = useAppSelector(selectActiveErrorId);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute to refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every 1 minute

    return () => clearInterval(interval);
  }, []);

  // Sort and filter errors
  // Depends on currentTime to trigger re-render for timestamp updates
  const sortedErrors = useMemo(() => {
    const sorted = [...errors].sort((a, b) => b.timestamp - a.timestamp);
    
    // Filter by search query
    if (!searchQuery.trim()) {
      return sorted;
    }
    
    const query = searchQuery.toLowerCase();
    return sorted.filter(error => {
      const relativeUrl = getRelativeUrl(error.url).toLowerCase();
      const brief = error.brief.toLowerCase();
      const uuid = error.id.toLowerCase();
      
      return relativeUrl.includes(query) || 
             brief.includes(query) || 
             uuid.includes(query);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors, searchQuery, currentTime]); // Added currentTime to refresh timestamps

  // Handle error selection
  const handleSelectError = (id: string) => {
    dispatch(setActiveErrorId(id));
    dispatch(setActiveTab('existing-errors')); // Switch to existing errors tab
  };

  // Handle error deletion
  const handleDeleteError = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selection when deleting
    
    // Remove from storage (service handles Redux update)
    await hydrationErrorStorageService.removeError(id);
    
    // Clear active if it was the deleted error
    if (activeErrorId === id) {
      dispatch(setActiveErrorId(null));
    }
  };

  // Truncate UUID for display
  const truncateUuid = (uuid: string): string => {
    return uuid.slice(0, 8);
  };

  if (sortedErrors.length === 0) {
    return (
      <div className="side-panel">
        <div className="side-panel-header">
          <h2 className="side-panel-title">Hydration Errors</h2>
          <div className="error-count">0 errors</div>
        </div>
        <div className="side-panel-empty">
          <div className="empty-icon">✓</div>
          <div className="empty-text">No hydration errors detected</div>
          <div className="empty-subtext">Errors will appear here as they occur</div>
        </div>
      </div>
    );
  }

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h2 className="side-panel-title">Hydration Errors</h2>
        <div className="error-count">
          {sortedErrors.length} {sortedErrors.length !== errors.length && `/ ${errors.length} `}
          error{errors.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="side-panel-search">
        <input
          type="text"
          className="search-input"
          placeholder="Search by URL, HTML, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="side-panel-list">
        {sortedErrors.length === 0 && searchQuery ? (
          <div className="side-panel-empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No results found</div>
            <div className="empty-subtext">Try a different search term</div>
          </div>
        ) : (
          sortedErrors.map((error) => (
            <div
              key={error.id}
              className={`error-item ${activeErrorId === error.id ? 'active' : ''}`}
              onClick={() => handleSelectError(error.id)}
            >
              <div className="error-item-content">
                <div className="error-item-url" title={error.url}>
                  {getRelativeUrl(error.url)}
                </div>
                
                <div className="error-item-brief" title={error.brief}>
                  {error.brief}
                </div>
                
                <div className="error-item-meta">
                  <span className="error-item-uuid" title={error.id}>
                    {truncateUuid(error.id)}
                  </span>
                  <span className="error-item-time">
                    {formatTimestampRelative(error.timestamp)}
                  </span>
                </div>
              </div>
              
            <button
              className="error-item-delete"
              onClick={(e) => handleDeleteError(error.id, e)}
              aria-label="Delete error"
              title="Delete this error"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

