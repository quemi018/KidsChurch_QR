import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/ui/app-header";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <AppHeader area="Admin" />
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
