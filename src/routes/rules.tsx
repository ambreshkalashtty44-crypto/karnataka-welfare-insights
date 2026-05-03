import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { fetchRules } from "@/server/api.functions";
import type { Rule } from "@/server/analyzer.server";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Association Rules · Karnataka Welfare Analyzer" },
      { name: "description", content: "Apriori-mined association rules between welfare scheme coverage levels." },
    ],
  }),
  component: RulesPage,
});

function fmt(item: string) {
  const [scheme, level] = item.split("=");
  const word = level === "low" ? "low (<50%)" : level === "med" ? "moderate (50–75%)" : "high (>75%)";
  return { scheme, word, level };
}

function RulesPage() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  useEffect(() => { fetchRules().then(setRules); }, []);

  if (!rules) return <div className="p-8 text-muted-foreground">Mining rules…</div>;

  return (
    <>
      <PageHeader
        title="Association Rules"
        subtitle="Apriori output — district-level relationships between scheme coverage levels"
      />
      <div className="p-8">
        {rules.length === 0 ? (
          <div className="text-muted-foreground">No rules met the support/confidence threshold.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rules.map((r, i) => {
              const a = fmt(r.antecedent);
              const c = fmt(r.consequent);
              const preview = r.districts.slice(0, 3).join(", ");
              const more = r.districts.length > 3 ? ` +${r.districts.length - 3} more` : "";
              return (
                <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="text-xs uppercase text-muted-foreground tracking-wide">
                    Rule #{i + 1}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed">
                    <span className="text-muted-foreground">In districts like </span>
                    <span className="font-semibold">{preview}{more}</span>
                    <span className="text-muted-foreground">:</span>
                    <div className="mt-1">
                      <span className="text-muted-foreground">IF</span>{" "}
                      <span className="font-semibold">{a.scheme}</span> is{" "}
                      <span className="font-semibold text-primary">{a.word}</span>{" "}
                      <span className="text-muted-foreground">→ THEN</span>{" "}
                      <span className="font-semibold">{c.scheme}</span> is{" "}
                      <span className="font-semibold text-primary">{c.word}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Metric label="Support" value={r.support} />
                    <Metric label="Confidence" value={r.confidence} />
                    <Metric label="Lift" value={r.lift} />
                  </div>
                  <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      All matching districts ({r.districts.length})
                    </summary>
                    <div className="mt-2 text-xs text-foreground/80">
                      {r.districts.join(", ")}
                    </div>
                  </details>
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
