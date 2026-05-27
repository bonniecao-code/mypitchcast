type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
};

export function KPICard({ label, value, hint, tone = "default" }: Props) {
  const toneClass =
    tone === "good" ? "text-success"
    : tone === "warn" ? "text-warning"
    : tone === "bad" ? "text-destructive"
    : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl num ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
