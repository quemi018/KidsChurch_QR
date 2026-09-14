import { requireAdmin } from "@/lib/auth/session";

import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppHeader } from "@/components/ui/app-header";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <>
      <AppHeader area="Admin">
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">{user.profile.full_name}</span>
          <LogoutButton />
        </div>
      </AppHeader>
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
