import Link from "next/link";

import { requireMember } from "@/lib/auth/session";
import { formatPhilippineMobile } from "@/lib/validation/phone";

import { PhoneChangeForm } from "@/components/member/phone-change-form";
import { ProfileForm } from "@/components/member/profile-form";

export const metadata = { title: "My Profile" };

export default async function MemberProfilePage() {
  const { profile } = await requireMember("/member/profile");

  return (
    <div className="space-y-10">
      <div>
        <Link href="/member" className="text-sm text-blue-700 underline-offset-4 hover:underline">
          ← My Children
        </Link>
        <h1 className="mt-2 text-2xl font-bold">My Profile</h1>
      </div>

      <section className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Guardian information</h2>
        <ProfileForm
          initial={{
            fullName: profile.full_name,
            guardianRelationship: profile.guardian_relationship ?? "",
            guardianRelationshipOther: profile.guardian_relationship_other ?? "",
            homeCity: profile.home_city ?? "",
            email: profile.email ?? "",
          }}
        />
      </section>

      <section className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Mobile number</h2>
        <PhoneChangeForm currentPhoneDisplay={formatPhilippineMobile(profile.phone)} />
      </section>
    </div>
  );
}
