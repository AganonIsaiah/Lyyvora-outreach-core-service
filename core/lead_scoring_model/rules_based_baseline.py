import sqlite3
import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, Any

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
DB_FILE = os.path.join(PROJECT_ROOT, "datasets", "real_set_v1", "records.db")
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    filename=os.path.join(LOG_DIR, "rules_based_baseline.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

MODEL_VERSION = "rules_v1"

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

def rules_based_score(lead: Dict[str, Any]) -> Dict[str, Any]:
    score = 0
    top_features = []

    if lead.get("phone"):
        score += 20
        top_features.append("Has valid phone number.")
        
    if lead.get("email"):
        score += 20
        top_features.append("Has valid email address.")
        
    if lead.get("website_url"):
        score += 10
        top_features.append("Has valid website url.")
    
    if lead.get("total_reviews") is not None and lead.get("total_reviews", 0) >= 30.0:
        score += 10
        top_features.append("Has at least 30 reviews.")
        
    if lead.get("average_rating") is not None and lead.get("average_rating", 0) >= 4.5:
        score += 10
        top_features.append("Has an average rating of at least 4.5.")
        
    subtypes = lead.get("clinic_sub_type")
    if subtypes:
        subtypes_list = [s.strip().lower() for s in subtypes.split(",")]

        keywords = ["dental", "physio", "clinic", "spa"]
        matched_keywords = []

        for keyword in keywords:
            for subtype in subtypes_list:
                if keyword in subtype: 
                    matched_keywords.append(keyword.capitalize())
                    score += 20  
                    break  

        if matched_keywords:
            top_features.append(f"Matched subtypes: {', '.join(matched_keywords)}")

    score = min(score, 100)
    explanation = f"Rules applied: {', '.join(top_features)}"

    logging.debug(f"Lead ID {lead.get('id', 'N/A')}: score={score}, features={top_features}")
    return {"score": score, "top_features": top_features, "explanation": explanation}

def get_connection():
    return sqlite3.connect(DB_FILE)

def ensure_tables(conn):
    try:
        cursor = conn.cursor()
        logging.info("Ensuring lead_scores table exists.")
        cursor.execute(LEAD_SCORES_TABLE_SCHEMA)
        conn.commit()
        logging.info("lead_scores table verified/created successfully.")
    except sqlite3.Error as e:
        logging.error(f"Error creating lead_scores table: {e}")
        raise


def fetch_leads(conn):
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leads")
        rows = cursor.fetchall()
        logging.info(f"Fetched {len(rows)} leads from the database.")
        if rows:
            logging.debug(f"Lead columns: {rows[0].keys()}")
        return [dict(row) for row in rows]
    except sqlite3.Error as e:
        logging.error(f"Failed to fetch leads: {e}")
        return []

def already_scored(conn, leads_id: int) -> bool:
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 1 FROM lead_scores
        WHERE leads_id = ? AND model_version = ?
        LIMIT 1
    """, (leads_id, MODEL_VERSION))
    return cursor.fetchone() is not None

def insert_score(conn, leads_id: int, score_data: Dict[str, Any]):
    try:
        cursor = conn.cursor()
        logging.info(f"Inserting score for lead ID {leads_id}: {score_data['score']}")
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
            score_data["score"],
            json.dumps(score_data["top_features"]),
            score_data["explanation"],
            datetime.now(timezone.utc).isoformat(),
            MODEL_VERSION
        ))
        conn.commit()
        logging.info(f"Score inserted successfully for lead ID {leads_id}")
    except sqlite3.IntegrityError as e:
        logging.warning(f"Failed to insert score for lead ID {leads_id}: {e}")
    except sqlite3.Error as e:
        logging.error(f"Database error on lead ID {leads_id}: {e}")
        raise

def run_rules_baseline():
    logging.info("Starting rules-based baseline scoring")

    conn = get_connection()
    ensure_tables(conn)

    leads = fetch_leads(conn)
    logging.info(f"Fetched {len(leads)} leads")

    scored = 0
    skipped = 0

    logging.info("Starting rules-based scoring loop.")
    for lead in leads:
        lead_id = lead.get("id")
        logging.debug(f"Processing lead ID: {lead_id}")

        if already_scored(conn, lead_id):
            skipped += 1
            logging.debug(f"Lead ID {lead_id} already scored, skipping.")
            continue

        score_data = rules_based_score(lead)
        insert_score(conn, lead_id, score_data)
        scored += 1

    conn.close()

    logging.info(
        f"Rules baseline complete | scored={scored}, skipped={skipped}, model={MODEL_VERSION}"
    )
    print(
        f"Rules baseline complete | scored={scored}, skipped={skipped}, model={MODEL_VERSION}"
    )

if __name__ == "__main__":
    run_rules_baseline()