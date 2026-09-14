"use client";

import { useActionState, useState } from "react";

import { idleFormState, type FormState } from "@/lib/utils/form-state";

import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

import { ChildFields } from "./child-fields";

type ChildFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: { fullName: string; gender: string; birthday: string };
  submitLabel: string;
  pendingLabel: string;
  maxBirthday: string;
};

const names = { fullName: "fullName", gender: "gender", birthday: "birthday" };

/** Add / edit a single child. Used by members and by Admins for corrections. */
export function ChildForm({
  action,
  initial,
  submitLabel,
  pendingLabel,
  maxBirthday,
}: ChildFormProps) {
  const [state, formAction] = useActionState(action, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : (initial ?? {});

  // Remount after a failed submit so the <select> keeps its value (see RegisterForm).
  const [formKey, setFormKey] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.status === "error") setFormKey((key) => key + 1);
  }

  return (
    <form key={formKey} action={formAction} className="space-y-6" noValidate>
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}
      <ChildFields names={names} values={values} errors={errors} maxBirthday={maxBirthday} />
      <SubmitButton size="lg" pendingLabel={pendingLabel}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
