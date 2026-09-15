"use client";

import { useState } from "react";

import { removeAttendanceAction } from "@/lib/admin/attendance-actions";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

type RemoveAttendanceButtonProps = {
  attendanceId: string;
  childName: string;
};

/** Two-step removal of an incorrect attendance record (spec §7.2, §47). */
export function RemoveAttendanceButton({ attendanceId, childName }: RemoveAttendanceButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="ghost" className="text-red-700" onClick={() => setConfirming(true)}>
        Remove
      </Button>
    );
  }

  return (
    <form action={removeAttendanceAction} className="flex items-center justify-end gap-2">
      <input type="hidden" name="attendanceId" value={attendanceId} />
      <span className="text-xs text-red-800">Remove {childName}?</span>
      <SubmitButton variant="danger" pendingLabel="Removing…">
        Yes
      </SubmitButton>
      <Button variant="secondary" onClick={() => setConfirming(false)}>
        No
      </Button>
    </form>
  );
}
