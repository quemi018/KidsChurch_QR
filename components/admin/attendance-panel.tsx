"use client";

import { useMemo, useState } from "react";

import type { AttendanceRow } from "@/lib/attendance/types";

import { Button } from "@/components/ui/button";

import { AttendanceTable } from "./attendance-table";
import type { LiveStatus } from "./use-live-attendance";

type AttendancePanelProps = {
  rows: AttendanceRow[];
  status: LiveStatus;
  onRefresh: () => void;
  title?: string;
  renderActions?: (row: AttendanceRow) => React.ReactNode;
};

const statusStyles: Record<LiveStatus, { label: string; className: string }> = {
  connecting: { label: "Connecting…", className: "bg-slate-200 text-slate-700" },
  live: { label: "Live", className: "bg-green-100 text-green-800" },
  reconnecting: { label: "Reconnecting…", className: "bg-amber-100 text-amber-900" },
  error: { label: "Offline", className: "bg-red-100 text-red-800" },
};

function normalizeDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("0") ? `63${digits.slice(1)}` : digits;
}

/** Client-side filter: child name, guardian name, or contact number (spec §20). */
function matches(row: AttendanceRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (row.child_name_snapshot.toLowerCase().includes(q)) return true;
  if (row.guardian_name_snapshot.toLowerCase().includes(q)) return true;
  const digits = normalizeDigits(q);
  return digits.length >= 3 && row.guardian_contact_snapshot.replace(/\D/g, "").includes(digits);
}

/** Live attendance: summary cards, search, connection status, table (spec §20, §21). */
export function AttendancePanel({
  rows,
  status,
  onRefresh,
  title = "Live attendance",
  renderActions,
}: AttendancePanelProps) {
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      total: rows.length,
      male: rows.filter((r) => r.child_gender_snapshot === "Male").length,
      female: rows.filter((r) => r.child_gender_snapshot === "Female").length,
    }),
    [rows],
  );
  const visible = useMemo(() => rows.filter((r) => matches(r, query)), [rows, query]);
  const pill = statusStyles[status];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total checked in" value={counts.total} tone="slate" />
        <SummaryCard label="Male" value={counts.male} tone="blue" />
        <SummaryCard label="Female" value={counts.female} tone="pink" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="attendance-search" className="sr-only">
            Search attendance
          </label>
          <input
            id="attendance-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search child, guardian, or contact"
            className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
          />
          <span
            role="status"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${pill.className}`}
          >
            {pill.label}
          </span>
          <Button variant="ghost" onClick={onRefresh} aria-label="Refresh attendance">
            Refresh
          </Button>
        </div>
      </div>

      {query && visible.length !== rows.length ? (
        <p className="text-sm text-slate-500">
          Showing {visible.length} of {rows.length}
        </p>
      ) : null}

      <AttendanceTable
        rows={visible}
        emptyMessage={
          query ? "No check-ins match that search." : "No check-ins yet for this session."
        }
        renderActions={renderActions}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "blue" | "pink";
}) {
  const tones = {
    slate: "border-slate-200 bg-white",
    blue: "border-blue-200 bg-blue-50",
    pink: "border-pink-200 bg-pink-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
