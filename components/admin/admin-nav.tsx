import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/scanner", label: "Scanner" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/guardians", label: "Guardians" },
  { href: "/admin/children", label: "Children" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/admin-users", label: "Admin Users" },
] as const;

export function AdminNav() {
  return (
    <nav aria-label="Admin" className="border-b border-slate-200 bg-white">
      <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block px-3 py-2 text-sm font-medium whitespace-nowrap text-slate-700 hover:text-blue-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
