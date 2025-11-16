import { useSyncStore } from "./useSyncStore";
import { useInitDevToolsConnection } from "./useInitDevToolsConnection";
import { useCurrentPageHydrationStatus } from "./useCurrentPageHydrationStatus";

export const useInitDevTool = () => {
  useSyncStore();
  useInitDevToolsConnection(); // Initialize DevTools connection
  useCurrentPageHydrationStatus(); // Run globally in background
}