export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b bg-card">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export function zoneColor(score: number | null | undefined): string {
  if (score == null) return "var(--zone-grey)";
  if (score < 0.5) return "var(--zone-red)";
  if (score < 0.75) return "var(--zone-yellow)";
  return "var(--zone-green)";
}

export function zoneLabel(score: number | null | undefined): "Critical" | "Moderate" | "Good" | "No Data" {
  if (score == null) return "No Data";
  if (score < 0.5) return "Critical";
  if (score < 0.75) return "Moderate";
  return "Good";
}