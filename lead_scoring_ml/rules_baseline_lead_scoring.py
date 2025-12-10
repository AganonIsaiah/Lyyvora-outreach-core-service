import os
import sqlite3
import pandas as pd
import json

# -------------------------------------------------------------
# Paths
# -------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_FILE = os.path.join(BASE_DIR, "data", "mock_data_sets", "mock_lead_cleaned_data.db")

# -------------------------------------------------------------
# Rule Weights and Priority Maps
# -------------------------------------------------------------
RULE_WEIGHTS = {
    "has_email": 20,
    "has_phone": 15,
    "has_website": 10,
    "has_financing_keywords": 10,
    "specialty_priority": 20,
    "province_priority": 5,
    "size_keywords": 10,
    "job_keywords": 10,
}

PRIORITY_SPECIALTIES = {
    "ORTHODONTICS": 100,
    "COSMETIC": 90,
    "DENTAL": 70,
    "DERM": 60,
}

PRIORITY_PROVINCES = {"ON", "BC", "QC"}

FINANCING_KW = {"financing", "payment plan", "plans"}
SIZE_KW = {"chair", "chairs", "rooms", "multi", "large"}
JOB_KW = {"hiring", "careers", "positions", "join our team"}


# -------------------------------------------------------------
# Load Leads
# -------------------------------------------------------------
def load_leads():
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT * FROM leads;", conn)
    conn.close()
    return df


# -------------------------------------------------------------
# Feature Extraction
# -------------------------------------------------------------
def extract_features(row):
    notes = (row.get("notes") or "").lower()
    website = (row.get("website") or "").lower()
    specialty = (row.get("specialty") or "").upper()
    province = (row.get("province") or "").upper()

    return {
        "has_email": bool(row.get("email")),
        "has_phone": bool(row.get("phone")),
        "has_website": bool(row.get("website")),
        "has_financing_keywords": any(k in notes for k in FINANCING_KW),
        "size_keywords": any(k in notes for k in SIZE_KW),
        "job_keywords": any(k in notes for k in JOB_KW),
        "specialty_priority_value": max(
            (v for k, v in PRIORITY_SPECIALTIES.items() if k in specialty), default=0
        ),
        "province_priority": province in PRIORITY_PROVINCES
    }


# -------------------------------------------------------------
# Rule-Based Lead Scoring
# -------------------------------------------------------------
def score_lead(features):
    components = {}

    components["has_email"] = RULE_WEIGHTS["has_email"] if features["has_email"] else 0
    components["has_phone"] = RULE_WEIGHTS["has_phone"] if features["has_phone"] else 0
    components["has_website"] = RULE_WEIGHTS["has_website"] if features["has_website"] else 0

    components["has_financing_keywords"] = (
        RULE_WEIGHTS["has_financing_keywords"] if features["has_financing_keywords"] else 0
    )

    components["size_keywords"] = (
        RULE_WEIGHTS["size_keywords"] if features["size_keywords"] else 0
    )

    components["job_keywords"] = (
        RULE_WEIGHTS["job_keywords"] if features["job_keywords"] else 0
    )

    # Scale specialty to 0–20 based on priority map
    spec_val = features["specialty_priority_value"]
    components["specialty_priority"] = (spec_val / 100) * RULE_WEIGHTS["specialty_priority"]

    components["province_priority"] = (
        RULE_WEIGHTS["province_priority"] if features["province_priority"] else 0
    )

    raw_score = sum(components.values())
    max_possible = sum(RULE_WEIGHTS.values())
    normalized = (raw_score / max_possible) * 100

    return normalized, components


# -------------------------------------------------------------
# Score Entire DataFrame
# -------------------------------------------------------------
def score_dataframe(df: pd.DataFrame):
    scores = []
    breakdowns = []
    labels = []

    for _, row in df.iterrows():
        features = extract_features(row.to_dict())
        score, components = score_lead(features)

        scores.append(round(score, 2))

        # Store breakdown as JSON string
        breakdowns.append(json.dumps(components))

        # Weak label: 1 = high priority, 0 = normal
        labels.append(1 if score >= 70 else 0)

    df["lead_score"] = scores
    df["score_breakdown"] = breakdowns
    df["weak_label"] = labels
    
    df = df.sort_values(by="lead_score", ascending=False)
    return df


# -------------------------------------------------------------
# Save scored data into new table
# -------------------------------------------------------------
def save_scored(df):
    conn = sqlite3.connect(DB_FILE)
    df.to_sql("leads_scored", conn, if_exists="replace", index=False)
    conn.close()


# -------------------------------------------------------------
# Main
# -------------------------------------------------------------
def main():
    print("Loading cleaned leads...")
    df = load_leads()
    print(f"Loaded {len(df)} leads from DB.")

    print("Scoring leads with rule-based baseline...")
    df = score_dataframe(df)

    print("Saving scored leads to SQLite...")
    save_scored(df)

    print("Completed rule-based scoring baseline.")


if __name__ == "__main__":
    main()
