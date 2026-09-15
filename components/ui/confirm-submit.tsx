"use client";

import { useState } from "react";

import { Button, type ButtonProps } from "./button";
import { SubmitButton } from "./submit-button";

type ConfirmSubmitProps = {
  /** Server Action for the wrapped form. */
  action: (formData: FormData) => void | Promise<void>;
  /** Hidden fields submitted with the action. */
  fields: Record<string, string>;
  /** Button label before confirming, e.g. "Deactivate". */
  label: string;
  /** Question shown in the confirmation step. */
  question: string;
  confirmLabel?: string;
  variant?: ButtonProps["variant"];
};

/**
 * One-click actions that are sensitive get a second, inline step (spec §47)
 * without a modal: click → "Are you sure? [Yes] [No]".
 */
export function ConfirmSubmit({
  action,
  fields,
  label,
  question,
  confirmLabel = "Yes",
  variant = "danger",
}: ConfirmSubmitProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant={variant} onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className="text-sm text-slate-700">{question}</span>
      <SubmitButton variant={variant} pendingLabel="Working…">
        {confirmLabel}
      </SubmitButton>
      <Button variant="secondary" onClick={() => setConfirming(false)}>
        No
      </Button>
    </form>
  );
}
