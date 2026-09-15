/** Shapes shared between the check-in endpoint and the scanner UI (client-safe). */

export type CheckedInChild = { name: string; age: number; gender: string };
/** contact is the guardian phone in E.164; format for display with formatPhilippineMobile. */
export type CheckedInGuardian = { name: string; relationship: string | null; contact: string };

export type CheckInResult =
  | {
      status: "checked_in";
      attendanceId: string;
      childId: string;
      child: CheckedInChild;
      guardian: CheckedInGuardian;
      checkedInAt: string;
    }
  | { status: "already_checked_in"; child: CheckedInChild; checkedInAt: string }
  | { status: "invalid_qr" }
  | { status: "unknown_qr" }
  | { status: "inactive_child" }
  | { status: "no_open_session" }
  | { status: "unauthorized" }
  | { status: "error" };

/** One attendance row as shown in the live table / history (snapshot values). */
export type AttendanceRow = {
  id: string;
  checked_in_at: string;
  child_id: string;
  child_name_snapshot: string;
  child_age_snapshot: number;
  child_gender_snapshot: string;
  guardian_name_snapshot: string;
  guardian_relationship_snapshot: string | null;
  guardian_contact_snapshot: string;
};

export const ATTENDANCE_ROW_COLUMNS =
  "id, checked_in_at, child_id, child_name_snapshot, child_age_snapshot, child_gender_snapshot, guardian_name_snapshot, guardian_relationship_snapshot, guardian_contact_snapshot";
