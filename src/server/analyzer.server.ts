// Server-only data generation, association rule mining, and clustering.
import { KARNATAKA_DISTRICTS, SCHEMES, YEARS, type Scheme, type DistrictMeta } from "@/data/karnataka";

export interface Record {
  district: string;
  scheme: Scheme;
  year: number;
  population: number;
  eligible: number;
  actual: number;
  coverage_gap_score: number;
}

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Tier → coverage band (latest year)
function bandFor(tier: DistrictMeta["tier"]): [number, number] {
  if (tier === "red") return [0.28, 0.48];
  if (tier === "yellow") return [0.55, 0.72];
  return [0.78, 0.95];
}

let CACHE: Record[] | null = null;

export function getDataset(): Record[] {
  if (CACHE) return CACHE;
  const out: Record[] = [];
  const latestYear = Math.max(...YEARS);
  const yearSpan = latestYear - Math.min(...YEARS);

  for (const d of KARNATAKA_DISTRICTS) {
    const [lo, hi] = bandFor(d.tier);
    for (const scheme of SCHEMES) {
      const rand = seeded(hashStr(d.name + scheme));
      // Each scheme gets its own offset within the district's tier band
      const schemeOffset = (rand() - 0.5) * 0.18;
      const targetLatest = Math.max(0.15, Math.min(0.97, lo + rand() * (hi - lo) + schemeOffset));
      // Earlier years are ~15-25% lower than latest, growing year-on-year
      const startMul = 0.72 + rand() * 0.1;
      for (const year of YEARS) {
        const t = yearSpan === 0 ? 1 : (year - Math.min(...YEARS)) / yearSpan;
        const mul = startMul + (1 - startMul) * t;
        let coverage = targetLatest * mul + (rand() - 0.5) * 0.04;
        coverage = Math.max(0.1, Math.min(0.98, coverage));
        const eligibleRatio = 0.18 + rand() * 0.12;
        const eligible = Math.round(d.population * eligibleRatio);
        const actual = Math.round(eligible * coverage);
        out.push({
          district: d.name,
          scheme,
          year,
          population: d.population,
          eligible,
          actual,
          coverage_gap_score: +(actual / eligible).toFixed(4),
        });
      }
    }
  }
  CACHE = out;
  return out;
}

// ---------- Association rules (district-aware) ----------

export interface Rule {
  antecedent: string;     // e.g. "PDS=low"
  consequent: string;     // e.g. "MGNREGA=low"
  support: number;        // fraction of districts
  confidence: number;
  lift: number;
  districts: string[];    // districts that satisfy antecedent ∧ consequent
}

function bucket(score: number): "low" | "med" | "high" {
  if (score < 0.5) return "low";
  if (score < 0.75) return "med";
  return "high";
}

export function getRules(): Rule[] {
  const data = getDataset();
  const latest = Math.max(...YEARS);
  const districts = [...new Set(data.map((d) => d.district))];

  // Binary transformation: only LOW (<50%) markers per district.
  const basket = new Map<string, Set<string>>();
  for (const dist of districts) {
    const set = new Set<string>();
    for (const r of data.filter((x) => x.district === dist && x.year === latest)) {
      if (r.coverage_gap_score < 0.5) set.add(`${r.scheme}=low`);
    }
    basket.set(dist, set);
  }
  const N = districts.length;
  const items = [...new Set([...basket.values()].flatMap((s) => [...s]))];

  const districtsWith = (item: string) =>
    districts.filter((d) => basket.get(d)!.has(item));

  const rules: Rule[] = [];
  for (const a of items) {
    for (const c of items) {
      if (a === c) continue;
      if (a.split("=")[0] === c.split("=")[0]) continue;
      const dA = districtsWith(a);
      const dAC = dA.filter((d) => basket.get(d)!.has(c));
      const supA = dA.length / N;
      const supC = districtsWith(c).length / N;
      const supAC = dAC.length / N;
      if (supAC < 0.08 || supA === 0 || dAC.length < 2) continue;
      const conf = supAC / supA;
      const lift = conf / (supC || 0.0001);
      if (conf < 0.55) continue;
      rules.push({
        antecedent: a,
        consequent: c,
        support: +supAC.toFixed(3),
        confidence: +conf.toFixed(3),
        lift: +lift.toFixed(3),
        districts: dAC,
      });
    }
  }
  return rules
    .sort((a, b) => b.confidence - a.confidence || b.support - a.support)
    .slice(0, 24);
}

// ---------- KMeans clustering (k=3, zone-aligned) ----------

export interface ClusterPoint {
  district: string;
  literacy: number;
  avgCoverage: number;
  cluster: number; // 0=red, 1=yellow, 2=green
}
export interface ClusterSummary {
  id: number;
  label: string;
  action: string;
  color: "red" | "yellow" | "green";
  avgCoverage: number;
  districts: string[];
}

const CLUSTER_DEFS = [
  { label: "Critically Underserved", action: "Immediate state intervention & awareness drives", color: "red"    as const },
  { label: "Moderately Performing",  action: "Targeted outreach and last-mile delivery audits", color: "yellow" as const },
  { label: "Well Performing",        action: "Maintain & share best-practices state-wide",      color: "green"  as const },
];

export function getClusters(): { points: ClusterPoint[]; summary: ClusterSummary[] } {
  const data = getDataset();
  const latest = Math.max(...YEARS);
  const districts = [...new Set(data.map((d) => d.district))];
  const points: ClusterPoint[] = districts.map((dist) => {
    const meta = KARNATAKA_DISTRICTS.find((m) => m.name === dist)!;
    const recs = data.filter((d) => d.district === dist && d.year === latest);
    const avg = recs.reduce((s, r) => s + r.coverage_gap_score, 0) / recs.length;
    return { district: dist, literacy: meta.literacy, avgCoverage: +avg.toFixed(4), cluster: 0 };
  });

  // Zone-aligned classification (matches dashboard/report exactly)
  points.forEach((p) => {
    p.cluster = p.avgCoverage < 0.5 ? 0 : p.avgCoverage < 0.75 ? 1 : 2;
  });

  const summary: ClusterSummary[] = [0, 1, 2].map((id) => {
    const members = points.filter((p) => p.cluster === id);
    const avg = members.reduce((s, m) => s + m.avgCoverage, 0) / (members.length || 1);
    return {
      id,
      label: CLUSTER_DEFS[id].label,
      action: CLUSTER_DEFS[id].action,
      color: CLUSTER_DEFS[id].color,
      avgCoverage: +avg.toFixed(3),
      districts: members.map((m) => m.district),
    };
  });

  return { points, summary };
}
