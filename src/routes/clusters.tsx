import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scatter } from "react-chartjs-2";
import "@/components/app/charts";
import { PageHeader } from "@/components/app/PageHeader";
import { fetchClusters } from "@/server/api.functions";
import type { ClusterPoint, ClusterSummary } from "@/server/analyzer.server";

export const Route = createFileRoute("/clusters")({
  head: () => ({
    meta: [
      { title: "District Clusters · Karnataka Welfare Analyzer" },
      { name: "description", content: "Clustering of districts by welfare scheme coverage performance." },
    ],
  }),
  component: ClustersPage,
});

const ZONE_COLOR = { red: "#d64545", yellow: "#e3b341", green: "#3fa66a" } as const;

function ClustersPage() {
  const [d, setD] = useState<{ points: ClusterPoint[]; summary: ClusterSummary[] } | null>(null);
  useEffect(() => { fetchClusters().then(setD); }, []);

  if (!d) return <div className="p-8 text-muted-foreground">Clustering districts…</div>;

  return (
    <>
      <PageHeader
        title="District Clusters"
        subtitle="Zone-aligned grouping based on coverage performance"
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {d.summary.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: ZONE_COLOR[c.color] }} />
                <h3 className="font-semibold">{c.label}</h3>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {c.districts.length} districts · avg {(c.avgCoverage * 100).toFixed(1)}%
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Suggested action</div>
              <div className="text-sm">{c.action}</div>
              <ul className="mt-3 max-h-40 overflow-auto text-xs text-muted-foreground space-y-0.5">
                {c.districts.map((dist) => <li key={dist}>• {dist}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Literacy vs Coverage</h2>
          <Scatter
            data={{
              datasets: d.summary.map((c) => ({
                label: c.label,
                data: d.points
                  .filter((p) => p.cluster === c.id)
                  .map((p) => ({ x: p.literacy, y: +(p.avgCoverage * 100).toFixed(1), district: p.district })),
                backgroundColor: ZONE_COLOR[c.color],
                pointRadius: 6,
              })),
            }}
            options={{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const raw = ctx.raw as { x: number; y: number; district: string };
                      return `${raw.district}: literacy ${raw.x}%, coverage ${raw.y}%`;
                    },
                  },
                },
              },
              scales: {
                x: { title: { display: true, text: "Literacy %" } },
                y: { title: { display: true, text: "Avg Coverage %" }, max: 100 },
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
