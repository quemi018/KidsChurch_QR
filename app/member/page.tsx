import Link from "next/link";

import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { ChildCard } from "@/components/member/child-card";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "My Children" };

export default async function MemberDashboardPage({ searchParams }: PageProps<"/member">) {
  const user = await requireMember();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: children } = await supabase
    .from("children")
    .select("id, full_name, gender, birthday, is_active")
    .eq("guardian_id", user.userId)
    .order("is_active", { ascending: false })
    .order("birthday", { ascending: true });

  const list = children ?? [];
  const hasEmail = Boolean(user.profile.email);

  return (
    <div className="space-y-8">
      {params.welcome === "1" ? (
        <FormAlert tone="success" title="Welcome! Your account is ready.">
          Each child below has a permanent QR code. Open <strong>View QR</strong> and take a photo
          or screenshot to present at check-in.
        </FormAlert>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Children</h1>
          <p className="mt-1 text-slate-600">
            {user.profile.full_name}
            {user.profile.guardian_relationship ? ` • ${user.profile.guardian_relationship}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {hasEmail ? (
              <>Email on file: {user.profile.email}</>
            ) : (
              <>No email address on file. You can display each QR and take a photo/screenshot.</>
            )}
            {" · "}
            <Link
              href="/member/profile"
              className="text-blue-700 underline-offset-4 hover:underline"
            >
              Edit my information
            </Link>
          </p>
        </div>
        <Link
          href="/member/children/new"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        >
          + Add Child
        </Link>
      </div>

      {list.length === 0 ? (
        <FormAlert tone="info">
          No children yet. Use “Add Child” to register your first child.
        </FormAlert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}
