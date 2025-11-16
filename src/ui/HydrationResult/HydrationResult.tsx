import { useEffect,  useState } from "react";
import { devToolPort } from "../../devtools";
import './HydrationResult.css';
import { ChangeObject } from "diff";
import { HydrationMessage } from "../../content";

type AppState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'react-detected' }
  | { status: 'checking-hydration' }
  | { status: 'no-react' }
  | { status: 'hydration-complete'; data: { initialRoot: string; hydratedRoot: string; diff: ChangeObject<string>[]; isEqual: boolean } };

export const HydrationResult = () => {
  const [appState, setAppState] = useState<AppState>({ status: 'idle' });
  const [iframeSrcs, setIframeSrcs]  = useState<{ initial: string, postHydration: string }>({ initial: '', postHydration: '' });

  // Message handler effect - only runs once on mount
  useEffect(() => {
    const handler = (message: HydrationMessage) => {
      console.log('message', message);
      switch (message?.type) {
        case 'page-loading': {
          // Reset everything when page reloads
          setAppState({ status: 'loading' });
          console.log('page-loading');
          break;
        }
        case 'react-detected': {
          setAppState({ status: 'react-detected' });
          break;
        }
        case 'checking-hydration': {
          setAppState({ status: 'checking-hydration' });
          break;
        }
        case 'no-react-detected': {
          setAppState({ status: 'no-react' });
          break;
        }
        case 'react-hydration-finished': {
          if (message.data.isEqual === false && message.data.diff) {
            setAppState({ 
              status: 'hydration-complete', 
              data: {
                initialRoot: message.data.initialRoot!,
                hydratedRoot: message.data.hydratedRoot!,
                diff: message.data.diff,
                isEqual: false
              }
            });
          } else {
            setAppState({ 
              status: 'hydration-complete', 
              data: {
                initialRoot: '',
                hydratedRoot: '',
                diff: [],
                isEqual: true
              }
            });
          }
          break;
        }
      }
    };
    
    // Add listener first
    devToolPort.onMessage.addListener(handler);
    
    // Then notify background that we're ready to receive messages
    devToolPort.postMessage({ type: 'devtools-ready' });
    console.log('DevTools panel ready, sent init message');
    
    return () => {
      devToolPort.onMessage.removeListener(handler);
    };
  }, []); // Empty dependencies - only run once

  // Cleanup old iframe URLs when state changes away from hydration-complete or to loading
  useEffect(() => {
    if (appState.status === 'loading' && (iframeSrcs.initial || iframeSrcs.postHydration)) {
      // Clean up old iframe sources when page reloads
      if (iframeSrcs.initial) {
        URL.revokeObjectURL(iframeSrcs.initial);
      }
      if (iframeSrcs.postHydration) {
        URL.revokeObjectURL(iframeSrcs.postHydration);
      }
      setIframeSrcs({ initial: '', postHydration: '' });
    }
  }, [appState.status, iframeSrcs.initial, iframeSrcs.postHydration]);

  // Create iframe blob URLs when hydration is complete with errors
  useEffect(() => {
    if (appState.status === 'hydration-complete' && appState.data.isEqual === false) {
      const initialHtmlBlob = new Blob([appState.data.initialRoot], { type: 'text/html' });
      const postHydrationHtmlBlob = new Blob([appState.data.hydratedRoot], { type: 'text/html' });
      const initialIframeSrc = URL.createObjectURL(initialHtmlBlob);
      const postHydrationIframeSrc = URL.createObjectURL(postHydrationHtmlBlob);
      setIframeSrcs({ initial: initialIframeSrc, postHydration: postHydrationIframeSrc });

      return () => {
        // Cleanup when component unmounts or when this effect re-runs
        URL.revokeObjectURL(initialIframeSrc);
        URL.revokeObjectURL(postHydrationIframeSrc);
      }
    }
  }, [appState]);

  const renderDiff = () => {
    if (appState.status !== 'hydration-complete' || appState.data.isEqual !== false || !appState.data.diff) {
      return null;
    }
    
    return (
      <div className="diff-section">
        <div className="diff-header">
          <h2 className="diff-title">📝 Code Diff</h2>
          <div className="diff-legend">
            <span className="legend-item added">+ Added</span>
            <span className="legend-item removed">- Removed</span>
            <span className="legend-item unchanged">Unchanged</span>
          </div>
        </div>
        <pre className="diff-container">
          {appState.data.diff.map((part: ChangeObject<string>, index: number) => {
            const className = part.added 
              ? 'diff-line added' 
              : part.removed 
              ? 'diff-line removed' 
              : 'diff-line unchanged';
            
            return (
              <div key={index} className={className}>
                {part.value.split('\n').map((line, lineIndex) => {
                  if (lineIndex === part.value.split('\n').length - 1 && line === '') {
                    return null;
                  }
                  const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                  return (
                    <div key={lineIndex} className="diff-line-content">
                      <span className="diff-prefix">{prefix}</span>
                      <span className="diff-text">{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </pre>
      </div>
    );
  };

  const renderContent = () => {
    switch (appState.status) {
      case 'idle':
        return (
          <div className="status-message info">
            <div className="status-icon">👀</div>
            <div className="status-text">Waiting for page to load...</div>
          </div>
        );
      
      case 'loading':
        return (
          <div className="status-message loading">
            <div className="spinner"></div>
            <div className="status-text">Page loading...</div>
          </div>
        );
      
      case 'react-detected':
        return (
          <div className="status-message success">
            <div className="status-icon">⚛️</div>
            <div className="status-text">React detected! Waiting for hydration...</div>
          </div>
        );
      
      case 'checking-hydration':
        return (
          <div className="status-message loading">
            <div className="spinner"></div>
            <div className="status-text">Checking hydration...</div>
          </div>
        );
      
      case 'no-react':
        return (
          <div className="status-message warning">
            <div className="status-icon">❌</div>
            <div className="status-text">No React detected on this page</div>
            <div className="status-subtext">This extension only works with React applications</div>
          </div>
        );
      
      case 'hydration-complete': {

        const hasError = appState.data.isEqual === false;
        return (
          <>
            {hasError ? (
              <div className="hydration-result-status error">
                ⚠️ Hydration Error Detected
              </div>
            ) : (
              <div className="hydration-result-status success">
                ✅ No hydration errors detected
              </div>
            )}

            {hasError && (
              <>
                {renderDiff()}
                
                <div className="comparison-grid">
                  <div className="comparison-section initial">
                    <div className="comparison-label">📄 Initial SSR HTML</div>
                    <iframe src={iframeSrcs.initial} className="comparison-iframe" />
                  </div>
                  
                  <div className="comparison-section hydrated">
                    <div className="comparison-label">💧 After Hydration</div>
                    <iframe src={iframeSrcs.postHydration} className="comparison-iframe" />
                  </div>
                </div>
              </>
            )}
          </>
        );
      }
    }
  };

  return (
    <div className="hydration-result-container">
      <h1 className="hydration-result-title">⚛️ React Hydration Checker</h1>
      {renderContent()}
    </div>
  );
}