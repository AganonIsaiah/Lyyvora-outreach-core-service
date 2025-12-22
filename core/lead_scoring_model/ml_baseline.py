import sqlite3
import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, Any

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

# --------------------------------
# Paths & Logging
# --------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
DB_FILE = os.path.join(PROJECT_ROOT, "datasets", "real_set_v1", "records.db")
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    filename=os.path.join(LOG_DIR, "ml_baseline.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

MODEL_VERSION = "ml_v1"

LEAD_SCORES_TABLE_SCHEMA = """
CREATE TABLE IF NOT EXISTS lead_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leads_id INTEGER NOT NULL,
    score REAL,
    top_features TEXT,
    explanation TEXT,
    created_at DATETIME,
    model_version TEXT,
    FOREIGN KEY (leads_id) REFERENCES leads(id)
);
"""

# -------------------------------
# Helper functions
# -------------------------------
def get_connection():
    return sqlite3.connect(DB_FILE)

def ensure_table(conn):
    cursor = conn.cursor()
    cursor.execute(LEAD_SCORES_TABLE_SCHEMA)
    conn.commit()

def fetch_leads(conn) -> pd.DataFrame:
    conn.row_factory = sqlite3.Row
    df = pd.read_sql_query("SELECT * FROM leads", conn)
    logging.info(f"Fetched {len(df)} leads from database.")
    return df

def preprocess_features(df: pd.DataFrame) -> pd.DataFrame:
    # Create features from leads
    df_feat = pd.DataFrame()
    df_feat['has_phone'] = df['phone'].notnull().astype(int)
    df_feat['has_email'] = df['email'].notnull().astype(int)
    df_feat['has_website'] = df['website_url'].notnull().astype(int)
    df_feat['total_reviews'] = df['total_reviews'].fillna(0)
    df_feat['average_rating'] = df['average_rating'].fillna(0.0)
    
    # One-hot encode subtypes for keywords
    keywords = ["dental", "physio", "clinic", "spa"]
    for kw in keywords:
        df_feat[f'subtype_{kw}'] = df['clinic_sub_type'].fillna("").str.lower().apply(lambda x: int(kw in x))
    
    return df_feat

def compute_pseudo_labels(df: pd.DataFrame) -> pd.Series:
    """
    Use rules-based scoring as pseudo-label for ML training
    High score => 1, Low score => 0
    """
    def score_row(row):
        score = 0
        if row['has_phone']: score += 20
        if row['has_email']: score += 20
        if row['has_website']: score += 10
        if row['total_reviews'] >= 30: score += 10
        if row['average_rating'] >= 4.5: score += 10
        for kw in ['dental', 'physio', 'clinic', 'spa']:
            if row[f'subtype_{kw}']: score += 20
        return 1 if score >= 50 else 0  # threshold can be tuned
    
    return df.apply(score_row, axis=1)

def insert_score(conn, leads_id: int, score: float, explanation: str):
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO lead_scores (
            leads_id,
            score,
            top_features,
            explanation,
            created_at,
            model_version
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        leads_id,
        score,
        None,
        explanation,
        datetime.now(timezone.utc).isoformat(),
        MODEL_VERSION
    ))
    conn.commit()

# -------------------------------
# Main
# -------------------------------
def run_ml_baseline():
    logging.info("Starting ML baseline scoring")

    conn = get_connection()
    ensure_table(conn)
    df_leads = fetch_leads(conn)
    
    if df_leads.empty:
        logging.warning("No leads found in database. Exiting.")
        return

    X = preprocess_features(df_leads)
    y = compute_pseudo_labels(X)

    # Train/test split
    X_train, X_test, y_train, y_test, ids_train, ids_test = train_test_split(
        X, y, df_leads['id'], test_size=0.2, random_state=42
    )

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds)
    logging.info(f"ML Baseline | Accuracy: {acc:.3f}, F1: {f1:.3f}")
    print(f"ML Baseline | Accuracy: {acc:.3f}, F1: {f1:.3f}")

    # Insert predictions into lead_scores
    for idx, pred in zip(ids_test, preds):
        explanation = f"ML predicted label: {pred}"
        insert_score(conn, idx, float(pred), explanation)
    
    logging.info("ML baseline scoring complete")
    conn.close()

if __name__ == "__main__":
    run_ml_baseline()
