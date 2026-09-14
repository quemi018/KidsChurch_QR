import Link from "next/link";

import { calculateAge } from "@/lib/utils/age";
import type { FormState } from "@/lib/utils/form-state";

import { SendQrEmailButton } from "@/components/qr/send-qr-email-button";

type ChildCardProps = {
  child: { id: string; full_name: string; gender: string; birthday: string; is_active: boolean };
  /** Bound resend action; only provided when the guardian has an email on file. */
  resendAction?: () => Promise<FormState>;
};

const linkClass =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4";

/** Member dashboard card (spec §10, §30). No delete/archive control for guardians. */
export function ChildCard({ child, resendAction }: ChildCardProps) {
  const age = calculateAge(child.birthday);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{child.full_name}</h2>
          <p className="text-slate-600">
            Age {age} • {child.gender}
          </p>
        </div>
        {!child.is_active ? (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
            Inactive
          </span>
        ) : null}
      </div>

      {child.is_active ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/member/children/${child.id}/qr`}
            className={`${linkClass} bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300`}
          >
            View QR
          </Link>
          <Link
            href={`/member/children/${child.id}/edit`}
            className={`${linkClass} border-2 border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus-visible:ring-slate-300`}
          >
            Edit Child
          </Link>
          {resendAction ? <SendQrEmailButton action={resendAction} /> : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-900">
          This record is inactive. Please ask an Admin for assistance.
        </p>
      )}
    </article>
  );
}
