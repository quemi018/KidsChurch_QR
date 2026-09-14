"use client";

import { useActionState } from "react";

import { changePhoneAction } from "@/lib/member/actions";
import { idleFormState } from "@/lib/utils/form-state";

import { InputField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

export function PhoneChangeForm({ currentPhoneDisplay }: { currentPhoneDisplay: string }) {
  const [state, action] = useActionState(changePhoneAction, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}
      {state.status === "success" ? <FormAlert tone="success">{state.message}</FormAlert> : null}

      <p className="text-sm text-slate-600">
        Current number: <span className="font-medium text-slate-900">{currentPhoneDisplay}</span>
      </p>
      <InputField
        id="phone"
        label="New mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="0917 123 4567"
        defaultValue={values.phone}
        error={errors.phone}
        required
      />
      <InputField
        id="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        hint="Required because your mobile number is your login."
        error={errors.currentPassword}
        required
      />
      <SubmitButton variant="secondary" pendingLabel="Updating…">
        Change Mobile Number
      </SubmitButton>
    </form>
  );
}
