import Link from "next/link";
import { notFound } from "next/navigation";

import { adminResendQrEmailAction } from "@/lib/admin/children-actions";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils/age";
import { formatBirthday, formatDateTime } from "@/lib/utils/datetime";
import { formatPhilippineMobile } from "@/lib/validation/phone";

import { ArchiveChildControls } from "@/components/admin/archive-child-controls";
import { SendQrEmailButton } from "@/components/qr/send-qr-email-button";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Child Details" };

export default async function AdminChildPage({
  params,
  searchParams,
}: PageProps<"/admin/children/[childId]">) {
  const { childId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: child } = await supabase
    .from("children")
    .select(
      "id, full_name, gender, birthday, is_active, archived_at, created_at, guardian:profiles!children_guardian_id_fkey(id, full_name, phone, email, guardian_relationship, guardian_relationship_other, is_active), archiver:profiles!children_archived_by_fkey(full_name)",
    )
    .eq("id", childId)
    .maybeSingle();
  if (!child) notFound();

  const guardian = child.guardian;
  const resend = adminResendQrEmailAction.bind(null, child.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/children"
          className="text-sm text-blue-700 underline-offset-4 hover:underline"
        >
          ← Children
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{child.full_name}</h1>
      </div>

      {query.updated === "1" ? <FormAlert tone="success">Child details saved.</FormAlert> : null}

      {!child.is_active ? (
        <FormAlert tone="warning" title="This child record is archived.">
          Scans of this QR are rejected.
          {child.archived_at ? ` Archived ${formatDateTime(child.archived_at)}` : ""}
          {child.archiver?.full_name ? ` by ${child.archiver.full_name}` : ""}.
        </FormAlert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Child</h2>
            <Link
              href={`/admin/children/${child.id}/edit`}
              className="text-sm font-medium text-blue-700 underline-offset-4 hover:underline"
            >
              Edit details
            </Link>
          </div>
          <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-slate-500">Age</dt>
            <dd>{calculateAge(child.birthday)}</dd>
            <dt className="text-slate-500">Gender</dt>
            <dd>{child.gender}</dd>
            <dt className="text-slate-500">Birthday</dt>
            <dd>{formatBirthday(child.birthday)}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd>{child.is_active ? "Active" : "Archived"}</dd>
            <dt className="text-slate-500">Registered</dt>
            <dd>{formatDateTime(child.created_at)}</dd>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Guardian</h2>
          {guardian ? (
            <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-slate-500">Name</dt>
              <dd>
                <Link
                  href={`/admin/guardians/${guardian.id}`}
                  className="text-blue-700 underline-offset-4 hover:underline"
                >
                  {guardian.full_name}
                </Link>
                {!guardian.is_active ? " (deactivated)" : ""}
              </dd>
              <dt className="text-slate-500">Relationship</dt>
              <dd>
                {guardian.guardian_relationship === "Other" && guardian.guardian_relationship_other
                  ? `Other (${guardian.guardian_relationship_other})`
                  : (guardian.guardian_relationship ?? "—")}
              </dd>
              <dt className="text-slate-500">Mobile</dt>
              <dd>{formatPhilippineMobile(guardian.phone)}</dd>
              <dt className="text-slate-500">Email</dt>
              <dd>{guardian.email ?? "No email on file"}</dd>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Guardian not found.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">QR code</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          The child&apos;s permanent QR. Guardians view it from their dashboard; when an email is on
          file it can be re-sent from here.
        </p>
        {child.is_active && guardian?.email ? (
          <SendQrEmailButton action={resend} />
        ) : (
          <p className="text-sm text-slate-500">
            {child.is_active ? "No guardian email on file." : "Record is archived."}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Record status</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          Archiving is a soft delete: history is kept and the record can be reactivated.
        </p>
        <ArchiveChildControls
          childId={child.id}
          childName={child.full_name}
          isActive={child.is_active}
        />
      </section>
    </div>
  );
}
