import { setAdminActiveAction } from "@/lib/auth/admin-actions";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/datetime";
import { formatPhilippineMobile } from "@/lib/validation/phone";

import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin Users" };

export default async function AdminUsersPage() {
  const me = await requireAdmin("/admin/admin-users");
  const supabase = await createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, phone, is_active, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  const activeCount = admins?.filter((a) => a.is_active).length ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <p className="mt-1 text-slate-600">
          Admins can open sessions, scan attendance, and manage records. Passwords are never shown
          here.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {admins?.map((admin) => {
              const isMe = admin.id === me.userId;
              const isLastActive = admin.is_active && activeCount <= 1;
              return (
                <tr key={admin.id}>
                  <td className="px-4 py-3 font-medium">
                    {admin.full_name}
                    {isMe ? <span className="ml-2 text-xs text-slate-500">(you)</span> : null}
                  </td>
                  <td className="px-4 py-3">{formatPhilippineMobile(admin.phone)}</td>
                  <td className="px-4 py-3">
                    {admin.is_active ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(admin.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {isMe || isLastActive ? null : (
                      <form action={setAdminActiveAction}>
                        <input type="hidden" name="profileId" value={admin.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={admin.is_active ? "false" : "true"}
                        />
                        <Button type="submit" variant={admin.is_active ? "danger" : "secondary"}>
                          {admin.is_active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Create Admin</h2>
        <CreateAdminForm />
      </section>
    </div>
  );
}
