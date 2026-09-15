"use client";

import type { AttendanceRow } from "@/lib/attendance/types";

import { AttendancePanel } from "./attendance-panel";
import { useLiveAttendance } from "./use-live-attendance";
import { useSessionChangeRefresh } from "./use-session-change-refresh";

type LiveAttendanceDashboardProps = {
  sessionId: string;
  initialRows: AttendanceRow[];
};

/** Admin dashboard live view: same subscription as the scanner, on any Admin device. */
export function LiveAttendanceDashboard({ sessionId, initialRows }: LiveAttendanceDashboardProps) {
  const { rows, status, refresh } = useLiveAttendance({ sessionId, initialRows });
  useSessionChangeRefresh();

  return <AttendancePanel rows={rows} status={status} onRefresh={() => void refresh()} />;
}
