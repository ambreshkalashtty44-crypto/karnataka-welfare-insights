import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import "@/components/app/charts";
import { PageHeader, zoneLabel } from "@/components/app/PageHeader";
import { useDataset } from "@/lib/dataStore";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Karnataka Welfare Scheme Analyzer" },
      { name: "description", content: "Overview of welfare scheme coverage across Karnataka districts." },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-3xl font-semibold mt-2" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function Dashboard() {
  const data = useDataset();

  const stats = useMemo(() => {
    if (!data) return null;
    const latest = Math.max(...data.map((d) => d.year));
    const latestRows = data.filter((d) => d.year === latest);
    const districts = [...new Set(latestRows.map((d) => d.district))];
    const schemes = [...new Set(latestRows.map((d) => d.scheme))];
    const perDistrictAvg = districts.map((dist) => {
      const rows = latestRows.filter((r) => r.district === dist);
      return {
        district: dist,
        avg: rows.reduce((s, r) => s + r.coverage_gap_score, 0) / rows.length,
      };
    });
    const avgCov = perDistrictAvg.reduce((s, r) => s + r.avg, 0) / perDistrictAvg.length;
    const red = perDistrictAvg.filter((r) => r.avg < 0.5).length;
    const yellow = perDistrictAvg.filter((r) => r.avg >= 0.5 && r.avg < 0.75).length;
    const green = perDistrictAvg.filter((r) => r.avg >= 0.75).length;
    const top10 = [...perDistrictAvg].sort((a, b) => b.avg - a.avg).slice(0, 10);
    return { districts, schemes, avgCov, red, yellow, green, top10 };
  }, [data]);

  if (!stats) return <DashboardSkeleton />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Statewide overview of welfare scheme utilization (latest year)"
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Total Districts" value={stats.districts.length} />
          <Stat label="Total Schemes" value={stats.schemes.length} />
          <Stat
            label="Average Coverage"
            value={`${(stats.avgCov * 100).toFixed(1)}%`}
            accent="var(--primary)"
          />
          <Stat label="Red Zone Districts" value={stats.red} accent="var(--zone-red)" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Top 10 Districts by Coverage</h2>
            <Bar
              data={{
                labels: stats.top10.map((d) => d.district),
                datasets: [
                  {
                    label: "Avg Coverage",
                    data: stats.top10.map((d) => +(d.avg * 100).toFixed(1)),
                    backgroundColor: "rgba(56,123,200,0.85)",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } },
              }}
            />
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Zone Distribution</h2>
            <Doughnut
              data={{
                labels: ["Critical (Red)", "Moderate (Yellow)", "Good (Green)"],
                datasets: [
                  {
                    data: [stats.red, stats.yellow, stats.green],
                    backgroundColor: ["#d64545", "#e3b341", "#3fa66a"],
                    borderWidth: 0,
                  },
                ],
              }}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              State health: <span className="font-medium text-foreground">
                {zoneLabel(stats.avgCov)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Statewide overview of welfare scheme utilization (latest year)" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </>
  );
}