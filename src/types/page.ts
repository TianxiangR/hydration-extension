export enum PageStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  REACT_DETECTED = 'react-detected',
  CHECKING_HYDRATION = 'checking-hydration',
  NO_REACT_DETECTED = 'no-react-detected',
  HYDRATION_COMPLETE = 'hydration-complete',
}