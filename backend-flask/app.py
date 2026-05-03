"""
Optional Flask backend — equivalent to the TanStack server functions used in the
running app. Deploy this on Render/Railway and point the frontend at it by
swapping the createServerFn calls with `fetch(API_URL + '/data')` etc.

Run:
    pip install -r requirements.txt
    python app.py        # serves on http://localhost:5000
"""
from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from mlxtend.frequent_patterns import apriori, association_rules

app = Flask(__name__)
CORS(app)

DISTRICTS = [
    ("Bagalkot", 1889752, 68.8), ("Ballari", 2452595, 67.4),
    ("Belagavi", 4779661, 73.5), ("Bengaluru Rural", 990923, 77.9),
    ("Bengaluru Urban", 9621551, 87.7), ("Bidar", 1703300, 70.5),
    ("Chamarajanagar", 1020791, 61.4), ("Chikkaballapur", 1255104, 70.1),
    ("Chikkamagaluru", 1137961, 79.2), ("Chitradurga", 1659456, 73.7),
    ("Dakshina Kannada", 2089649, 88.6), ("Davanagere", 1945497, 75.7),
    ("Dharwad", 1846993, 80.0), ("Gadag", 1065235, 75.1),
    ("Hassan", 1776421, 76.0), ("Haveri", 1597668, 77.6),
    ("Kalaburagi", 2566326, 64.8), ("Kodagu", 554519, 82.6),
    ("Kolar", 1536401, 74.4), ("Koppal", 1389920, 68.1),
    ("Mandya", 1805769, 70.4), ("Mysuru", 3001127, 72.8),
    ("Raichur", 1928812, 59.6), ("Ramanagara", 1082636, 69.2),
    ("Shivamogga", 1752753, 80.4), ("Tumakuru", 2678980, 75.1),
    ("Udupi", 1177361, 86.2), ("Uttara Kannada", 1437169, 84.0),
    ("Vijayapura", 2177331, 67.2), ("Yadgir", 1174271, 51.8),
    ("Vijayanagara", 1353628, 70.3),
]
SCHEMES = ["PM Kisan", "PDS", "Scholarship", "MGNREGA", "Ayushman Bharat", "Ujjwala Yojana"]
YEARS = [2020, 2021, 2022, 2023, 2024]


def build_dataset():
    rng = np.random.default_rng(42)
    rows = []
    for name, pop, lit in DISTRICTS:
        lit_factor = (lit - 50) / 50
        for scheme in SCHEMES:
            trend = 0
            for year in YEARS:
                trend += 0.015 + rng.random() * 0.02
                eligible = int(pop * (0.18 + rng.random() * 0.12))
                cov = 0.35 + lit_factor * 0.35 + (hash(scheme) % 20) / 100 + trend + (rng.random() - 0.5) * 0.1
                cov = float(np.clip(cov, 0.15, 0.98))
                actual = int(eligible * cov)
                rows.append({
                    "District": name, "Scheme": scheme, "Year": year,
                    "Population": pop, "Eligible": eligible, "Actual": actual,
                    "Coverage_Gap_Score": round(actual / eligible, 4),
                })
    return pd.DataFrame(rows)


DF = build_dataset()


@app.route("/data")
def data():
    return jsonify(DF.to_dict(orient="records"))


@app.route("/rules")
def rules():
    latest = DF[DF.Year == DF.Year.max()].copy()
    latest["level"] = pd.cut(latest.Coverage_Gap_Score, [0, 0.5, 0.75, 1.01],
                             labels=["low", "med", "high"])
    latest["item"] = latest.Scheme + "=" + latest.level.astype(str)
    basket = latest.groupby("District")["item"].apply(lambda s: list(set(s)))
    items = sorted({i for lst in basket for i in lst})
    onehot = pd.DataFrame([{i: (i in lst) for i in items} for lst in basket])
    freq = apriori(onehot, min_support=0.15, use_colnames=True)
    ar = association_rules(freq, metric="confidence", min_threshold=0.6)
    out = []
    for _, r in ar.iterrows():
        a = list(r["antecedents"]); c = list(r["consequents"])
        if len(a) == 1 and len(c) == 1 and a[0].split("=")[0] != c[0].split("=")[0]:
            out.append({"antecedent": a[0], "consequent": c[0],
                        "support": round(r["support"], 3),
                        "confidence": round(r["confidence"], 3),
                        "lift": round(r["lift"], 3)})
    return jsonify(sorted(out, key=lambda x: -x["confidence"])[:20])


@app.route("/clusters")
def clusters():
    agg = DF.groupby("District").Coverage_Gap_Score.mean().reset_index()
    lit = pd.DataFrame(DISTRICTS, columns=["District", "Population", "Literacy"])
    merged = agg.merge(lit, on="District")
    km = KMeans(n_clusters=4, n_init=10, random_state=42).fit(merged[["Coverage_Gap_Score"]])
    merged["cluster"] = km.labels_
    # remap so cluster 0 = worst
    order = np.argsort(km.cluster_centers_.flatten())
    remap = {old: new for new, old in enumerate(order)}
    merged["cluster"] = merged.cluster.map(remap)
    labels = ["Critically Underserved", "Moderately Underserved", "Average Performing", "Well Performing"]
    actions = ["Immediate state intervention & awareness drives",
               "Targeted outreach and last-mile delivery audits",
               "Scheme consolidation & process digitisation",
               "Maintain & share best-practices state-wide"]
    summary = []
    for cid in range(4):
        members = merged[merged.cluster == cid]
        summary.append({"id": cid, "label": labels[cid], "action": actions[cid],
                        "avgCoverage": round(members.Coverage_Gap_Score.mean(), 3),
                        "districts": members.District.tolist()})
    points = [{"district": r.District, "literacy": r.Literacy,
               "avgCoverage": round(r.Coverage_Gap_Score, 4), "cluster": int(r.cluster)}
              for _, r in merged.iterrows()]
    return jsonify({"points": points, "summary": summary})


if __name__ == "__main__":
    app.run(debug=True, port=5000)