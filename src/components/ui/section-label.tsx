export function SectionLabel({
  index,
  children,
  dark = false,
}: {
  index?: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] ${
        dark ? "text-stone-light" : "text-stone"
      }`}
    >
      {index && <span className="text-ink font-semibold">{index}</span>}
      <span>{children}</span>
      <span className={`h-px flex-1 ${dark ? "bg-line-dark" : "bg-line"}`} />
    </div>
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
