"use client";

import { useState } from "react";

import { archiveChildAction, reactivateChildAction } from "@/lib/admin/children-actions";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

type ArchiveChildControlsProps = {
  childId: string;
  childName: string;
  isActive: boolean;
};

/** Archive / reactivate with an inline confirmation step (spec §47). */
export function ArchiveChildControls({ childId, childName, isActive }: ArchiveChildControlsProps) {
  const [confirming, setConfirming] = useState(false);

  if (!isActive) {
    return (
      <form action={reactivateChildAction}>
        <input type="hidden" name="childId" value={childId} />
        <SubmitButton variant="secondary" pendingLabel="Reactivating…">
          Reactivate Child
        </SubmitButton>
      </form>
    );
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Archive Child
      </Button>
    );
  }

  return (
    <form
      action={archiveChildAction}
      className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4"
    >
      <input type="hidden" name="childId" value={childId} />
      <p className="text-sm text-red-900">
        Archive <strong>{childName}</strong>? The QR code will stop working at check-in and the
        guardian will no longer be able to edit this child. Attendance history is kept, and an Admin
        can reactivate the record later.
      </p>
      <div className="flex gap-2">
        <SubmitButton variant="danger" pendingLabel="Archiving…">
          Yes, archive
        </SubmitButton>
        <Button variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
