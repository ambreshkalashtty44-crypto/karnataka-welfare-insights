import { useEffect, useState } from "react";
import { fetchData, fetchRules, fetchClusters } from "@/server/api.functions";
import type { Record as Rec, Rule, ClusterPoint, ClusterSummary } from "@/server/analyzer.types";

// Module-level promise caches — fetched ONCE for the lifetime of the app.
type ClustersData = { points: ClusterPoint[]; summary: ClusterSummary[] };
let dataPromise: Promise<Rec[]> | null = null;
let rulesPromise: Promise<Rule[]> | null = null;
let clustersPromise: Promise<ClustersData> | null = null;

let dataCache: Rec[] | null = null;
let rulesCache: Rule[] | null = null;
let clustersCache: ClustersData | null = null;

export function preloadAll() {
  if (!dataPromise) dataPromise = fetchData().then((d) => (dataCache = d as Rec[]));
  if (!rulesPromise) rulesPromise = fetchRules().then((d) => (rulesCache = d as Rule[]));
  if (!clustersPromise) clustersPromise = fetchClusters().then((d) => (clustersCache = d as ClustersData));
}

function useCached<T>(getCache: () => T | null, getPromise: () => Promise<T>): T | null {
  const [val, setVal] = useState<T | null>(getCache());
  useEffect(() => {
    if (val) return;
    let alive = true;
    getPromise().then((d) => { if (alive) setVal(d); });
    return () => { alive = false; };
  }, []);
  return val;
}

export function useDataset() {
  return useCached<Rec[]>(
    () => dataCache,
    () => (dataPromise ??= fetchData().then((d) => (dataCache = d as Rec[]))),
  );
}
export function useRules() {
  return useCached<Rule[]>(
    () => rulesCache,
    () => (rulesPromise ??= fetchRules().then((d) => (rulesCache = d as Rule[]))),
  );
}
export function useClusters() {
  return useCached<ClustersData>(
    () => clustersCache,
    () => (clustersPromise ??= fetchClusters().then((d) => (clustersCache = d as ClustersData))),
  );
}