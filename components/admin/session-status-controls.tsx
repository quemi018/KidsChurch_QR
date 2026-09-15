"use client";

import { useActionState, useState } from "react";

import { closeSessionAction, reopenSessionAction } from "@/lib/admin/session-actions";
import { idleFormState } from "@/lib/utils/form-state";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

type SessionStatusControlsProps = {
  sessionId: string;
  sessionName: string;
  status: "open" | "closed";
  checkedInCount: number;
};

/** Close (with confirmation) or reopen a session. */
export function SessionStatusControls({
  sessionId,
  sessionName,
  status,
  checkedInCount,
}: SessionStatusControlsProps) {
  const [confirming, setConfirming] = useState(false);
  const [reopenState, reopen] = useActionState(reopenSessionAction, idleFormState);

  if (status === "closed") {
    return (
      <div className="space-y-2">
        <form action={reopen}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <SubmitButton variant="secondary" pendingLabel="Reopening…">
            Reopen Session
          </SubmitButton>
        </form>
        {reopenState.status === "error" ? (
          <FormAlert tone="error">{reopenState.message}</FormAlert>
        ) : null}
      </div>
    );
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Close Session
      </Button>
    );
  }

  return (
    <form
      action={closeSessionAction}
      className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <p className="text-sm text-red-900">
        Close <strong>{sessionName}</strong> with {checkedInCount} checked in? No more scans can be
        recorded for it. You can reopen it later if needed.
      </p>
      <div className="flex gap-2">
        <SubmitButton variant="danger" pendingLabel="Closing…">
          Yes, close session
        </SubmitButton>
        <Button variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
