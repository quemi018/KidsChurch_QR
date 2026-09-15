"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AttendanceRow, CheckInResult } from "@/lib/attendance/types";

import { AttendanceTable } from "./attendance-table";
import { ScanResultCard, type ScanDisplayState } from "./scan-result-card";

type ScannerConsoleProps = {
  sessionOpen: boolean;
  initialRows: AttendanceRow[];
  initialCount: number;
};

/** Ignore an identical payload arriving within this window (scanner double-trigger). */
const DUPLICATE_SCAN_WINDOW_MS = 2500;

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("button, a, input, select, textarea, [role='button'], [contenteditable]"),
  );
}

/** Short audio cue so a volunteer can look at the child, not the screen. Best-effort. */
function beep(kind: "success" | "warning" | "error") {
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tones = kind === "success" ? [880] : kind === "warning" ? [440, 440] : [220];
    let at = ctx.currentTime;
    for (const freq of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, at);
      osc.start(at);
      osc.stop(at + (kind === "error" ? 0.3 : 0.12));
      at += 0.18;
    }
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio is optional.
  }
}

function rowFromResult(result: Extract<CheckInResult, { status: "checked_in" }>): AttendanceRow {
  return {
    id: result.attendanceId,
    checked_in_at: result.checkedInAt,
    child_id: result.childId,
    child_name_snapshot: result.child.name,
    child_age_snapshot: result.child.age,
    child_gender_snapshot: result.child.gender,
    guardian_name_snapshot: result.guardian.name,
    guardian_relationship_snapshot: result.guardian.relationship,
    guardian_contact_snapshot: result.guardian.contact,
  };
}

/**
 * USB scanner console (spec §16, §31). The scanner acts as a keyboard: it
 * types the payload into the focused input and sends Enter. This component
 * keeps that input focused, submits on Enter, clears it, debounces double
 * fires, queues back-to-back scans, and shows the outcome prominently.
 */
export function ScannerConsole({ sessionOpen, initialRows, initialCount }: ScannerConsoleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<string[]>([]);
  const busyRef = useRef(false);
  const lastScanRef = useRef<{ payload: string; at: number } | null>(null);

  const [display, setDisplay] = useState<ScanDisplayState>({ kind: "idle" });
  const [rows, setRows] = useState<AttendanceRow[]>(initialRows);
  const [count, setCount] = useState(initialCount);
  const [focused, setFocused] = useState(false);

  const focusInput = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Keep the scanner input focused: on mount, when the window regains focus,
  // and after clicks on non-interactive parts of the page.
  useEffect(() => {
    focusInput();
    const onWindowFocus = () => focusInput();
    const onPointerDown = (event: PointerEvent) => {
      if (!isInteractive(event.target)) {
        // Let the click land, then reclaim focus.
        setTimeout(focusInput, 0);
      }
    };
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [focusInput]);

  const processQueue = useCallback(async () => {
    if (busyRef.current) return;
    const payload = queueRef.current.shift();
    if (payload === undefined) return;
    busyRef.current = true;
    setDisplay({ kind: "processing" });

    try {
      const response = await fetch("/api/admin/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPayload: payload }),
        cache: "no-store",
      });
      const result = (await response.json()) as CheckInResult;

      if (result.status === "checked_in") {
        setRows((current) => [rowFromResult(result), ...current]);
        setCount((current) => current + 1);
        beep("success");
      } else if (result.status === "already_checked_in") {
        beep("warning");
      } else {
        beep("error");
      }
      setDisplay({ kind: "result", result });
    } catch {
      // Never show a false success: the write may not have happened.
      beep("error");
      setDisplay({ kind: "network_error" });
    } finally {
      busyRef.current = false;
      focusInput();
      if (queueRef.current.length) void processQueue();
    }
  }, [focusInput]);

  const submitScan = useCallback(
    (raw: string) => {
      const payload = raw.trim();
      if (!payload) return;

      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.payload === payload && now - last.at < DUPLICATE_SCAN_WINDOW_MS) return;
      lastScanRef.current = { payload, at: now };

      queueRef.current.push(payload);
      void processQueue();
    },
    [processQueue],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="scan-input" className="block text-sm font-medium text-slate-700">
          Scanner input
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            ref={inputRef}
            id="scan-input"
            type="text"
            inputMode="none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={!sessionOpen}
            placeholder={sessionOpen ? "Scanner ready…" : "Open a session to start scanning"}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 focus:outline-none disabled:opacity-60"
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              // If focus fell to nothing (e.g. clicked empty space), take it back.
              setTimeout(() => {
                if (document.activeElement === document.body) focusInput();
              }, 50);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const value = event.currentTarget.value;
              event.currentTarget.value = "";
              submitScan(value);
            }}
          />
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              !sessionOpen
                ? "bg-slate-200 text-slate-600"
                : focused
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-900"
            }`}
          >
            {!sessionOpen ? "Scanner off" : focused ? "Scanner ready" : "Click here to re-arm"}
          </span>
        </div>
      </div>

      <ScanResultCard state={display} />

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Live attendance</h2>
        <p className="text-lg">
          Today&apos;s attendance: <span className="text-2xl font-bold">{count}</span>
        </p>
      </div>
      <AttendanceTable rows={rows} emptyMessage="No check-ins yet for this session." />
    </div>
  );
}
