import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils/age";
import { formatDateTime } from "@/lib/utils/datetime";
import { formatPhilippineMobile } from "@/lib/validation/phone";

export const metadata = { title: "Guardian" };

export default async function GuardianDetailPage({
  params,
}: PageProps<"/admin/guardians/[guardianId]">) {
  const { guardianId } = await params;
  const supabase = await createClient();

  const [{ data: guardian }, { data: children }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, phone, email, home_city, guardian_relationship, guardian_relationship_other, is_active, created_at",
      )
      .eq("id", guardianId)
      .eq("role", "member")
      .maybeSingle(),
    supabase
      .from("children")
      .select("id, full_name, gender, birthday, is_active")
      .eq("guardian_id", guardianId)
      .order("is_active", { ascending: false })
      .order("birthday", { ascending: true }),
  ]);
  if (!guardian) notFound();

  const relationship =
    guardian.guardian_relationship === "Other" && guardian.guardian_relationship_other
      ? `Other (${guardian.guardian_relationship_other})`
      : (guardian.guardian_relationship ?? "—");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/guardians"
          className="text-sm text-blue-700 underline-offset-4 hover:underline"
        >
          ← Guardians
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {guardian.full_name}
          {!guardian.is_active ? (
            <span className="ml-3 rounded bg-slate-200 px-2 py-0.5 align-middle text-xs font-semibold text-slate-700">
              Deactivated
            </span>
          ) : null}
        </h1>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Guardian details</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-slate-500">Relationship</dt>
          <dd>{relationship}</dd>
          <dt className="text-slate-500">Mobile</dt>
          <dd>{formatPhilippineMobile(guardian.phone)}</dd>
          <dt className="text-slate-500">Email</dt>
          <dd>{guardian.email ?? "No email on file"}</dd>
          <dt className="text-slate-500">Home city</dt>
          <dd>{guardian.home_city ?? "—"}</dd>
          <dt className="text-slate-500">Registered</dt>
          <dd>{formatDateTime(guardian.created_at)}</dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Children</h2>
        {!children || children.length === 0 ? (
          <p className="text-sm text-slate-500">No children on this account.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {children.map((child) => (
              <li
                key={child.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/admin/children/${child.id}`}
                    className="font-medium text-blue-700 underline-offset-4 hover:underline"
                  >
                    {child.full_name}
                  </Link>
                  <p className="text-sm text-slate-600">
                    Age {calculateAge(child.birthday)} • {child.gender}
                  </p>
                </div>
                {child.is_active ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                    Archived
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
