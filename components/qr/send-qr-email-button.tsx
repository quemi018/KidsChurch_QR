"use client";

import { useActionState } from "react";

import { idleFormState, type FormState } from "@/lib/utils/form-state";

import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

type SendQrEmailButtonProps = {
  /** A Server Action already bound to the child id. */
  action: () => Promise<FormState>;
  variant?: "primary" | "secondary";
};

/** "Send QR to Email" (spec §14): re-sends the existing QR; never generates a new one. */
export function SendQrEmailButton({ action, variant = "secondary" }: SendQrEmailButtonProps) {
  const [state, formAction] = useActionState(async () => action(), idleFormState);

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <SubmitButton variant={variant} pendingLabel="Sending…">
          Send QR to Email
        </SubmitButton>
      </form>
      {state.status === "success" ? <FormAlert tone="success">{state.message}</FormAlert> : null}
      {state.status === "error" ? <FormAlert tone="error">{state.message}</FormAlert> : null}
    </div>
  );
}
