import Link from "next/link";

import { requireMember } from "@/lib/auth/session";
import { createChildAction } from "@/lib/member/actions";
import { todayYmdString } from "@/lib/utils/age";

import { ChildForm } from "@/components/member/child-form";

export const metadata = { title: "Add Child" };

export default async function NewChildPage() {
  await requireMember("/member/children/new");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/member" className="text-sm text-blue-700 underline-offset-4 hover:underline">
          ← My Children
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Add Child</h1>
        <p className="mt-1 text-slate-600">A permanent QR code is created for the new child.</p>
      </div>
      <ChildForm
        action={createChildAction}
        submitLabel="Add Child"
        pendingLabel="Adding…"
        maxBirthday={todayYmdString()}
      />
    </div>
  );
}
