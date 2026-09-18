# Karnataka Welfare Scheme Utilization Analyzer

# Karnataka Welfare Insight 

Project Link: https://karnataka-insight-hub.vercel.app/

Final-year CSE project: full-stack analytics dashboard for welfare scheme
coverage across the 31 districts of Karnataka. Includes descriptive
statistics, an interactive map, scheme comparison, Apriori association rule
mining, KMeans district clustering, and a downloadable PDF coverage gap
report.

## Folder Structure

```
src/
  data/karnataka.ts          district master + schemes + years
  server/
    analyzer.server.ts       dataset gen, Apriori, KMeans (server-only)
    api.functions.ts         /data /rules /clusters endpoints
  components/app/            sidebar, headers, chart registration
  routes/
    __root.tsx
    index.tsx                Dashboard
    map.tsx                  District map (Leaflet)
    schemes.tsx              Scheme comparison
    rules.tsx                Association rules (Apriori)
    clusters.tsx             District clusters (KMeans)
    report.tsx               Coverage gap report + PDF export
backend-flask/               Optional Python equivalent backend
  app.py
  requirements.txt
```

## Tech Stack

- React 19 + TypeScript + TanStack Start (Vite)
- Chart.js + react-chartjs-2
- Leaflet + react-leaflet (with GeoJSON district overlay)
- jsPDF + jspdf-autotable
- Backend: TanStack Server Functions provide /data, /rules, /clusters as RPC
  endpoints (no separate server needed). A Flask + pandas + scikit-learn +
  mlxtend equivalent is included under `backend-flask/`.

## Run Locally

```bash
bun install
bun run dev      # http://localhost:5173
```

Optional Flask backend:

```bash
cd backend-flask
pip install -r requirements.txt
python app.py    # http://localhost:5000
```

## Deployment

- Frontend: push to GitHub then import on Vercel. TanStack server functions
  deploy automatically as serverless functions.
- Flask backend (only if used): deploy `backend-flask/` to Render or Railway
  with start command `gunicorn app:app`.

## API

| Endpoint    | Returns |
|-------------|---------|
| `/data`     | District x Scheme x Year records |
| `/rules`    | Apriori rules with support/confidence/lift |
| `/clusters` | KMeans points + 4 cluster summaries |
