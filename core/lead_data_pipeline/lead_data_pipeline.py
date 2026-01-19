import pandas as pd
import re
from urllib.parse import urlparse
from datetime import datetime, timezone
from fastapi import UploadFile

from configs.logging_module import Logger
from configs.types import ClinicStatus
from configs.database import supabase

logger = Logger(log_file="lead_data_pipeline.log")

BATCH_SIZE = 500
EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
NON_DIGITS = re.compile(r"\D")
CLINIC_SPLIT_REGEX = re.compile(r"[@#|-]")


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


def sanitize_record(record: dict) -> dict:
    clean = {}
    for k, v in record.items():
        if pd.isna(v):
            clean[k] = None
        else:
            clean[k] = int(v) if "reviews" in k and isinstance(v, (int, float)) else v
    return clean


def save_to_supabase(df: pd.DataFrame):
    logger.info("Saving rows to Supabase...")
    start = datetime.now(timezone.utc)

    if df.empty:
        logger.info("No rows to insert.")
        return

    records = df.to_dict(orient="records")
    total = len(records)
    inserted = 0
    skipped = 0

    try:
        resp = supabase.table("leads").select("clinic_name,email").execute()
        if resp.data is None:
            existing = pd.DataFrame(columns=["clinic_name", "email"])
        else:
            existing = pd.DataFrame(resp.data)
    except Exception as e:
        logger.error(f"Failed to fetch existing leads: {e}")
        existing = pd.DataFrame(columns=["clinic_name", "email"])

    existing_set = set(
        (row["clinic_name"], row["email"]) for _, row in existing.iterrows()
    )

    for i in range(0, total, BATCH_SIZE):
        batch = [sanitize_record(r) for r in records[i : i + BATCH_SIZE]]

        new_batch = [
            r for r in batch if (r["clinic_name"], r["email"]) not in existing_set
        ]
        skipped_batch = len(batch) - len(new_batch)
        skipped += skipped_batch

        if not new_batch:
            logger.info(f"Batch {i}-{i+len(batch)} skipped: {skipped_batch} duplicates")
            continue

        existing_set.update((r["clinic_name"], r["email"]) for r in new_batch)

        try:
            supabase.table("leads").insert(new_batch).execute()
            inserted += len(new_batch)
            logger.info(f"Inserted {inserted}/{total} rows in batch {i}-{i+len(batch)}")
            if skipped_batch:
                logger.info(f"Skipped {skipped_batch} duplicate rows in this batch")
        except Exception as e:
            logger.error(f"Batch insert failed at {i}-{i+len(batch)}: {e}")

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    rate = inserted / elapsed if elapsed else 0
    logger.info(
        f"Supabase insert finished | inserted={inserted} | skipped={skipped} | time={elapsed:.2f}s | rate={rate:.1f}/s"
    )


def run_pipeline(file: UploadFile):
    pipeline_start = datetime.now(timezone.utc)
    logger.info("========== PIPELINE STARTED ==========")

    stage_start = datetime.now(timezone.utc)
    file.file.seek(0)
    df = pd.read_csv(file.file)
    elapsed = (datetime.now(timezone.utc) - stage_start).total_seconds()
    logger.info(f"Loaded {len(df)} rows | elapsed={elapsed:.2f}s")

    stage_start = datetime.now(timezone.utc)
    df = df.rename(
        columns={
            "business_name": "clinic_name",
            "type": "clinic_main_type",
            "sub_types": "clinic_sub_type",
            "business_website": "website_url",
            "state": "province",
            "business_phone": "phone",
            "email_1": "email_1",
            "email_2": "email_2",
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
    elapsed = (datetime.now(timezone.utc) - stage_start).total_seconds()
    logger.info(f"Columns normalized | elapsed={elapsed:.2f}s")

    stage_start = datetime.now(timezone.utc)
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
    elapsed = (datetime.now(timezone.utc) - stage_start).total_seconds()
    logger.info(f"Data cleaned | elapsed={elapsed:.2f}s")

    stage_start = datetime.now(timezone.utc)
    df["total_reviews"] = pd.to_numeric(df["total_reviews"], errors="coerce").astype(
        "Int64"
    )
    df["average_rating"] = pd.to_numeric(df["average_rating"], errors="coerce")
    elapsed = (datetime.now(timezone.utc) - stage_start).total_seconds()
    logger.info(f"Numeric columns fixed | elapsed={elapsed:.2f}s")

    stage_start = datetime.now(timezone.utc)
    df = df.drop_duplicates(subset=["clinic_name", "city"])
    df = df.dropna(subset=["clinic_name", "email"])
    elapsed = (datetime.now(timezone.utc) - stage_start).total_seconds()
    logger.info(f"Duplicates removed | elapsed={elapsed:.2f}s")

    stage_start = datetime.now(timezone.utc)
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
    elapsed = (datetime.now(timezone.utc) - stage_start).total_seconds()
    logger.info(f"Final prep done | elapsed={elapsed:.2f}s")

    stage_start = datetime.now(timezone.utc)
    save_to_supabase(df)
    elapsed = (datetime.now(timezone.utc) - stage_start).total_seconds()
    logger.info(f"Data saved to Supabase | elapsed={elapsed:.2f}s")

    total_elapsed = (datetime.now(timezone.utc) - pipeline_start).total_seconds()
    logger.info(
        f"========== PIPELINE FINISHED | rows={len(df)} | total elapsed={total_elapsed:.2f}s =========="
    )
