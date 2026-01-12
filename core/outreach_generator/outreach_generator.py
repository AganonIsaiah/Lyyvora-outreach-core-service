import sqlite3
from ollama import Client
import os
from dotenv import load_dotenv
import time
import csv
import re

from shared.queries import Queries
from shared.logging_module import Logger
from shared.configs import DB_FILE, SMARTLEAD_CSV_OUTPUT_FILE
from shared.types import ClinicStatus
from shared.prompt_templates import prompt

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
    headers={"Authorization": f"Bearer {os.environ.get('OLLAMA_API')}"}
)

def generate_email(clinic_info: dict, user_prompt: str | None = None, max_words: int = 120) -> str:
    clinic_name = clinic_info.get("clinic_name", "N/A")
    start_time = time.perf_counter()

    messages = [{"role": "user", "content": prompt(clinic_info=clinic_info, user_prompt=user_prompt, max_words=max_words)}]
    email_text = ""

    response = client.chat(OLLAMA_MODEL, messages=messages)
    email_text = response.message.content

    elapsed = time.perf_counter() - start_time
    logger.end_item(clinic_name, duration=elapsed)

    return email_text.strip()

def add_signature(email_body: str) -> str:
    email_body = email_body.rstrip()
    return f"{email_body}\n\n{EMAIL_SIGNATURE.strip()}"

def parse_email(email_text: str):
    """
    Returns tuple: (subject_line_1, subject_line_2, subject_line_3, email_body_1, email_body_2, email_body_3)
    """
    try:
        subjects = []
        bodies = []

        for i in range(1, 4):
            subj_match = re.search(f"subject_line_{i}\\s*:\\s*(.+)", email_text, re.IGNORECASE)
            body_match = re.search(f"email_body_{i}\\s*:\\s*(.+?)(?=(subject_line_|$))", email_text, re.IGNORECASE | re.DOTALL)
            
            if subj_match and body_match:
                subjects.append(subj_match.group(1).strip())
                bodies.append(body_match.group(1).strip())
            else:
                return None 

        return (*subjects, *bodies)

    except Exception as e:
        logger.error(f"Error parsing email: {e}")
        return None

def save_to_sql(
    conn,
    clinic_info: dict,
    subject_line_1: str,
    email_body_1: str,
    subject_line_2: str,
    email_body_2: str,
    subject_line_3: str,
    email_body_3: str,
    campaign_batch: str
):
    cursor = conn.cursor()
    cursor.execute(Queries.create_smartlead_table())

    try:
        sql, values = Queries.insert_into_smartlead(
            leads_id=clinic_info["id"],
            clinic_name=clinic_info["clinic_name"],
            email=clinic_info["email"],
            subject_line_1=subject_line_1,
            email_body_1=email_body_1,
            subject_line_2=subject_line_2,
            email_body_2=email_body_2,
            subject_line_3=subject_line_3,
            email_body_3=email_body_3,
            clinic_type=clinic_info.get("clinic_sub_type"),
            city=clinic_info.get("city"),
            province=clinic_info.get("province"),
            campaign_batch=campaign_batch
        )
        cursor.execute(sql, values)
        conn.commit()

    except Exception as e:
        logger.error(f'SQL insert failed for {clinic_info["clinic_name"]}: {e}')

def export_to_csv(conn, campaign_batch: str):
    cursor = conn.cursor()
    sql, values = Queries.select_smartlead_batch(campaign_batch=campaign_batch)
    cursor.execute(sql, values)
    rows = cursor.fetchall()

    headers = [
        "clinic_name", "email",
        "subject_line_1", "email_body_1",
        "subject_line_2", "email_body_2",
        "subject_line_3", "email_body_3",
        "clinic_type", "city", "province"
    ]

    os.makedirs(SMARTLEAD_CSV_OUTPUT_FILE, exist_ok=True)
    filename = os.path.join(SMARTLEAD_CSV_OUTPUT_FILE, f"{campaign_batch}.csv")

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    logger.info(f"Exported {len(rows)} rows to {filename}")

def set_clinic_status_queued(conn, clinic_id: int):
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE leads SET email_status = ? WHERE id = ?",
            (ClinicStatus.GENERATED.value, clinic_id)
        )
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to update email_status to QUEUED for clinic_id={clinic_id}: {e}")

def run_email_generation(
    EMAIL_BATCH_SIZE: int = 1,
    PROMPT: str | None = None,
    EMAIL_WORD_LIMIT: int = 120, 
    progress_callback=None
):
    if EMAIL_BATCH_SIZE < 1: EMAIL_BATCH_SIZE = 1

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(Queries.create_smartlead_table())
    conn.commit()

    sql, params = Queries.get_top_clinics_for_outreach(batch_size=EMAIL_BATCH_SIZE)
    cursor.execute(sql, params)

    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    clinic_infos = [dict(zip(columns, row)) for row in rows]

    campaign_batch = f"outreach_{time.strftime('%Y%m%d_%H%M%S')}"
    logger.start_batch(f"{campaign_batch}")
    # print(f"START outreach generation for {EMAIL_BATCH_SIZE} emails | batch={campaign_batch}")

    batch_start = time.perf_counter()

    for clinic_info in clinic_infos:
        email_text = generate_email(clinic_info, user_prompt=PROMPT, max_words=EMAIL_WORD_LIMIT)
        parsed = parse_email(email_text)
        if parsed is None:
            logger.error(f"Failed to parse email for {clinic_info['clinic_name']}. Skipping.")
            continue

        email_body_1 = add_signature(parsed[3])
        email_body_2 = add_signature(parsed[4])
        email_body_3 = add_signature(parsed[5])

        save_to_sql(
            conn,
            clinic_info=clinic_info,
            subject_line_1=parsed[0],
            email_body_1=email_body_1,
            subject_line_2=parsed[1],
            email_body_2=email_body_2,
            subject_line_3=parsed[2],
            email_body_3=email_body_3,
            campaign_batch=campaign_batch
        )
        set_clinic_status_queued(conn, clinic_info["id"])
        
        if progress_callback:
            progress_callback()

    # export_to_csv(conn=conn, campaign_batch=campaign_batch) # Uncomment to save .csv to /datasets/smartlead_csv

    batch_elapsed = time.perf_counter() - batch_start
    logger.end_batch(
        f"{campaign_batch}",
        duration=batch_elapsed,
        avg_per_item=batch_elapsed / max(EMAIL_BATCH_SIZE, 1)
    )

    # print(f"END outreach generation | total_duration={batch_elapsed:.2f}s | average_time_per_email={batch_elapsed / EMAIL_BATCH_SIZE:.2f}")

    conn.close()

if __name__ == "__main__":
    run_email_generation()
