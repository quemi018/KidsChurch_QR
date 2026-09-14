type FormAlertProps = {
  tone: "error" | "success" | "info" | "warning";
  title?: string;
  children: React.ReactNode;
};

const tones: Record<FormAlertProps["tone"], string> = {
  error: "border-red-300 bg-red-50 text-red-800",
  success: "border-green-300 bg-green-50 text-green-800",
  info: "border-blue-300 bg-blue-50 text-blue-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
};

/** High-contrast status block for forms and pages. */
export function FormAlert({ tone, title, children }: FormAlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
