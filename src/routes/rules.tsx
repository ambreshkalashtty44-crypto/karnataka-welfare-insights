import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useRules } from "@/lib/dataStore";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Association Rules · Karnataka Welfare Analyzer" },
      { name: "description", content: "Apriori-mined association rules between welfare scheme coverage levels." },
    ],
  }),
  component: RulesPage,
});

function schemeOf(item: string) {
  return item.split("=")[0];
}

const KALYANA_KARNATAKA = new Set([
  "Kalaburagi", "Yadgir", "Raichur", "Ballari", "Bidar", "Koppal", "Vijayanagara",
]);

function RulesPage() {
  const rules = useRules();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!rules) return (
    <>
      <PageHeader title="Association Rules" subtitle="Apriori-mined LOW-coverage co-occurrence patterns" />
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
      </div>
    </>
  );

  return (
    <>
      <PageHeader
        title="Association Rules"
        subtitle="Co-occurring LOW (<50%) coverage patterns across districts"
      />
      <div className="p-8">
        {rules.length === 0 ? (
          <div className="text-muted-foreground">No LOW-coverage co-occurrence patterns met the threshold.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rules.map((r, i) => {
              const aScheme = schemeOf(r.antecedent);
              const cScheme = schemeOf(r.consequent);
              const open = openIdx === i;
              return (
                <div key={i} className="rounded-xl border bg-card p-5 shadow-sm border-l-4" style={{ borderLeftColor: "#d64545" }}>
                  <div className="text-xs uppercase text-muted-foreground tracking-wide">
                    Rule #{i + 1}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed">
                    <div>
                      <span className="text-muted-foreground">IF</span>{" "}
                      <span className="font-semibold">{aScheme}</span> is{" "}
                      <span className="font-semibold" style={{ color: "#d64545" }}>LOW (&lt;50%)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">THEN</span>{" "}
                      <span className="font-semibold">{cScheme}</span> is{" "}
                      <span className="font-semibold" style={{ color: "#d64545" }}>ALSO LOW (&lt;50%)</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Metric label="Support" value={r.support} />
                    <Metric label="Confidence" value={r.confidence} />
                    <Metric label="Lift" value={r.lift} />
                  </div>
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="mt-3 w-full rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    {open ? "Hide" : "Show"} Affected Districts ({r.districts.length})
                  </button>
                  {open && (
                    <div className="mt-2 rounded-md bg-muted/40 p-2">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">In districts:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.districts.map((d) => {
                          const critical = KALYANA_KARNATAKA.has(d);
                          return (
                            <span
                              key={d}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                background: critical ? "#d64545" : "#fee2e2",
                                color: critical ? "white" : "#991b1b",
                              }}
                              title={critical ? "Kalyana Karnataka — critical region" : ""}
                            >
                              {critical && "★"} {d}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value.toFixed(2)}</div>
    </div>
  );
}
