"use client";

import { useActionState } from "react";

import { activateStationAction } from "@/lib/auth/station-actions";
import { idleFormState } from "@/lib/utils/form-state";

import { InputField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

export function StationActivateForm() {
  const [state, action] = useActionState(activateStationAction, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}
      {state.status === "success" ? <FormAlert tone="success">{state.message}</FormAlert> : null}

      <InputField
        id="name"
        label="Station name"
        placeholder="Registration Laptop"
        hint="A label so you can recognise this device in the list below."
        error={errors.name}
        required
      />
      <SubmitButton pendingLabel="Activating…">Activate this device</SubmitButton>
    </form>
  );
}
