import { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSidePanelExpanded } from '../../store/selectors';
import { toggleSidePanel } from '../../store/slices/uiSlice';
import { SidePanel } from '../SidePanel/SidePanel';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const dispatch = useAppDispatch();
  const sidePanelExpanded = useAppSelector(selectSidePanelExpanded);

  const handleToggleSidePanel = () => {
    dispatch(toggleSidePanel());
  };

  return (
    <div className="layout">
      {/* Side Panel Container */}
      <div className="layout-side-panel">
        {/* Inner expandable panel */}
        <div className={`layout-side-panel-inner ${sidePanelExpanded ? 'expanded' : 'collapsed'}`}>
          {sidePanelExpanded && <SidePanel />}
        </div>
        
        {/* Toggle Button (sibling of inner panel) */}
        <button
          className="layout-toggle-btn"
          onClick={handleToggleSidePanel}
          title={sidePanelExpanded ? 'Collapse side panel' : 'Expand side panel'}
        >
          {sidePanelExpanded ? '◀' : '▶'}
        </button>
      </div>

      {/* Main Content */}
      <div className="layout-main-content">
        {children}
      </div>
    </div>
  );
};

