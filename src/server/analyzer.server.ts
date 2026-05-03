// Server-only data generation, Apriori-style rule mining, and KMeans clustering.
// Mirrors the Python Flask /data, /rules, /clusters endpoints.

import { KARNATAKA_DISTRICTS, SCHEMES, YEARS, type Scheme } from "@/data/karnataka";

export interface Record {
  district: string;
  scheme: Scheme;
  year: number;
  population: number;
  eligible: number;
  actual: number;
  coverage_gap_score: number; // actual / eligible (0..1)
}

// Deterministic pseudo-random so the dataset is stable across calls.
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

let CACHE: Record[] | null = null;

export function getDataset(): Record[] {
  if (CACHE) return CACHE;
  const out: Record[] = [];
  for (const d of KARNATAKA_DISTRICTS) {
    // Base coverage influenced by literacy + slight urban bias.
    const literacyFactor = (d.literacy - 50) / 50; // -0..0.8
    for (const scheme of SCHEMES) {
      const rand = seeded(hashStr(d.name + scheme));
      const schemeBias = (hashStr(scheme) % 20) / 100; // 0..0.2
      let trend = 0;
      for (const year of YEARS) {
        const eligibleRatio = 0.18 + rand() * 0.12; // 18-30% of pop eligible
        const eligible = Math.round(d.population * eligibleRatio);
        // year-on-year improvement
        trend += 0.015 + rand() * 0.02;
        let coverage =
          0.35 + literacyFactor * 0.35 + schemeBias + trend + (rand() - 0.5) * 0.1;
        coverage = Math.max(0.15, Math.min(0.98, coverage));
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

// ---------- Apriori-style association rules ----------

export interface Rule {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
}

function bucket(score: number): "low" | "med" | "high" {
  if (score < 0.5) return "low";
  if (score < 0.75) return "med";
  return "high";
}

export function getRules(): Rule[] {
  const data = getDataset();
  // For each district (latest year), build basket of (scheme, level)
  const latest = Math.max(...YEARS);
  const baskets: Set<string>[] = [];
  const districts = [...new Set(data.map((d) => d.district))];
  for (const dist of districts) {
    const items = new Set<string>();
    for (const r of data.filter((x) => x.district === dist && x.year === latest)) {
      items.add(`${r.scheme}=${bucket(r.coverage_gap_score)}`);
    }
    baskets.push(items);
  }
  const N = baskets.length;
  const items = [...new Set(baskets.flatMap((b) => [...b]))];

  // Frequency
  const supportOf = (set: string[]) =>
    baskets.filter((b) => set.every((i) => b.has(i))).length / N;

  const rules: Rule[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const a = items[i];
      const c = items[j];
      // Skip same-scheme pairs
      if (a.split("=")[0] === c.split("=")[0]) continue;
      const supAC = supportOf([a, c]);
      const supA = supportOf([a]);
      const supC = supportOf([c]);
      if (supAC < 0.15 || supA === 0) continue;
      const conf = supAC / supA;
      const lift = conf / (supC || 0.0001);
      if (conf < 0.6) continue;
      rules.push({
        antecedent: a,
        consequent: c,
        support: +supAC.toFixed(3),
        confidence: +conf.toFixed(3),
        lift: +lift.toFixed(3),
      });
    }
  }
  return rules.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
}

// ---------- KMeans clustering (k=4) ----------

export interface ClusterPoint {
  district: string;
  literacy: number;
  avgCoverage: number;
  cluster: number;
}

export interface ClusterSummary {
  id: number;
  label: string;
  action: string;
  avgCoverage: number;
  districts: string[];
}

const CLUSTER_LABELS = [
  { label: "Critically Underserved", action: "Immediate state intervention & awareness drives" },
  { label: "Moderately Underserved", action: "Targeted outreach and last-mile delivery audits" },
  { label: "Average Performing",     action: "Scheme consolidation & process digitisation" },
  { label: "Well Performing",        action: "Maintain & share best-practices state-wide" },
];

export function getClusters(): { points: ClusterPoint[]; summary: ClusterSummary[] } {
  const data = getDataset();
  const districts = [...new Set(data.map((d) => d.district))];
  const points = districts.map((dist) => {
    const meta = KARNATAKA_DISTRICTS.find((m) => m.name === dist)!;
    const recs = data.filter((d) => d.district === dist);
    const avg = recs.reduce((s, r) => s + r.coverage_gap_score, 0) / recs.length;
    return { district: dist, literacy: meta.literacy, avgCoverage: +avg.toFixed(4), cluster: 0 };
  });

  // Simple 1-D KMeans on avgCoverage with k=4 (deterministic init across range)
  const min = Math.min(...points.map((p) => p.avgCoverage));
  const max = Math.max(...points.map((p) => p.avgCoverage));
  let centroids = [0, 1, 2, 3].map((i) => min + ((max - min) * (i + 0.5)) / 4);

  for (let iter = 0; iter < 25; iter++) {
    points.forEach((p) => {
      let best = 0,
        bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = Math.abs(c - p.avgCoverage);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      p.cluster = best;
    });
    centroids = centroids.map((_, i) => {
      const members = points.filter((p) => p.cluster === i);
      return members.length
        ? members.reduce((s, m) => s + m.avgCoverage, 0) / members.length
        : centroids[i];
    });
  }

  // Sort clusters by centroid so cluster 0 = worst, 3 = best
  const order = centroids
    .map((c, i) => ({ c, i }))
    .sort((a, b) => a.c - b.c)
    .map((o) => o.i);
  const remap = new Map(order.map((origIdx, newIdx) => [origIdx, newIdx]));
  points.forEach((p) => (p.cluster = remap.get(p.cluster)!));

  const summary: ClusterSummary[] = [0, 1, 2, 3].map((id) => {
    const members = points.filter((p) => p.cluster === id);
    const avg = members.reduce((s, m) => s + m.avgCoverage, 0) / (members.length || 1);
    return {
      id,
      label: CLUSTER_LABELS[id].label,
      action: CLUSTER_LABELS[id].action,
      avgCoverage: +avg.toFixed(3),
      districts: members.map((m) => m.district),
    };
  });

  return { points, summary };
}