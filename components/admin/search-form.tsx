import { Button } from "@/components/ui/button";

type SearchFormProps = {
  placeholder: string;
  defaultValue?: string;
  /** Extra hidden fields to preserve (e.g. status filter). */
  hidden?: Record<string, string>;
};

/** GET search box; the page reads `q` from searchParams. */
export function SearchForm({ placeholder, defaultValue = "", hidden = {} }: SearchFormProps) {
  return (
    <form method="get" className="flex flex-wrap gap-2" role="search">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="q" className="sr-only">
        Search
      </label>
      <input
        id="q"
        name="q"
        type="search"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
