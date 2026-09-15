import type { AttendanceRow } from "@/lib/attendance/types";
import { formatDate, formatTime } from "@/lib/utils/datetime";
import { formatPhilippineMobile } from "@/lib/validation/phone";

type AttendanceTableProps = {
  rows: AttendanceRow[];
  emptyMessage?: string;
  /** Optional per-row trailing cell (e.g. an Admin "Remove" control). */
  renderActions?: (row: AttendanceRow) => React.ReactNode;
};

/**
 * Attendance table (spec §20). Date is always the first column; rows are
 * expected newest-first. Values are the check-in snapshots, never live data.
 */
export function AttendanceTable({ rows, emptyMessage, renderActions }: AttendanceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Time</th>
            <th className="px-3 py-3">Child</th>
            <th className="px-3 py-3 text-right">Age</th>
            <th className="px-3 py-3">Gender</th>
            <th className="px-3 py-3">Guardian</th>
            <th className="px-3 py-3">Relationship</th>
            <th className="px-3 py-3">Contact</th>
            <th className="px-3 py-3">Status</th>
            {renderActions ? <th className="px-3 py-3" /> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={renderActions ? 10 : 9} className="px-3 py-6 text-center text-slate-500">
                {emptyMessage ?? "No check-ins yet."}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.checked_in_at)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatTime(row.checked_in_at)}</td>
                <td className="px-3 py-2 font-medium">{row.child_name_snapshot}</td>
                <td className="px-3 py-2 text-right">{row.child_age_snapshot}</td>
                <td className="px-3 py-2">{row.child_gender_snapshot}</td>
                <td className="px-3 py-2">{row.guardian_name_snapshot}</td>
                <td className="px-3 py-2">{row.guardian_relationship_snapshot ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatPhilippineMobile(row.guardian_contact_snapshot)}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                    Checked In
                  </span>
                </td>
                {renderActions ? (
                  <td className="px-3 py-2 text-right">{renderActions(row)}</td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
