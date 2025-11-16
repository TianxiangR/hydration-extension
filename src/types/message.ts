export enum MessageType {
  REACT_HYDRATION_FINISHED = 'react-hydration-finished',
  PAGE_LOADING = 'page-loading',
  REACT_DETECTED = 'react-detected',
  CHECKING_HYDRATION = 'checking-hydration',
  NO_REACT_DETECTED = 'no-react-detected',
  DEVTOOLS_READY = 'devtools-ready',
  DEVTOOLS_STATUS_UPDATE = 'devtools-status-update',
}

export interface ReactHydrationFinishedMessage {
  type: MessageType.REACT_HYDRATION_FINISHED;
  data: {
    initialHtml: string;
    hydratedHtml: string;
  }
}