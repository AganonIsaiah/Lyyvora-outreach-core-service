import json
from typing import Dict, Any, List
from datetime import datetime, UTC

from configs.logging_module import Logger
from configs.database import supabase

MODEL_VERSION = "rules_v1"
BATCH_SIZE = 500
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
        score += 25
        top_features.append("Has a website description.")

    if lead.get("total_reviews") is not None and lead.get("total_reviews") >= 30:
        score += 15
        top_features.append("Has at least 30 reviews.")

    if lead.get("average_rating") is not None and lead.get("average_rating") >= 4.5:
        score += 20
        top_features.append("Has an average rating of at least 4.5.")

    # subtypes = lead.get("clinic_sub_type")
    # if subtypes:
    #     subs = [s.strip().lower() for s in subtypes.split(",")]
    #     keywords = ["dental", "physio", "clinic", "spa"]
    #     matched = [k.capitalize() for k in keywords if any(k in s for s in subs)]
    #     if matched:
    #         score += 10 * len(matched)
    #         top_features.append(f"Matched subtypes: {', '.join(set(matched))}")

    score = min(score, 100)
    explanation = f"Rules applied: {', '.join(top_features)}"
    logger.debug(f"[Scoring] Lead {lead.get('id')} → score={score}")

    return {
        "score": score,
        "top_features": top_features,
        "explanation": explanation,
    }


def fetch_leads() -> List[Dict[str, Any]]:
    logger.info("Fetching leads from Supabase...")
    try:
        res = supabase.table("leads").select("*").execute()
        leads = res.data or []
        logger.info(f"Fetched {len(leads)} leads.")
        return leads
    except Exception as e:
        logger.critical(f"Failed to fetch leads: {e}")
        return []


def fetch_already_scored_ids() -> set:
    logger.info("Fetching already-scored lead IDs...")
    scored_ids = set()
    offset = 0
    limit = 1000

    while True:
        try:
            res = (
                supabase.table("lead_scores")
                .select("leads_id")
                .eq("model_version", MODEL_VERSION)
                .range(offset, offset + limit - 1)
                .execute()
            )
            batch = res.data or []
            if not batch:
                break
            for row in batch:
                if row.get("leads_id") is not None:
                    scored_ids.add(row["leads_id"])
            offset += limit
        except Exception as e:
            logger.error(f"Failed while fetching scored IDs: {e}")
            break

    logger.info(f"Found {len(scored_ids)} already-scored leads.")
    return scored_ids


def bulk_insert_scores(payload: List[Dict[str, Any]]) -> int:
    if not payload:
        return 0

    try:
        supabase.table("lead_scores").insert(payload).execute()
        return len(payload)
    except Exception as e:
        logger.error(f"Bulk insert failed for batch size {len(payload)}: {e}")
        return 0


def run_rules_baseline():
    start_time = datetime.now(UTC)
    logger.info("========== RULES BASELINE STARTED ==========")
    logger.info(f"Model version: {MODEL_VERSION}")

    leads = fetch_leads()
    already_scored_ids = fetch_already_scored_ids()

    scored = skipped = failed = 0
    batch = []

    for lead in leads:
        lead_id = lead.get("id")

        if not lead_id:
            failed += 1
            logger.warning("Skipped lead with missing ID.")
            continue

        if lead_id in already_scored_ids:
            skipped += 1
            continue

        try:
            score_data = rules_based_score(lead)
            batch.append(
                {
                    "leads_id": lead_id,
                    "score": score_data["score"],
                    "top_features": json.dumps(score_data["top_features"]),
                    "explanation": score_data["explanation"],
                    "model_version": MODEL_VERSION,
                }
            )

            if len(batch) >= BATCH_SIZE:
                inserted = bulk_insert_scores(batch)
                scored += inserted
                batch.clear()

        except Exception as e:
            failed += 1
            logger.exception(f"Scoring crash on lead {lead_id}: {e}")

    if batch:
        inserted = bulk_insert_scores(batch)
        scored += inserted

    elapsed = (datetime.now(UTC) - start_time).total_seconds()

    logger.info("========== RULES BASELINE FINISHED ==========")
    logger.info(f"Scored: {scored}")
    logger.info(f"Skipped: {skipped}")
    logger.info(f"Failed: {failed}")
    logger.info(f"Runtime: {elapsed:.2f}s")
    logger.info(f"Model: {MODEL_VERSION}")


if __name__ == "__main__":
    run_rules_baseline()
