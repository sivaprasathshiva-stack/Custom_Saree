/**
 * A section's small caption label. Deliberately plain — no forced caps,
 * no mono font, no hairline rule — those combined are exactly the
 * "generated page" tell the frontend-design skill calls out. Only pass
 * `step` when the content is a genuine numbered sequence (e.g. a process
 * with real order), not as decoration on an arbitrary section.
 */
export function SectionLabel({
  step,
  children,
  dark = false,
}: {
  step?: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <p className={`text-sm ${dark ? "text-stone-light" : "text-stone"}`}>
      {step && <span className="mr-2 text-ink">{step}</span>}
      {children}
    </p>
  );
}

export function StatusBadge({
  status,
}: {
  status: "pass" | "warning" | "review" | "fail" | "neutral";
}) {
  const map = {
    pass: { label: "PASS", cls: "text-success border-success/40 bg-success/10" },
    warning: { label: "WARNING", cls: "text-warning border-warning/40 bg-warning/10" },
    review: { label: "MANUAL REVIEW", cls: "text-indigo border-indigo/30 bg-indigo/10" },
    fail: { label: "FAIL", cls: "text-danger border-danger/40 bg-danger/10" },
    neutral: { label: "—", cls: "text-stone border-line bg-transparent" },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${map.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {map.label}
    </span>
  );
}
