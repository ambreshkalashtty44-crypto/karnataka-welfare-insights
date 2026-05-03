import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON } from "react-leaflet";
import { PageHeader } from "@/components/app/PageHeader";
import { fetchData } from "@/server/api.functions";
import { KARNATAKA_DISTRICTS } from "@/data/karnataka";
import type { Record as Rec } from "@/server/analyzer.server";

export const Route = createFileRoute("/map")({
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

function MapPage() {
  const [data, setData] = useState<Rec[] | null>(null);
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetchData().then(setData);
    // Try to fetch Karnataka district GeoJSON; fall back gracefully if blocked.
    fetch("https://raw.githubusercontent.com/geohacker/karnataka/master/district/karnataka_district.geojson")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setGeo(j))
      .catch(() => setGeo(null));
  }, []);

  const byDistrict = useMemo(() => {
    const m = new Map<string, number>();
    if (!data) return m;
    const latest = Math.max(...data.map((d) => d.year));
    for (const dist of new Set(data.map((d) => d.district))) {
      const rows = data.filter((r) => r.district === dist && r.year === latest);
      m.set(dist, rows.reduce((s, r) => s + r.coverage_gap_score, 0) / rows.length);
    }
    return m;
  }, [data]);

  const lookup = (name: string): number | null => {
    if (!name) return null;
    const norm = name.toLowerCase().replace(/\s+/g, "");
    for (const [k, v] of byDistrict) {
      if (k.toLowerCase().replace(/\s+/g, "") === norm) return v;
    }
    return null;
  };

  return (
    <>
      <PageHeader
        title="District Map"
        subtitle="Color-coded coverage across all 31 districts of Karnataka"
      />
      <div className="p-8 space-y-4">
        <Legend />
        <div className="rounded-xl border overflow-hidden bg-card shadow-sm" style={{ height: 600 }}>
          {data && (
            <MapContainer
              center={[14.5, 76.0]}
              zoom={7}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geo && (
                <GeoJSON
                  data={geo}
                  style={(f) => {
                    const name =
                      (f?.properties as Record<string, string> | undefined)?.DISTRICT ||
                      (f?.properties as Record<string, string> | undefined)?.district ||
                      (f?.properties as Record<string, string> | undefined)?.NAME_2 ||
                      "";
                    const score = lookup(name);
                    return {
                      color: "#374151",
                      weight: 1,
                      fillColor: color(score),
                      fillOpacity: 0.55,
                    };
                  }}
                  onEachFeature={(f, layer) => {
                    const props = f.properties as Record<string, string> | undefined;
                    const name = props?.DISTRICT || props?.district || props?.NAME_2 || "Unknown";
                    const s = lookup(name);
                    layer.bindTooltip(
                      `<strong>${name}</strong><br/>Coverage: ${
                        s == null ? "No Data" : (s * 100).toFixed(1) + "%"
                      }`,
                      { sticky: true }
                    );
                  }}
                />
              )}
              {KARNATAKA_DISTRICTS.map((d) => {
                const s = byDistrict.get(d.name) ?? null;
                return (
                  <CircleMarker
                    key={d.name}
                    center={[d.lat, d.lng]}
                    radius={9}
                    pathOptions={{
                      color: "#1f2937",
                      weight: 1,
                      fillColor: color(s),
                      fillOpacity: 0.9,
                    }}
                  >
                    <Tooltip direction="top">
                      <div>
                        <strong>{d.name}</strong>
                        <br />
                        Coverage: {s == null ? "No Data" : (s * 100).toFixed(1) + "%"}
                      </div>
                    </Tooltip>
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