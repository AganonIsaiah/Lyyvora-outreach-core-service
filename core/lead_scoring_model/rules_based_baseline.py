import sqlite3
import json
from datetime import datetime, timezone
from typing import Dict, Any

from configs.logging_module import Logger
from configs.path_configs import DB_FILE
from configs.queries import Queries

MODEL_VERSION = "rules_v1"
logger = Logger(log_file="rules_based_baseline.log")


def rules_based_score(lead: Dict[str, Any]) -> Dict[str, Any]:
    score = 0
    top_features = []

    if lead.get("phone"):
        score += 10
        top_features.append("Has valid phone number.")

    if lead.get("email"):
        score += 20
        top_features.append("Has valid email address.")

    if lead.get("website_url"):
        score += 10
        top_features.append("Has valid website url.")

    if lead.get("website_desc"):
        score += 20
        top_features.append(f"Has a website description.")

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
                    score += 10
                    break

        if matched_keywords:
            top_features.append(f"Matched subtypes: {', '.join(matched_keywords)}")

    score = min(score, 100)
    explanation = f"Rules applied: {', '.join(top_features)}"
    logger.debug(
        f"Lead ID {lead.get('id', 'N/A')}: score={score}, features={top_features}"
    )
    return {"score": score, "top_features": top_features, "explanation": explanation}


def get_connection():
    return sqlite3.connect(DB_FILE)


def ensure_tables(conn):
    try:
        cursor = conn.cursor()
        logger.info("Ensuring lead_scores table exists.")
        cursor.execute(Queries.create_table_lead_scores())
        conn.commit()
        logger.info("lead_scores table verified/created successfully.")
    except sqlite3.Error as e:
        logger.error(f"Error creating lead_scores table: {e}")
        raise


def fetch_leads(conn):
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(Queries.fetch_leads())
        rows = cursor.fetchall()
        logger.info(f"Fetched {len(rows)} leads from the database.")
        if rows:
            logger.debug(f"Lead columns: {rows[0].keys()}")
        return [dict(row) for row in rows]
    except sqlite3.Error as e:
        logger.error(f"Failed to fetch leads: {e}")
        return []


def already_scored(conn, leads_id: int) -> bool:
    cursor = conn.cursor()
    cursor.execute(Queries.already_scored(), (leads_id, MODEL_VERSION))
    return cursor.fetchone() is not None


def insert_score(conn, leads_id: int, score_data: Dict[str, Any]):
    try:
        cursor = conn.cursor()
        logger.info(f"Inserting score for lead ID {leads_id}: {score_data['score']}")
        cursor.execute(
            Queries.insert_lead_score(),
            (
                leads_id,
                score_data["score"],
                json.dumps(score_data["top_features"]),
                score_data["explanation"],
                datetime.now(timezone.utc).isoformat(),
                MODEL_VERSION,
            ),
        )
        conn.commit()
        logger.info(f"Score inserted successfully for lead ID {leads_id}")
    except sqlite3.IntegrityError as e:
        logger.warning(f"Failed to insert score for lead ID {leads_id}: {e}")
    except sqlite3.Error as e:
        logger.error(f"Database error on lead ID {leads_id}: {e}")
        raise


def run_rules_baseline():
    logger.info("Starting rules-based baseline scoring")
    conn = get_connection()
    ensure_tables(conn)
    leads = fetch_leads(conn)
    scored, skipped = 0, 0
    logger.info("Starting rules-based scoring loop.")

    for lead in leads:
        lead_id = lead.get("id")
        logger.debug(f"Processing lead ID: {lead_id}")

        if already_scored(conn, lead_id):
            skipped += 1
            logger.debug(f"Lead ID {lead_id} already scored, skipping.")
            continue

        score_data = rules_based_score(lead)
        insert_score(conn, lead_id, score_data)
        scored += 1

    conn.close()
    logger.info(
        f"Rules baseline complete | scored={scored}, skipped={skipped}, model={MODEL_VERSION}"
    )
    print(
        f"Rules baseline complete | scored={scored}, skipped={skipped}, model={MODEL_VERSION}"
    )


if __name__ == "__main__":
    run_rules_baseline()
