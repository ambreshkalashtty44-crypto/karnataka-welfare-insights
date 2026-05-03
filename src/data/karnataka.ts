// Karnataka districts master list (31 districts).
export interface DistrictMeta {
  name: string;
  population: number;
  literacy: number;
  lat: number;
  lng: number;
  /** Pre-assigned performance tier — drives coverage generation so the
   *  whole app shows a realistic, consistent distribution. */
  tier: "red" | "yellow" | "green";
}

export const KARNATAKA_DISTRICTS: DistrictMeta[] = [
  // RED zone (7) — critically underserved (incl. Kalaburagi, Raichur, Yadgir per spec)
  { name: "Yadgir",          population: 1174271, literacy: 51.8, lat: 16.77, lng: 77.14, tier: "red" },
  { name: "Raichur",         population: 1928812, literacy: 59.6, lat: 16.20, lng: 77.36, tier: "red" },
  { name: "Kalaburagi",      population: 2566326, literacy: 64.8, lat: 17.33, lng: 76.83, tier: "red" },
  { name: "Chamarajanagar",  population: 1020791, literacy: 61.4, lat: 11.92, lng: 76.94, tier: "red" },
  { name: "Vijayapura",      population: 2177331, literacy: 67.2, lat: 16.83, lng: 75.71, tier: "red" },
  { name: "Koppal",          population: 1389920, literacy: 68.1, lat: 15.35, lng: 76.15, tier: "red" },
  { name: "Ballari",         population: 2452595, literacy: 67.4, lat: 15.13, lng: 76.92, tier: "red" },

  // YELLOW zone (11)
  { name: "Bagalkot",        population: 1889752, literacy: 68.8, lat: 16.18, lng: 75.69, tier: "yellow" },
  { name: "Bidar",           population: 1703300, literacy: 70.5, lat: 17.91, lng: 77.53, tier: "yellow" },
  { name: "Chikkaballapur",  population: 1255104, literacy: 70.1, lat: 13.43, lng: 77.73, tier: "yellow" },
  { name: "Vijayanagara",    population: 1353628, literacy: 70.3, lat: 15.28, lng: 76.46, tier: "yellow" },
  { name: "Mandya",          population: 1805769, literacy: 70.4, lat: 12.52, lng: 76.90, tier: "yellow" },
  { name: "Ramanagara",      population: 1082636, literacy: 69.2, lat: 12.72, lng: 77.28, tier: "yellow" },
  { name: "Mysuru",          population: 3001127, literacy: 72.8, lat: 12.30, lng: 76.65, tier: "yellow" },
  { name: "Kolar",           population: 1536401, literacy: 74.4, lat: 13.13, lng: 78.13, tier: "yellow" },
  { name: "Belagavi",        population: 4779661, literacy: 73.5, lat: 15.85, lng: 74.50, tier: "yellow" },
  { name: "Chitradurga",     population: 1659456, literacy: 73.7, lat: 14.23, lng: 76.40, tier: "yellow" },
  { name: "Gadag",           population: 1065235, literacy: 75.1, lat: 15.42, lng: 75.62, tier: "yellow" },

  // GREEN zone (13)
  { name: "Haveri",          population: 1597668, literacy: 77.6, lat: 14.79, lng: 75.40, tier: "green" },
  { name: "Davanagere",      population: 1945497, literacy: 75.7, lat: 14.46, lng: 75.92, tier: "green" },
  { name: "Hassan",          population: 1776421, literacy: 76.0, lat: 13.00, lng: 76.10, tier: "green" },
  { name: "Tumakuru",        population: 2678980, literacy: 75.1, lat: 13.34, lng: 77.10, tier: "green" },
  { name: "Bengaluru Rural", population: 990923,  literacy: 77.9, lat: 13.22, lng: 77.57, tier: "green" },
  { name: "Chikkamagaluru",  population: 1137961, literacy: 79.2, lat: 13.31, lng: 75.77, tier: "green" },
  { name: "Dharwad",         population: 1846993, literacy: 80.0, lat: 15.45, lng: 75.00, tier: "green" },
  { name: "Shivamogga",      population: 1752753, literacy: 80.4, lat: 13.93, lng: 75.57, tier: "green" },
  { name: "Kodagu",          population: 554519,  literacy: 82.6, lat: 12.42, lng: 75.74, tier: "green" },
  { name: "Uttara Kannada",  population: 1437169, literacy: 84.0, lat: 14.80, lng: 74.13, tier: "green" },
  { name: "Udupi",           population: 1177361, literacy: 86.2, lat: 13.34, lng: 74.74, tier: "green" },
  { name: "Dakshina Kannada",population: 2089649, literacy: 88.6, lat: 12.87, lng: 74.84, tier: "green" },
  { name: "Bengaluru Urban", population: 9621551, literacy: 87.7, lat: 12.97, lng: 77.59, tier: "green" },
];

export const SCHEMES = [
  "PM Kisan",
  "PDS",
  "Scholarship",
  "MGNREGA",
  "Housing",
  "Health Insurance",
  "Midday Meal",
  "Pension",
  "Skill Development",
  "Udyam Employment",
] as const;

export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025] as const;

export type Scheme = (typeof SCHEMES)[number];
