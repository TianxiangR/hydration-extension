export enum MessageType {
  REACT_HYDRATION_FINISHED = 'react-hydration-finished',
}

export interface ReactHydrationFinishedMessage {
  type: MessageType.REACT_HYDRATION_FINISHED;
  data: {
    initialHtml: string;
    hydratedHtml: string;
  }
}