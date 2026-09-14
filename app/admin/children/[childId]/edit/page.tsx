import Link from "next/link";
import { notFound } from "next/navigation";

import { adminUpdateChildAction } from "@/lib/admin/children-actions";
import { createClient } from "@/lib/supabase/server";
import { todayYmdString } from "@/lib/utils/age";

import { ChildForm } from "@/components/member/child-form";

export const metadata = { title: "Edit Child" };

export default async function AdminEditChildPage({
  params,
}: PageProps<"/admin/children/[childId]/edit">) {
  const { childId } = await params;
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, gender, birthday")
    .eq("id", childId)
    .maybeSingle();
  if (!child) notFound();

  const action = adminUpdateChildAction.bind(null, child.id);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href={`/admin/children/${child.id}`}
          className="text-sm text-blue-700 underline-offset-4 hover:underline"
        >
          ← {child.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Edit Child</h1>
        <p className="mt-1 text-slate-600">Admin correction. The QR code is not affected.</p>
      </div>
      <ChildForm
        action={action}
        initial={{ fullName: child.full_name, gender: child.gender, birthday: child.birthday }}
        submitLabel="Save Changes"
        pendingLabel="Saving…"
        maxBirthday={todayYmdString()}
      />
    </div>
  );
}
