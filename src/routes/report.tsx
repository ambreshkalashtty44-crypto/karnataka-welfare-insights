import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader, zoneLabel } from "@/components/app/PageHeader";
import { useDataset } from "@/lib/dataStore";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Coverage Gap Report · Karnataka Welfare Analyzer" },
      { name: "description", content: "Prioritized coverage gap report with PDF export." },
    ],
  }),
  component: ReportPage,
});

type Filter = "all" | "red" | "yellow" | "green";

interface Row {
  rank: number;
  district: string;
  population: number;
  eligible: number;
  actual: number;
  score: number;
  criticalScheme: string;
  priority: "High" | "Medium" | "Low";
}

function ReportPage() {
  const data = useDataset();
  const [filter, setFilter] = useState<Filter>("all");

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const latest = Math.max(...data.map((d) => d.year));
    const districts = [...new Set(data.map((d) => d.district))];
    const built = districts.map((dist) => {
      const recs = data.filter((r) => r.district === dist && r.year === latest);
      const totalEligible = recs.reduce((s, r) => s + r.eligible, 0);
      const totalActual = recs.reduce((s, r) => s + r.actual, 0);
      const score = totalActual / totalEligible;
      const worst = recs.reduce((a, b) => (a.coverage_gap_score < b.coverage_gap_score ? a : b));
      const priority: Row["priority"] = score < 0.5 ? "High" : score < 0.75 ? "Medium" : "Low";
      return {
        rank: 0,
        district: dist,
        population: recs[0].population,
        eligible: totalEligible,
        actual: totalActual,
        score,
        criticalScheme: worst.scheme,
        priority,
      };
    }).sort((a, b) => a.score - b.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
    return built;
  }, [data]);

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "red") return r.score < 0.5;
    if (filter === "yellow") return r.score >= 0.5 && r.score < 0.75;
    return r.score >= 0.75;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Karnataka Welfare Scheme — Coverage Gap Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Filter: ${filter.toUpperCase()}  ·  Districts: ${filtered.length}`, 14, 23);
    const avg = filtered.reduce((s, r) => s + r.score, 0) / (filtered.length || 1);
    doc.text(`Average coverage: ${(avg * 100).toFixed(1)}%`, 14, 29);
    autoTable(doc, {
      startY: 35,
      head: [["Rank", "District", "Population", "Eligible", "Actual", "Coverage %", "Critical Scheme", "Priority"]],
      body: filtered.map((r) => [
        r.rank, r.district, r.population.toLocaleString(),
        r.eligible.toLocaleString(), r.actual.toLocaleString(),
        (r.score * 100).toFixed(1) + "%", r.criticalScheme, r.priority,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [56, 123, 200] },
    });
    doc.save("karnataka-coverage-report.pdf");
  };

  if (!data) return (
    <>
      <PageHeader title="Coverage Gap Report" subtitle="Ranked districts with actionable priority" />
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 rounded-md w-1/2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </>
  );

  return (
    <>
      <PageHeader title="Coverage Gap Report" subtitle="Ranked districts with actionable priority" />
      <div className="p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["all", "red", "yellow", "green"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1) + " Zone"}
              </button>
            ))}
          </div>
          <button
            onClick={exportPDF}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Export Report as PDF
          </button>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">District</th>
                <th className="px-3 py-2">Population</th>
                <th className="px-3 py-2">Eligible</th>
                <th className="px-3 py-2">Actual</th>
                <th className="px-3 py-2">Coverage</th>
                <th className="px-3 py-2">Critical Scheme</th>
                <th className="px-3 py-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.district} className="border-t">
                  <td className="px-3 py-2">{r.rank}</td>
                  <td className="px-3 py-2 font-medium">{r.district}</td>
                  <td className="px-3 py-2">{r.population.toLocaleString()}</td>
                  <td className="px-3 py-2">{r.eligible.toLocaleString()}</td>
                  <td className="px-3 py-2">{r.actual.toLocaleString()}</td>
                  <td className="px-3 py-2">{(r.score * 100).toFixed(1)}% <span className="text-xs text-muted-foreground">({zoneLabel(r.score)})</span></td>
                  <td className="px-3 py-2">{r.criticalScheme}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs text-white ${
                      r.priority === "High" ? "bg-[#d64545]" :
                      r.priority === "Medium" ? "bg-[#e3b341]" : "bg-[#3fa66a]"
                    }`}>{r.priority}</span>
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