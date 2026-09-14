"use client";

import { useActionState } from "react";

import { loginAction } from "@/lib/auth/actions";
import { idleFormState } from "@/lib/utils/form-state";

import { InputField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginFormProps = {
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [state, action] = useActionState(loginAction, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}

      <InputField
        id="phone"
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0917 123 4567"
        defaultValue={values.phone}
        error={errors.phone}
        required
      />
      <InputField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
        required
      />

      <SubmitButton size="lg" className="w-full" pendingLabel="Logging in…">
        Log In
      </SubmitButton>
    </form>
  );
}
