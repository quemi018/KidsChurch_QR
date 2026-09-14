import { requireMember } from "@/lib/auth/session";
import { requireStation } from "@/lib/auth/station";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppHeader } from "@/components/ui/app-header";

export default async function MemberLayout({ children }: LayoutProps<"/member">) {
  const user = await requireMember();
  await requireStation();

  return (
    <>
      <AppHeader area="Member">
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">{user.profile.full_name}</span>
          <LogoutButton />
        </div>
      </AppHeader>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
