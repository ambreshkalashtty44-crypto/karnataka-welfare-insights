import { createServerFn } from "@tanstack/react-start";

// /data
export const fetchData = createServerFn({ method: "GET" }).handler(async () => {
  const { getDataset } = await import("./analyzer.logic");
  return getDataset();
});

// /rules
export const fetchRules = createServerFn({ method: "GET" }).handler(async () => {
  const { getRules } = await import("./analyzer.logic");
  return getRules();
});

// /clusters
export const fetchClusters = createServerFn({ method: "GET" }).handler(async () => {
  const { getClusters } = await import("./analyzer.logic");
  return getClusters();
});