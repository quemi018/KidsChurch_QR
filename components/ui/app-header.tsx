import Link from "next/link";

type AppHeaderProps = {
  /** Small label rendered beside the brand, e.g. "Admin" or "Member". */
  area?: string;
  children?: React.ReactNode;
};

export function AppHeader({ area, children }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2 font-semibold">
          <span>Victory Caloocan Kids Church</span>
          {area ? (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium tracking-wide text-slate-600 uppercase">
              {area}
            </span>
          ) : null}
        </Link>
        {children}
      </div>
    </header>
  );
}
