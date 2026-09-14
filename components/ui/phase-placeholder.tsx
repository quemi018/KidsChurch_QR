type PhasePlaceholderProps = {
  title: string;
  /** Build phase (spec.md section 53) in which this screen is implemented. */
  phase: number;
  description?: string;
};

/** Temporary stand-in for screens scheduled in a later build phase. */
export function PhasePlaceholder({ title, phase, description }: PhasePlaceholderProps) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
      <p className="mt-4 text-sm text-slate-500">Scheduled for Phase {phase}.</p>
    </section>
  );
}
