"use client";

import { useActionState } from "react";

import { openSessionAction } from "@/lib/admin/session-actions";
import { idleFormState } from "@/lib/utils/form-state";

import { InputField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

type OpenSessionFormProps = {
  defaultName: string;
  /** Today's date (YYYY-MM-DD) in Asia/Manila. */
  defaultDate: string;
};

export function OpenSessionForm({ defaultName, defaultDate }: OpenSessionFormProps) {
  const [state, action] = useActionState(openSessionAction, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}
      <InputField
        id="name"
        label="Session name"
        defaultValue={values.name ?? defaultName}
        error={errors.name}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="sessionDate"
          label="Date"
          type="date"
          defaultValue={values.sessionDate ?? defaultDate}
          error={errors.sessionDate}
          required
        />
        <InputField
          id="serviceTime"
          label="Service time (optional)"
          type="time"
          defaultValue={values.serviceTime}
          error={errors.serviceTime}
        />
      </div>
      <SubmitButton size="lg" pendingLabel="Opening…">
        Open Session
      </SubmitButton>
    </form>
  );
}
