"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "./button";

type SubmitButtonProps = Omit<ButtonProps, "type"> & {
  pendingLabel?: string;
};

/** Submit button that disables itself while the form's Server Action is running. */
export function SubmitButton({
  children,
  pendingLabel = "Please wait…",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
