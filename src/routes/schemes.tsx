import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import "@/components/app/charts";
import { PageHeader, zoneLabel } from "@/components/app/PageHeader";
import { fetchData } from "@/server/api.functions";
import { SCHEMES, YEARS } from "@/data/karnataka";
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

const PALETTE = ["#387bc8", "#d64545", "#3fa66a", "#e3b341", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6", "#ec4899", "#64748b"];

function SchemesPage() {
  const [data, setData] = useState<Rec[] | null>(null);
  const [selected, setSelected] = useState<string[]>([SCHEMES[0], SCHEMES[1], SCHEMES[3]]);
  const [year, setYear] = useState<number>(YEARS[YEARS.length - 1]);

  useEffect(() => { fetchData().then(setData); }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const districts = [...new Set(data.map((r) => r.district))];

    // District-wise bar — for the chosen year, one bar group per district, one bar per scheme
    const districtRows = districts.map((d) => {
      const perScheme: Record<string, Rec | undefined> = {};
      for (const s of selected) {
        perScheme[s] = data.find((x) => x.district === d && x.scheme === s && x.year === year);
      }
      return { district: d, perScheme };
    });

    // Year-wise trend (state avg per selected scheme)
    const trend = selected.map((s) => ({
      scheme: s,
      values: YEARS.map((y) => {
        const rows = data.filter((r) => r.scheme === s && r.year === y);
        return rows.length ? rows.reduce((sum, r) => sum + r.coverage_gap_score, 0) / rows.length : 0;
      }),
    }));

    return { districtRows, trend, districts };
  }, [data, selected, year]);

  if (!view) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const toggle = (s: string) =>
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <>
      <PageHeader title="Scheme Comparison" subtitle="Multi-scheme district & year-wise breakdown" />
      <div className="p-8 space-y-6">
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-2">Schemes (multi-select)</div>
            <div className="flex flex-wrap gap-2">
              {SCHEMES.map((s, i) => {
                const active = selected.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active ? "text-white" : "bg-background hover:bg-muted text-foreground"
                    }`}
                    style={active ? { background: PALETTE[i % PALETTE.length], borderColor: PALETTE[i % PALETTE.length] } : {}}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs uppercase text-muted-foreground">Year</label>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">District-wise Coverage ({year})</h2>
          <Bar
            data={{
              labels: view.districtRows.map((r) => r.district),
              datasets: selected.map((s, i) => ({
                label: s,
                data: view.districtRows.map((r) => {
                  const rec = r.perScheme[s];
                  return rec ? +(rec.coverage_gap_score * 100).toFixed(1) : 0;
                }),
                backgroundColor: PALETTE[SCHEMES.indexOf(s as typeof SCHEMES[number]) % PALETTE.length],
              })),
            }}
            options={{
              responsive: true,
              scales: { y: { beginAtZero: true, max: 100 } },
            }}
          />
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Year-wise Trend (state avg per scheme)</h2>
          <Line
            data={{
              labels: [...YEARS],
              datasets: view.trend.map((t) => ({
                label: t.scheme,
                data: t.values.map((v) => +(v * 100).toFixed(1)),
                borderColor: PALETTE[SCHEMES.indexOf(t.scheme as typeof SCHEMES[number]) % PALETTE.length],
                backgroundColor: PALETTE[SCHEMES.indexOf(t.scheme as typeof SCHEMES[number]) % PALETTE.length] + "33",
                tension: 0.3,
              })),
            }}
            options={{ scales: { y: { max: 100 } } }}
          />
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">District</th>
                {selected.map((s) => <th key={s} className="px-4 py-3">{s}</th>)}
                <th className="px-4 py-3">Status (avg)</th>
              </tr>
            </thead>
            <tbody>
              {view.districtRows.map((r) => {
                const vals = selected.map((s) => r.perScheme[s]?.coverage_gap_score ?? 0);
                const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
                return (
                  <tr key={r.district} className="border-t">
                    <td className="px-4 py-2 font-medium">{r.district}</td>
                    {selected.map((s) => {
                      const v = r.perScheme[s]?.coverage_gap_score;
                      return (
                        <td key={s} className="px-4 py-2">
                          {v == null ? "—" : (v * 100).toFixed(1) + "%"}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2"><Badge score={avg} /></td>
                  </tr>
                );
              })}
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
