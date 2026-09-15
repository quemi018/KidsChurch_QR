import Link from "next/link";
import { notFound } from "next/navigation";

import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils/age";
import { formatCalendarDate } from "@/lib/utils/datetime";

import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Child" };

const linkClass =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4";

export default async function ChildPage({
  params,
  searchParams,
}: PageProps<"/member/children/[childId]">) {
  await requireMember();
  const { childId } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, gender, birthday, is_active")
    .eq("id", childId)
    .maybeSingle();
  if (!child) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/member" className="text-sm text-blue-700 underline-offset-4 hover:underline">
        ← My Children
      </Link>

      {query.created === "1" ? (
        <FormAlert tone="success" title="Child added.">
          Open <strong>View QR</strong> and save a photo or screenshot for check-in.
          {query.email === "sent" ? " We also emailed the QR code to you." : ""}
        </FormAlert>
      ) : null}
      {query.email === "failed" ? (
        <FormAlert tone="warning">
          We could not send the QR email. You can view it on screen and try sending it again.
        </FormAlert>
      ) : null}
      {query.updated === "1" ? (
        <FormAlert tone="success">Changes saved. The QR code stays the same.</FormAlert>
      ) : null}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold">{child.full_name}</h1>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Age</dt>
          <dd>{calculateAge(child.birthday)}</dd>
          <dt className="text-slate-500">Gender</dt>
          <dd>{child.gender}</dd>
          <dt className="text-slate-500">Birthday</dt>
          <dd>{formatCalendarDate(child.birthday)}</dd>
          <dt className="text-slate-500">Status</dt>
          <dd>{child.is_active ? "Active" : "Inactive — ask an Admin"}</dd>
        </dl>
        {child.is_active ? (
          <div className="flex flex-wrap gap-2">
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
          </div>
        ) : null}
      </section>
    </div>
  );
}
