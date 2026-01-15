import pandas as pd
import re
from urllib.parse import urlparse
from datetime import datetime, UTC

from configs.logging_module import Logger
from configs.types import ClinicStatus
from configs.database import supabase

logger = Logger(log_file="lead_data_pipeline.log")

BATCH_SIZE = 500
EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
NON_DIGITS = re.compile(r"\D")
CLINIC_SPLIT_REGEX = re.compile(r"[@#|-]")


# ---------- Cleaners ----------


def get_primary_email(email1, email2):
    for email in (email1, email2):
        if isinstance(email, str):
            e = email.strip().lower()
            if EMAIL_REGEX.match(e):
                return e
            else:
                logger.warning(f"Dropping invalid email: {e}")
    return None


def clean_text(text):
    return text.strip() if isinstance(text, str) else None


def clean_clinic_name(text):
    if not isinstance(text, str):
        return None
    return CLINIC_SPLIT_REGEX.split(text)[0].strip()


def clean_phone(phone):
    if not isinstance(phone, str):
        return None
    digits = NON_DIGITS.sub("", phone)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) != 10:
        logger.warning(f"Dropping invalid phone: {phone}")
        return None
    return digits


def clean_website(site):
    if not isinstance(site, str) or not site.strip():
        return None
    site = site.strip()
    parsed = urlparse(site)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return site
    if "." in site and " " not in site:
        return site
    logger.warning(f"Invalid website URL: {site}")
    return None


def normalize_province(p):
    if not isinstance(p, str):
        return None
    p = p.strip().upper()
    lookup = {
        "ON": "ON",
        "ONTARIO": "ON",
        "QC": "QC",
        "QUEBEC": "QC",
        "QUÉBEC": "QC",
        "BC": "BC",
        "BRITISH COLUMBIA": "BC",
        "AB": "AB",
        "ALBERTA": "AB",
        "MB": "MB",
        "MANITOBA": "MB",
        "SK": "SK",
        "SASKATCHEWAN": "SK",
        "NS": "NS",
        "NOVA SCOTIA": "NS",
        "NB": "NB",
        "NEW BRUNSWICK": "NB",
        "PE": "PE",
        "PEI": "PE",
        "PRINCE EDWARD ISLAND": "PE",
        "NL": "NL",
        "NF": "NL",
        "NEWFOUNDLAND": "NL",
        "LABRADOR": "NL",
        "NEWFOUNDLAND AND LABRADOR": "NL",
        "YT": "YT",
        "YUKON": "YT",
        "NT": "NT",
        "NWT": "NT",
        "NORTHWEST TERRITORIES": "NT",
        "NU": "NU",
        "NUNAVUT": "NU",
    }
    return lookup.get(p, p)


# ---------- Supabase ----------


def sanitize_record(record: dict) -> dict:
    clean = {}
    for k, v in record.items():
        if pd.isna(v):
            clean[k] = None
        else:
            clean[k] = (
                int(v)
                if isinstance(v, (pd.Int64Dtype, int)) and "reviews" in k
                else float(v)
                if isinstance(v, (float, pd.Float64Dtype))
                else v
            )
    return clean


def save_to_supabase(df: pd.DataFrame):
    logger.info("Saving rows to Supabase...")
    start = datetime.now(UTC)

    records = df.to_dict(orient="records")
    total = len(records)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch = [sanitize_record(r) for r in records[i : i + BATCH_SIZE]]
        try:
            supabase.table("leads").insert(batch).execute()
            inserted += len(batch)
            logger.info(f"Inserted {inserted}/{total} rows...")
        except Exception as e:
            logger.error(f"Batch insert failed at {i}-{i+len(batch)}: {e}")

    elapsed = (datetime.now(UTC) - start).total_seconds()
    rate = inserted / elapsed if elapsed else 0
    logger.info(
        f"Supabase insert finished | rows={inserted} | time={elapsed:.2f}s | rate={rate:.1f}/s"
    )


# ---------- Pipeline ----------


def run_pipeline(file_path: str):
    pipeline_start = datetime.now(UTC)
    logger.info("========== PIPELINE STARTED ==========")

    # ---- Load ----
    t0 = datetime.now(UTC)
    df = pd.read_csv(file_path)
    logger.info(
        f"Loaded {len(df)} rows | time={(datetime.now(UTC)-t0).total_seconds():.2f}s"
    )

    # ---- Normalize columns ----
    df = df.rename(
        columns={
            "business_name": "clinic_name",
            "type": "clinic_main_type",
            "sub_types": "clinic_sub_type",
            "business_website": "website_url",
            "state": "province",
            "business_phone": "phone",
        }
    )

    required = [
        "clinic_name",
        "clinic_main_type",
        "clinic_sub_type",
        "city",
        "province",
        "phone",
        "email_1",
        "email_2",
        "website_url",
        "website_desc",
        "total_reviews",
        "average_rating",
    ]
    for col in required:
        if col not in df.columns:
            df[col] = None
            logger.info(f"Added missing column '{col}'")

    # ---- Cleaning ----
    t0 = datetime.now(UTC)

    for col in ["clinic_main_type", "clinic_sub_type", "city"]:
        df[col] = df[col].map(clean_text)

    df["clinic_name"] = df["clinic_name"].map(clean_clinic_name)
    df["province"] = df["province"].map(normalize_province)
    df["phone"] = df["phone"].map(clean_phone)
    df["website_url"] = df["website_url"].map(clean_website)

    df["email"] = [
        get_primary_email(e1, e2)
        for e1, e2 in zip(df.get("email_1", []), df.get("email_2", []))
    ]

    # ---- Fix numeric types ----
    df["total_reviews"] = (
        pd.to_numeric(df["total_reviews"], errors="coerce").dropna().astype("Int64")
    )
    df["average_rating"] = pd.to_numeric(df["average_rating"], errors="coerce")

    logger.info(
        f"Cleaning completed | time={(datetime.now(UTC)-t0).total_seconds():.2f}s"
    )

    # ---- Deduping ----
    t0 = datetime.now(UTC)
    before = len(df)
    df = df.drop_duplicates(subset=["clinic_name", "city"])
    df = df.dropna(subset=["clinic_name", "email"])
    logger.info(
        f"Dedup/filter removed {before - len(df)} rows | time={(datetime.now(UTC)-t0).total_seconds():.2f}s"
    )

    # ---- Final prep ----
    df = df[
        [
            "clinic_name",
            "clinic_main_type",
            "clinic_sub_type",
            "city",
            "province",
            "phone",
            "email",
            "website_url",
            "website_desc",
            "total_reviews",
            "average_rating",
        ]
    ]
    df = df.where(pd.notnull(df), None)
    df["email_status"] = ClinicStatus.NOT_GENERATED.value

    # ---- Save ----
    save_to_supabase(df)

    total_time = (datetime.now(UTC) - pipeline_start).total_seconds()
    logger.info(
        f"========== PIPELINE FINISHED | total_time={total_time:.2f}s | rows={len(df)} =========="
    )


if __name__ == "__main__":
    CSV_PATH = "/Users/isaie/Projects/Lyyvora-outreach-core-service/datasets/real_set_v1/real_records.csv"
    run_pipeline(CSV_PATH)
