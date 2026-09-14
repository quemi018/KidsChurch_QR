import Link from "next/link";

import { buildSearchTerms } from "@/lib/admin/search";
import { createClient } from "@/lib/supabase/server";
import { formatPhilippineMobile } from "@/lib/validation/phone";

import { SearchForm } from "@/components/admin/search-form";

export const metadata = { title: "Guardians" };

const PAGE_SIZE = 50;

export default async function GuardiansPage({ searchParams }: PageProps<"/admin/guardians">) {
  const params = await searchParams;
  const search = buildSearchTerms(typeof params.q === "string" ? params.q : undefined);

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, phone, email, home_city, guardian_relationship, is_active, children:children!children_guardian_id_fkey(count)",
    )
    .eq("role", "member")
    .order("full_name", { ascending: true })
    .limit(PAGE_SIZE);

  const filters: string[] = [];
  if (search.namePattern) filters.push(`full_name.ilike.${search.namePattern}`);
  if (search.phonePattern) filters.push(`phone.ilike.${search.phonePattern}`);
  if (filters.length) query = query.or(filters.join(","));

  const { data: guardians } = await query;
  const rows = guardians ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guardians</h1>
        <p className="mt-1 text-slate-600">Search by name or mobile number.</p>
      </div>

      <SearchForm placeholder="Name or mobile number" defaultValue={search.text} />

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Relationship</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3 text-right">Children</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  {search.text ? "No guardians match that search." : "No guardians registered yet."}
                </td>
              </tr>
            ) : (
              rows.map((g) => (
                <tr key={g.id} className={g.is_active ? "" : "text-slate-400"}>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/guardians/${g.id}`}
                      className="text-blue-700 underline-offset-4 hover:underline"
                    >
                      {g.full_name}
                    </Link>
                    {!g.is_active ? <span className="ml-2 text-xs">(deactivated)</span> : null}
                  </td>
                  <td className="px-4 py-3">{g.guardian_relationship ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPhilippineMobile(g.phone)}</td>
                  <td className="px-4 py-3">{g.email ?? "—"}</td>
                  <td className="px-4 py-3">{g.home_city ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{g.children[0]?.count ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      {rows.length === PAGE_SIZE ? (
        <p className="text-sm text-slate-500">
          Showing the first {PAGE_SIZE} results. Refine your search to see more.
        </p>
      ) : null}
    </div>
  );
}
