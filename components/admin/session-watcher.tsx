"use client";

import { useSessionChangeRefresh } from "./use-session-change-refresh";

/** Mount anywhere a page shows session state and has no live attendance panel. */
export function SessionWatcher() {
  useSessionChangeRefresh();
  return null;
}
