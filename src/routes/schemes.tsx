import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import "@/components/app/charts";
import { PageHeader, zoneLabel } from "@/components/app/PageHeader";
import { fetchData } from "@/server/api.functions";
import { SCHEMES } from "@/data/karnataka";
import type { Record as Rec } from "@/server/analyzer.server";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Scheme Comparison · Karnataka Welfare Analyzer" },
      { name: "description", content: "Compare district-wise and year-wise welfare scheme coverage." },
    ],
  }),
  component: SchemesPage,
});

function SchemesPage() {
  const [data, setData] = useState<Rec[] | null>(null);
  const [scheme, setScheme] = useState<string>(SCHEMES[0]);

  useEffect(() => { fetchData().then(setData); }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const rows = data.filter((r) => r.scheme === scheme);
    const latest = Math.max(...rows.map((r) => r.year));
    const districts = [...new Set(rows.map((r) => r.district))];
    const districtRows = districts.map((d) => {
      const r = rows.find((x) => x.district === d && x.year === latest)!;
      return r;
    });
    const years = [...new Set(rows.map((r) => r.year))].sort();
    const yearAvg = years.map(
      (y) => rows.filter((r) => r.year === y).reduce((s, r) => s + r.coverage_gap_score, 0) /
             rows.filter((r) => r.year === y).length
    );
    return { districtRows, years, yearAvg, latest };
  }, [data, scheme]);

  if (!view) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <>
      <PageHeader title="Scheme Comparison" subtitle="Per-scheme district and year-wise breakdown" />
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Scheme:</label>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
          >
            {SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-muted-foreground ml-2">Year shown: {view.latest}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-4">District-wise Coverage</h2>
            <Bar
              data={{
                labels: view.districtRows.map((r) => r.district),
                datasets: [{
                  label: "Coverage %",
                  data: view.districtRows.map((r) => +(r.coverage_gap_score * 100).toFixed(1)),
                  backgroundColor: view.districtRows.map((r) =>
                    r.coverage_gap_score < 0.5 ? "#d64545"
                    : r.coverage_gap_score < 0.75 ? "#e3b341" : "#3fa66a"
                  ),
                }],
              }}
              options={{ plugins: { legend: { display: false } }, scales: { y: { max: 100 } } }}
            />
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Year-wise Trend (state avg)</h2>
            <Line
              data={{
                labels: view.years,
                datasets: [{
                  label: "State Avg Coverage %",
                  data: view.yearAvg.map((v) => +(v * 100).toFixed(1)),
                  borderColor: "#387bc8",
                  backgroundColor: "rgba(56,123,200,0.2)",
                  fill: true,
                  tension: 0.3,
                }],
              }}
              options={{ scales: { y: { max: 100 } } }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Eligible</th>
                <th className="px-4 py-3">Beneficiaries</th>
                <th className="px-4 py-3">Coverage %</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {view.districtRows.map((r) => (
                <tr key={r.district} className="border-t">
                  <td className="px-4 py-2 font-medium">{r.district}</td>
                  <td className="px-4 py-2">{r.eligible.toLocaleString()}</td>
                  <td className="px-4 py-2">{r.actual.toLocaleString()}</td>
                  <td className="px-4 py-2">{(r.coverage_gap_score * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">
                    <Badge score={r.coverage_gap_score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Badge({ score }: { score: number }) {
  const label = zoneLabel(score);
  const bg = label === "Critical" ? "#d64545" : label === "Moderate" ? "#e3b341" : "#3fa66a";
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-xs text-white" style={{ background: bg }}>
      {label}
    </span>
  );
}