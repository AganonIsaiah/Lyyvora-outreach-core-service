import sqlite3
from ollama import Client
import os
from dotenv import load_dotenv
import time

from shared.queries import Queries
from shared.logging_module import Logger
from shared.configs import DB_FILE

from .prompt_templates import prompt_v1

OLLAMA_MODEL = "gpt-oss:120b"
EMAIL_BATCH_SIZE = 1

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
    logger.log_response(clinic_name, email_text)
    
    return email_text.strip()

def run_email_generation():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(Queries.get_top_clinics_for_outreach(limit=EMAIL_BATCH_SIZE, offset=0))
    rows = cursor.fetchall()
    
    columns = [desc[0] for desc in cursor.description] 
    clinic_infos = [dict(zip(columns, row)) for row in rows]

    batch_start = time.perf_counter()
    logger.start_batch("outreach_email_generation")
    print(f"START outreach generation for {EMAIL_BATCH_SIZE} emails...")

    for clinic_info in clinic_infos:
        generate_email(clinic_info)

    batch_elapsed = time.perf_counter() - batch_start
    logger.end_batch("outreach_email_generation", duration=batch_elapsed, avg_per_item=batch_elapsed/EMAIL_BATCH_SIZE)
    print(f"END outreach generation | total_duration={batch_elapsed:.2f}s | average_time_per_email={batch_elapsed/EMAIL_BATCH_SIZE:.2f}")    

if __name__=="__main__":
    run_email_generation()