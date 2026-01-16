from ollama import Client
import os
from dotenv import load_dotenv
import time
import csv
import re
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

from configs.logging_module import Logger
from configs.types import ClinicStatus
from configs.prompt_templates import prompt
from configs.database import supabase

OLLAMA_MODEL = "deepseek-v3.1:671b-cloud"

EMAIL_SIGNATURE = """
Best regards,
Sharmeen Aqeel 
Founder & CEO, Lyyvora
Lending-as-a-service for healthcare clinics
https://lyyvora.com/
"""

load_dotenv()

logger = Logger(log_file="outreach_generator.log")
client = Client(
    host="https://ollama.com",
    headers={"Authorization": f"Bearer {os.environ.get('OLLAMA_API')}"},
)

BATCH_SIZE = 50
MAX_WORKERS = 5  # keep 3-5 to avoid 429s


def generate_email(
    clinic_info: dict, user_prompt: str | None = None, max_words: int = 120
) -> str:
    clinic_name = clinic_info.get("clinic_name", "N/A")
    start_time = time.perf_counter()
    messages = [
        {
            "role": "user",
            "content": prompt(
                clinic_info=clinic_info, user_prompt=user_prompt, max_words=max_words
            ),
        }
    ]

    retry_count = 3
    for attempt in range(1, retry_count + 1):
        try:
            response = client.chat(OLLAMA_MODEL, messages=messages)
            email_text = response.message.content
            if email_text:
                break
        except Exception as e:
            if "429" in str(e):
                wait_time = 1 + random.random()
                logger.warning(
                    f"429 rate limit for {clinic_name}, retrying in {wait_time:.2f}s (attempt {attempt}/{retry_count})"
                )
                time.sleep(wait_time)
            else:
                logger.error(f"Ollama API error for {clinic_name}: {e}")
                email_text = ""
                break
    else:
        logger.error(
            f"Failed to generate email for {clinic_name} after {retry_count} attempts"
        )
        email_text = ""

    elapsed = time.perf_counter() - start_time
    logger.end_item(clinic_name, duration=elapsed)
    return email_text.strip()


def add_signature(email_body: str) -> str:
    return f"{email_body.rstrip()}\n\n{EMAIL_SIGNATURE.strip()}"


def add_greeting(email_body: str, clinic_name: str) -> str:
    return f"Hello {clinic_name},\n\n{email_body.rstrip()}"


def parse_email(email_text: str):
    try:
        subjects = []
        bodies = []
        for i in range(1, 4):
            subj_match = re.search(
                f"subject_line_{i}\\s*:\\s*(.+)", email_text, re.IGNORECASE
            )
            body_match = re.search(
                f"email_body_{i}\\s*:\\s*(.+?)(?=(subject_line_|$))",
                email_text,
                re.IGNORECASE | re.DOTALL,
            )
            if subj_match and body_match:
                subjects.append(subj_match.group(1).strip())
                bodies.append(body_match.group(1).strip())
            else:
                return None
        return (*subjects, *bodies)
    except Exception as e:
        logger.error(f"Error parsing email: {e}")
        return None


def batch_save_to_supabase(records: list[dict]):
    if not records:
        return
    try:
        supabase.table("smartlead").insert(records).execute()
        logger.info(f"Batch inserted {len(records)} emails to Supabase")
    except Exception as e:
        logger.error(f"Supabase batch insert failed: {e}")


def set_clinic_status_queued(clinic_ids: list[int]):
    if not clinic_ids:
        return
    try:
        supabase.table("leads").update(
            {"email_status": ClinicStatus.GENERATED.value}
        ).in_("id", clinic_ids).execute()
        logger.info(f"Updated email_status=GENERATED for {len(clinic_ids)} clinics")
    except Exception as e:
        logger.error(f"Failed to update email_status batch: {e}")


def generate_email_safe(clinic_info, user_prompt=None, max_words=120):
    email_text = generate_email(
        clinic_info, user_prompt=user_prompt, max_words=max_words
    )
    return clinic_info, email_text


def run_email_generation(
    EMAIL_BATCH_SIZE: int = 10,
    PROMPT: str | None = None,
    EMAIL_WORD_LIMIT: int = 120,
    MAX_WORKERS: int | None = 5,
    progress_callback=None,
):
    if EMAIL_BATCH_SIZE < 1:
        EMAIL_BATCH_SIZE = 1

    clinics = (
        supabase.table("leads")
        .select("*")
        .eq("email_status", ClinicStatus.NOT_GENERATED.value)
        .order("id", desc=False)
        .limit(EMAIL_BATCH_SIZE)
        .execute()
        .data
    )

    if not clinics:
        logger.info("No clinics found for email generation")
        return

    campaign_batch = f"outreach_{time.strftime('%Y%m%d_%H%M%S')}"
    logger.start_batch(campaign_batch)
    batch_start = time.perf_counter()

    workers = min(MAX_WORKERS or 5, len(clinics))

    records_to_insert = []
    updated_clinic_ids = []

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = []
        for clinic in clinics:
            time.sleep(random.uniform(0.1, 0.3))
            futures.append(
                executor.submit(generate_email_safe, clinic, PROMPT, EMAIL_WORD_LIMIT)
            )

        for future in as_completed(futures):
            clinic_info, email_text = future.result()

            parsed = parse_email(email_text)
            if parsed is None:
                logger.warning(
                    f"Parsing failed for {clinic_info['clinic_name']}, retrying once..."
                )
                _, email_text = generate_email_safe(
                    clinic_info, PROMPT, EMAIL_WORD_LIMIT
                )
                parsed = parse_email(email_text)

            if parsed is None:
                logger.error(
                    f"Failed to parse email for {clinic_info['clinic_name']}. Skipping."
                )
                continue

            email_body_1 = add_greeting(
                add_signature(parsed[3]), clinic_info["clinic_name"]
            )
            email_body_2 = add_greeting(
                add_signature(parsed[4]), clinic_info["clinic_name"]
            )
            email_body_3 = add_greeting(
                add_signature(parsed[5]), clinic_info["clinic_name"]
            )

            record = {
                "leads_id": clinic_info["id"],
                "clinic_name": clinic_info["clinic_name"],
                "email": clinic_info["email"],
                "subject_line_1": parsed[0],
                "email_body_1": email_body_1,
                "subject_line_2": parsed[1],
                "email_body_2": email_body_2,
                "subject_line_3": parsed[2],
                "email_body_3": email_body_3,
                "clinic_type": clinic_info.get("clinic_sub_type"),
                "city": clinic_info.get("city"),
                "province": clinic_info.get("province"),
                "campaign_batch": campaign_batch,
            }

            records_to_insert.append(record)
            updated_clinic_ids.append(clinic_info["id"])

            if progress_callback:
                progress_callback()

            if len(records_to_insert) >= BATCH_SIZE:
                batch_save_to_supabase(records_to_insert)
                records_to_insert = []

    if records_to_insert:
        batch_save_to_supabase(records_to_insert)

    set_clinic_status_queued(updated_clinic_ids)

    batch_elapsed = time.perf_counter() - batch_start
    logger.end_batch(
        campaign_batch,
        duration=batch_elapsed,
        avg_per_item=batch_elapsed / max(EMAIL_BATCH_SIZE, 1),
    )


if __name__ == "__main__":
    run_email_generation()
