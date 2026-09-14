import Link from "next/link";

import { buildSearchTerms } from "@/lib/admin/search";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils/age";
import { formatPhilippineMobile } from "@/lib/validation/phone";

import { SearchForm } from "@/components/admin/search-form";

export const metadata = { title: "Children" };

const PAGE_SIZE = 50;

type StatusFilter = "active" | "archived" | "all";

export default async function ChildrenPage({ searchParams }: PageProps<"/admin/children">) {
  const params = await searchParams;
  const search = buildSearchTerms(typeof params.q === "string" ? params.q : undefined);
  const status: StatusFilter =
    params.status === "archived" || params.status === "all" ? params.status : "active";

  const supabase = await createClient();

  // Guardian phone search needs guardian ids first (PostgREST cannot `or` across tables).
  let guardianIds: string[] | null = null;
  if (search.phonePattern) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("phone", search.phonePattern)
      .limit(PAGE_SIZE);
    guardianIds = (data ?? []).map((g) => g.id);
  }

  let query = supabase
    .from("children")
    .select(
      "id, full_name, gender, birthday, is_active, guardian:profiles!children_guardian_id_fkey(id, full_name, phone)",
    )
    .order("full_name", { ascending: true })
    .limit(PAGE_SIZE);

  if (status !== "all") query = query.eq("is_active", status === "active");

  const filters: string[] = [];
  if (search.namePattern) filters.push(`full_name.ilike.${search.namePattern}`);
  if (guardianIds && guardianIds.length) filters.push(`guardian_id.in.(${guardianIds.join(",")})`);
  if (filters.length) query = query.or(filters.join(","));
  else if (search.text && !search.namePattern && guardianIds && guardianIds.length === 0) {
    // Digits-only search with no matching guardian phone: nothing can match.
    query = query.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: children } = await query;
  const rows = children ?? [];

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Children</h1>
        <p className="mt-1 text-slate-600">
          Search by child name, guardian name, or mobile number.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SearchForm
          placeholder="Child, guardian, or mobile"
          defaultValue={search.text}
          hidden={{ status }}
        />
        <nav
          aria-label="Status filter"
          className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={{
                pathname: "/admin/children",
                query: { status: tab.value, ...(search.text ? { q: search.text } : {}) },
              }}
              aria-current={tab.value === status ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab.value === status
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Child</th>
              <th className="px-4 py-3 text-right">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  {search.text ? "No children match that search." : "No children found."}
                </td>
              </tr>
            ) : (
              rows.map((child) => (
                <tr key={child.id}>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/children/${child.id}`}
                      className="text-blue-700 underline-offset-4 hover:underline"
                    >
                      {child.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">{calculateAge(child.birthday)}</td>
                  <td className="px-4 py-3">{child.gender}</td>
                  <td className="px-4 py-3">
                    {child.guardian ? (
                      <Link
                        href={`/admin/guardians/${child.guardian.id}`}
                        className="text-blue-700 underline-offset-4 hover:underline"
                      >
                        {child.guardian.full_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPhilippineMobile(child.guardian?.phone)}
                  </td>
                  <td className="px-4 py-3">
                    {child.is_active ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        Archived
                      </span>
                    )}
                  </td>
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
