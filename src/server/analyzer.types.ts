import type { Scheme } from "@/data/karnataka";

export interface Record {
  district: string;
  scheme: Scheme;
  year: number;
  population: number;
  eligible: number;
  actual: number;
  coverage_gap_score: number;
}

export interface Rule {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
  districts: string[];
}

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
  color: "red" | "yellow" | "green";
  avgCoverage: number;
  districts: string[];
}
