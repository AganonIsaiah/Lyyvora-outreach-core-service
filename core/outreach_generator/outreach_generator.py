import sqlite3
from ollama import Client
import os
from dotenv import load_dotenv
import time
import csv

from shared.queries import Queries
from shared.logging_module import Logger
from shared.configs import DB_FILE, SMARTLEAD_CSV_OUTPUT_FILE

from .prompt_templates import prompt_v1

OLLAMA_MODEL = "gpt-oss:120b"

load_dotenv()

logger = Logger(log_file="outreach_generator.log")
client = Client(
    host="https://ollama.com",
    headers={"Authorization": f"Bearer {os.environ.get('OLLAMA_API')}"}
)

def generate_email(clinic_info: dict) -> str:
    clinic_name = clinic_info.get("clinic_name", "N/A")
    start_time = time.perf_counter()
    logger.start_item(clinic_name)
    
    messages = [{"role": "user", "content": prompt_v1(clinic_info=clinic_info)}]
    email_text = ""
    
    for part in client.chat(OLLAMA_MODEL, messages=messages, stream=True):
        email_text += part.message.content
        
    elapsed = time.perf_counter() - start_time
    logger.end_item(clinic_name, duration=elapsed)
    
    return email_text.strip()

def parse_email(email_text: str) -> tuple[str, str]:
    SPLIT = "email_body:"
    
    if SPLIT not in email_text: 
        return None
        
    subject_line = email_text.split(SPLIT)[0].replace("subject_line:", "").strip()
    email_body = email_text.split(SPLIT)[1].strip()
    
    if not subject_line or not email_body:
        return None
  
    return subject_line, email_body 

def save_to_sql(conn, clinic_info: dict, subject: str, body: str, campaign_batch: str):
    cursor = conn.cursor()
    cursor.execute(Queries.create_smartlead_table())
    
    try: 
        sql, values = Queries.insert_into_smartlead(
            clinic_name=clinic_info["clinic_name"],
            email=clinic_info["email"],
            subject_line=subject,
            email_body=body,
            clinic_type=clinic_info.get("clinic_sub_type"),
            city=clinic_info.get("city"),
            province=clinic_info.get("province"),
            campaign_batch=campaign_batch
        )
        cursor.execute(sql, values)
        conn.commit()
    except Exception as e:
        logger.error(f"SQL insert failed for {clinic_info["clinic_name"]}: {e}")
    
def export_to_csv(conn, campaign_batch: str):
    cursor = conn.cursor()
    
    sql, values = Queries.select_smartlead_batch(campaign_batch=campaign_batch)
    cursor.execute(sql, values)
    rows = cursor.fetchall()
    
    headers = [desc[0] for desc in cursor.description]
    
    os.makedirs(SMARTLEAD_CSV_OUTPUT_FILE, exist_ok=True)
    file = f"{campaign_batch}.csv"
    filename = os.path.join(SMARTLEAD_CSV_OUTPUT_FILE, file)
    
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
        
    logger.info(f"Export {len(rows)} rows to {file}")

def run_email_generation(EMAIL_BATCH_SIZE: int = 10, OFFSET: int = 0):
    if EMAIL_BATCH_SIZE < 1: EMAIL_BATCH_SIZE = 1
    if OFFSET < 0: OFFSET = 0
    
    conn = sqlite3.connect(DB_FILE)
    
    cursor = conn.cursor()
    cursor.execute(Queries.get_top_clinics_for_outreach(limit=EMAIL_BATCH_SIZE, offset=OFFSET))
    rows = cursor.fetchall()
    
    columns = [desc[0] for desc in cursor.description] 
    clinic_infos = [dict(zip(columns, row)) for row in rows]

    campaign_batch = f"outreach_{time.strftime('%Y%m%d_%H%M%S')}"
    batch_start = time.perf_counter()
    
    logger.start_batch(f"outreach_{campaign_batch}")
    print(f"START outreach generation for {EMAIL_BATCH_SIZE} emails | batch={campaign_batch}")

    for clinic_info in clinic_infos:
        email_text = generate_email(clinic_info)
        parsed_email = parse_email(email_text=email_text)
        
        if parsed_email is None:
            logger.error(f"Failed to parse email for {clinic_info['clinic_name']}. Skipping.")
            continue 
        
        subject, body = parsed_email
        save_to_sql(conn, clinic_info=clinic_info, subject=subject, body=body, campaign_batch=campaign_batch)
    
    export_to_csv(conn=conn, campaign_batch=campaign_batch)
    
    batch_elapsed = time.perf_counter() - batch_start
    logger.end_batch(
        f"outreach_{campaign_batch}",
        duration=batch_elapsed,
        avg_per_item=batch_elapsed / max(EMAIL_BATCH_SIZE, 1)
    )
    
    print(f"END outreach generation | total_duration={batch_elapsed:.2f}s | average_time_per_email={batch_elapsed/EMAIL_BATCH_SIZE:.2f}")
    conn.close()
    
if __name__=="__main__":
    run_email_generation()