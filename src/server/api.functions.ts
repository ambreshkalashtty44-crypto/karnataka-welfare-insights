import { createServerFn } from "@tanstack/react-start";
import { getDataset, getRules, getClusters } from "./analyzer.server";

// /data
export const fetchData = createServerFn({ method: "GET" }).handler(async () => {
  return getDataset();
});

// /rules
export const fetchRules = createServerFn({ method: "GET" }).handler(async () => {
  return getRules();
});

// /clusters
export const fetchClusters = createServerFn({ method: "GET" }).handler(async () => {
  return getClusters();
});