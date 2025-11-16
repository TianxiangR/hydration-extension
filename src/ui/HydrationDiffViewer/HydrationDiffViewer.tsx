import { useEffect, useState, useMemo } from 'react';
import { ChangeObject } from 'diff';
import { HydrationErrorFull } from '../../store/types';
import { copyToClipboard } from '../../utils/clipboard';
import './HydrationDiffViewer.css';

interface HydrationDiffViewerProps {
  errorData: HydrationErrorFull;
}

export const HydrationDiffViewer = ({ errorData }: HydrationDiffViewerProps) => {
  const [iframeSrcs, setIframeSrcs] = useState<{ initial: string, postHydration: string }>({ initial: '', postHydration: '' });
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: 'idle' | 'success' | 'error' }>({});

  // Create iframe blob URLs
  useEffect(() => {
    if (errorData) {
      const initialHtmlBlob = new Blob([errorData.diffResult.initialRoot], { type: 'text/html' });
      const postHydrationHtmlBlob = new Blob([errorData.diffResult.hydratedRoot], { type: 'text/html' });
      const initialIframeSrc = URL.createObjectURL(initialHtmlBlob);
      const postHydrationIframeSrc = URL.createObjectURL(postHydrationHtmlBlob);
      
      setIframeSrcs({ initial: initialIframeSrc, postHydration: postHydrationIframeSrc });

      return () => {
        URL.revokeObjectURL(initialIframeSrc);
        URL.revokeObjectURL(postHydrationIframeSrc);
      };
    } else {
      setIframeSrcs({ initial: '', postHydration: '' });
    }
  }, [errorData]);

  const handleCopy = async (text: string, key: string) => {
    try {
      const success = await copyToClipboard(text);
      if (!success) {
        throw new Error('Failed to copy to clipboard');
      }
      setCopyStatus(prev => ({ ...prev, [key]: 'success' }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [key]: 'idle' }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyStatus(prev => ({ ...prev, [key]: 'error' }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [key]: 'idle' }));
      }, 2000);
    }
  };

  // Create blob URLs for downloading full HTML files
  const downloadUrls = useMemo(() => {
    if (!errorData) return { ssr: '', postHydration: '' };
    
    const ssrBlob = new Blob([errorData.initialHtml], { type: 'text/html' });
    const postHydrationBlob = new Blob([errorData.postHydrationHtml], { type: 'text/html' });
    
    return {
      ssr: URL.createObjectURL(ssrBlob),
      postHydration: URL.createObjectURL(postHydrationBlob)
    };
  }, [errorData]);

  // Cleanup download blob URLs
  useEffect(() => {
    return () => {
      if (downloadUrls.ssr) URL.revokeObjectURL(downloadUrls.ssr);
      if (downloadUrls.postHydration) URL.revokeObjectURL(downloadUrls.postHydration);
    };
  }, [downloadUrls]);

  const getCopyButtonText = (key: string, defaultText: string, successText?: string) => {
    const status = copyStatus[key];
    if (status === 'success') return successText || '✓ Copied';
    if (status === 'error') return '❌ Failed';
    return defaultText;
  };

  const renderDiff = () => {
    // Group consecutive diff parts of the same type
    const groupedDiffs: Array<{
      type: 'added' | 'removed' | 'unchanged';
      lines: string[];
    }> = [];

    errorData.diffResult.diff.forEach((part: ChangeObject<string>) => {
      const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
      const lines = part.value.split('\n').filter((line, index, arr) => {
        return index !== arr.length - 1 || line !== '';
      });

      const lastGroup = groupedDiffs[groupedDiffs.length - 1];
      if (lastGroup && lastGroup.type === type) {
        lastGroup.lines.push(...lines);
      } else {
        groupedDiffs.push({ type, lines });
      }
    });

    return (
      <div className="diff-section">
        <div className="diff-header">
          <h3 className="diff-title">Code Differences</h3>
          <div className="diff-legend">
            <span className="legend-item legend-added">+&nbsp;Added</span>
            <span className="legend-item legend-removed">-&nbsp;Removed</span>
            <span className="legend-item legend-unchanged">Unchanged</span>
          </div>
        </div>
        <div className="diff-container">
          <div className="diff-container-inner">
            {groupedDiffs.map((group, groupIndex) => {
              const groupClassName = `diff-group ${group.type}`;
              const prefix = group.type === 'added' ? '+ ' : group.type === 'removed' ? '- ' : '  ';

              return (
                <div key={groupIndex} className={groupClassName}>
                  {group.lines.map((line, lineIndex) => (
                    <div key={lineIndex} className="diff-line">
                      <span className="diff-prefix">{prefix}</span>
                      <span className="diff-text">{line}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hydration-diff-viewer">
      {renderDiff()}

      <div className="comparison-section">
        <h3 className="comparison-title">Side-by-Side Comparison</h3>
        <div className="comparison-container">
          <div className="comparison-panel">
            <div className="comparison-panel-header">
              <h4 className="comparison-panel-title">Initial SSR HTML</h4>
              <button
                className="copy-btn copy-btn-small"
                onClick={() => handleCopy(errorData.diffResult.initialRoot, 'initialRoot')}
                title="Copy Initial SSR HTML"
              >
                {getCopyButtonText('initialRoot', '📋 Copy')}
              </button>
            </div>
            <iframe
              className="comparison-iframe"
              src={iframeSrcs.initial}
              title="Initial HTML"
              sandbox="allow-same-origin"
            />
          </div>
          <div className="comparison-panel">
            <div className="comparison-panel-header">
              <h4 className="comparison-panel-title">Post-Hydration HTML</h4>
              <button
                className="copy-btn copy-btn-small"
                onClick={() => handleCopy(errorData.diffResult.hydratedRoot, 'hydratedRoot')}
                title="Copy Post-Hydration HTML"
              >
                {getCopyButtonText('hydratedRoot', '📋 Copy')}
              </button>
            </div>
            <iframe
              className="comparison-iframe"
              src={iframeSrcs.postHydration}
              title="Post Hydration HTML"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        <div className="full-html-actions">
          <a
            href={downloadUrls.ssr}
            download="ssr-html.html"
            className="copy-btn copy-btn-large"
          >
            💾 Download Full SSR HTML
          </a>
          <a
            href={downloadUrls.postHydration}
            download="post-hydration-html.html"
            className="copy-btn copy-btn-large"
          >
            💾 Download Full Post-Hydration HTML
          </a>
        </div>
      </div>
    </div>
  );
};

