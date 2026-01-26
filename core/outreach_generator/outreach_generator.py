from openai import OpenAI
from dotenv import load_dotenv
import time
from datetime import datetime
import re
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

from configs.logging_module import Logger
from configs.types import ClinicStatus
from configs.prompt_templates import prompt
from configs.database import supabase
from configs.configs import OPENAI_API_KEY

MODEL = "gpt-4o-mini"

EMAIL_SIGNATURE = """
Best regards,
Sharmeen Aqeel 
Founder & CEO, Lyyvora
Lending-as-a-service for healthcare clinics
https://lyyvora.com"""

load_dotenv()

logger = Logger(log_file="outreach_generator.log")
client = OpenAI(api_key=OPENAI_API_KEY)

BATCH_SIZE = 50
MAX_WORKERS = 7


def generate_email(
    clinic_info: dict, user_prompt: str | None = None, max_words: int = 90
) -> str:
    """Generate email using OpenAI API"""
    clinic_name = clinic_info.get("clinic_name", "N/A")
    start_time = time.perf_counter()

    prompt_content = prompt(clinic_info=clinic_info, user_prompt=user_prompt)

    retry_count = 3
    email_text = ""
    max_tokens = 1000

    for attempt in range(1, retry_count + 1):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": f"Stay within this word limit f{max_words} when generating the emails. You are an expert email copywriter specializing in B2B outreach for healthcare clinics.",
                    },
                    {"role": "user", "content": prompt_content},
                ],
                temperature=0.7,
                max_tokens=max_tokens,
            )
            email_text = response.choices[0].message.content
            if email_text:
                break
        except Exception as e:
            error_msg = str(e)
            if "rate_limit" in error_msg.lower() or "429" in error_msg:
                wait_time = (2**attempt) + (0.5 * (1 + random.random()))
                logger.warning(
                    f"Rate limit for {clinic_name}, retrying in {wait_time:.2f}s (attempt {attempt}/{retry_count})"
                )
                time.sleep(wait_time)
            else:
                logger.error(f"OpenAI API error for {clinic_name}: {e}")
                break
    else:
        logger.error(
            f"Failed to generate email for {clinic_name} after {retry_count} attempts"
        )

    elapsed = time.perf_counter() - start_time
    logger.end_item(clinic_name, duration=elapsed)
    return email_text.strip()


def add_signature(email_body: str) -> str:
    return f"{email_body.rstrip()}\n\n{EMAIL_SIGNATURE.strip()}"


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
    MAX_WORKERS: int | None = None,
    progress_callback=None,
):
    if EMAIL_BATCH_SIZE < 1:
        EMAIL_BATCH_SIZE = 1

    clinics = (
        supabase.table("leads")
        .select(
            """
            id, clinic_name, clinic_sub_type, city, province, email, website_url,
            website_desc, total_reviews, average_rating, email_status,
            lead_scores(score, top_features)
            """
        )
        .eq("email_status", ClinicStatus.NOT_GENERATED.value)
        .execute()
        .data
    )

    if not clinics:
        logger.info("No clinics found for email generation")
        return

    def get_lead_score(c):
        scores = c.get("lead_scores") or []
        return scores[0].get("score") if scores else 0

    clinics.sort(key=lambda c: (get_lead_score(c), -c["id"]), reverse=True)
    clinics = clinics[:EMAIL_BATCH_SIZE]

    now = datetime.now()
    campaign_batch = f"outreach_{now.strftime('%Y-%m-%dT%H:%M:%S')}"

    logger.start_batch(campaign_batch)
    batch_start = time.perf_counter()

    workers = MAX_WORKERS if MAX_WORKERS else EMAIL_BATCH_SIZE
    all_records = []
    updated_clinic_ids = []

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(
                generate_email_safe, clinic, PROMPT, EMAIL_WORD_LIMIT
            ): clinic
            for clinic in clinics
        }

        for future in as_completed(futures):
            try:
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

                email_body_1 = add_signature(parsed[3])
                email_body_2 = add_signature(parsed[4])
                email_body_3 = add_signature(parsed[5])

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

                all_records.append(record)
                updated_clinic_ids.append(clinic_info["id"])

                if progress_callback:
                    progress_callback()

            except Exception as e:
                clinic = futures[future]
                logger.error(
                    f"Error processing {clinic.get('clinic_name', 'unknown')}: {e}"
                )

    for i in range(0, len(all_records), BATCH_SIZE):
        chunk = all_records[i : i + BATCH_SIZE]
        batch_save_to_supabase(chunk)

    set_clinic_status_queued(updated_clinic_ids)

    batch_elapsed = time.perf_counter() - batch_start
    logger.end_batch(
        campaign_batch,
        duration=batch_elapsed,
        avg_per_item=batch_elapsed / max(len(updated_clinic_ids), 1),
    )

    logger.info(
        f"Generated {len(all_records)} emails in {batch_elapsed:.2f}s "
        f"(~{batch_elapsed/max(len(all_records), 1):.2f}s per email with parallelization)"
    )


if __name__ == "__main__":
    run_email_generation()
