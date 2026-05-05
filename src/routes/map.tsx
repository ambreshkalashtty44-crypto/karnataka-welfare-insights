import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, GeoJSON } from "react-leaflet";
import { PageHeader } from "@/components/app/PageHeader";
import { useDataset } from "@/lib/dataStore";
import { KARNATAKA_DISTRICTS } from "@/data/karnataka";

export const Route = createFileRoute("/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "District Map · Karnataka Welfare Analyzer" },
      { name: "description", content: "Interactive Karnataka district map color-coded by welfare scheme coverage." },
    ],
  }),
  component: MapPage,
});

function color(score: number | null) {
  if (score == null) return "#9aa3ad";
  if (score < 0.5) return "#d64545";
  if (score < 0.75) return "#e3b341";
  return "#3fa66a";
}

interface DistrictInfo { avg: number; worst: { scheme: string; score: number } }

function MapPage() {
  const data = useDataset();
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/geohacker/karnataka/master/district/karnataka_district.geojson")
      .then((r) => (r.ok ? r.json() : null)).then(setGeo).catch(() => setGeo(null));
  }, []);

  const info = useMemo(() => {
    const m = new Map<string, DistrictInfo>();
    if (!data) return m;
    const latest = Math.max(...data.map((d) => d.year));
    for (const dist of new Set(data.map((d) => d.district))) {
      const rows = data.filter((r) => r.district === dist && r.year === latest);
      const avg = rows.reduce((s, r) => s + r.coverage_gap_score, 0) / rows.length;
      const worst = rows.reduce((a, b) => (a.coverage_gap_score < b.coverage_gap_score ? a : b));
      m.set(dist, { avg, worst: { scheme: worst.scheme, score: worst.coverage_gap_score } });
    }
    return m;
  }, [data]);

  const lookup = (name: string): DistrictInfo | null => {
    if (!name) return null;
    const norm = name.toLowerCase().replace(/\s+/g, "");
    for (const [k, v] of info) {
      if (k.toLowerCase().replace(/\s+/g, "") === norm) return v;
    }
    return null;
  };

  return (
    <>
      <PageHeader title="District Map" subtitle="Color-coded coverage across all 31 districts of Karnataka" />
      <div className="p-8 space-y-4">
        <Legend />
        <div className="rounded-xl border overflow-hidden bg-card shadow-sm" style={{ height: 600 }}>
          {data && (
            <MapContainer center={[14.5, 76.0]} zoom={7} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {geo && (
                <GeoJSON
                  data={geo}
                  style={(f) => {
                    const p = f?.properties as Record<string, string> | undefined;
                    const name = p?.DISTRICT || p?.district || p?.NAME_2 || "";
                    return { color: "#374151", weight: 1, fillColor: color(lookup(name)?.avg ?? null), fillOpacity: 0.55 };
                  }}
                />
              )}
              {KARNATAKA_DISTRICTS.map((d) => {
                const i = info.get(d.name) ?? null;
                return (
                  <CircleMarker
                    key={d.name}
                    center={[d.lat, d.lng]}
                    radius={10}
                    pathOptions={{ color: "#1f2937", weight: 1, fillColor: color(i?.avg ?? null), fillOpacity: 0.9 }}
                  >
                    <Tooltip direction="top">{d.name}</Tooltip>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold text-base">{d.name}</div>
                        <div className="mt-1">Coverage: <strong>{i ? (i.avg * 100).toFixed(1) + "%" : "No Data"}</strong></div>
                        {i && (
                          <div>Worst scheme: <strong>{i.worst.scheme}</strong> ({(i.worst.score * 100).toFixed(1)}%)</div>
                        )}
                        <div className="mt-1 text-xs opacity-70">Population: {d.population.toLocaleString()} · Literacy: {d.literacy}%</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </>
  );
}

function Legend() {
  const items = [
    { c: "#d64545", l: "Critical (< 50%)" },
    { c: "#e3b341", l: "Moderate (50–75%)" },
    { c: "#3fa66a", l: "Good (> 75%)" },
    { c: "#9aa3ad", l: "No Data" },
  ];
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {items.map((i) => (
        <div key={i.l} className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: i.c }} />
          {i.l}
        </div>
      ))}
    </div>
  );
}
