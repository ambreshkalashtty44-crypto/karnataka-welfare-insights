import { createServerFn } from "@tanstack/react-start";
import { getDataset, getRules, getClusters } from "./analyzer.logic";

export const fetchData = createServerFn({ method: "GET" }).handler(async () => getDataset());
export const fetchRules = createServerFn({ method: "GET" }).handler(async () => getRules());
export const fetchClusters = createServerFn({ method: "GET" }).handler(async () => getClusters());