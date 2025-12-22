import sqlite3
from ollama import Client
import os
from dotenv import load_dotenv
import logging
import time

load_dotenv()

# Connect to your database
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
DB_FILE = os.path.join(PROJECT_ROOT, "datasets", "real_set_v1", "records.db")
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")

os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "outreach_generator.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

conn = sqlite3.connect(DB_FILE)  # replace with your DB path
cursor = conn.cursor()

# Your query
query = """
SELECT l.clinic_name, l.clinic_sub_type, l.city, l.website_desc 
FROM leads l
LEFT JOIN lead_scores s 
ON l.id = s.leads_id 
ORDER BY s.score DESC
LIMIT 5;
"""

cursor.execute(query)
rows = cursor.fetchall()

# Convert rows into a list of dictionaries
columns = [desc[0] for desc in cursor.description]  # get column names
clinic_infos = [dict(zip(columns, row)) for row in rows]

client = Client(
    host="https://ollama.com",
    headers={"Authorization": f"Bearer {os.environ.get('OLLAMA_API')}"}
)

MAX_WORDS = 120
OLLAMA_MODEL = "gpt-oss:120b"

def generate_email(clinic_info):
    
    clinic_name = clinic_info.get("clinic_name", "N/A")

    start_time = time.perf_counter()
    logging.info(f"START email generation for clinic: {clinic_name}")

    
    prompt = f"""
    You are Sharmeen Aqeel, Founder and CEO of Lyyvora, a Lending-as-a-Service platform for healthcare clinics.
    
    Write a concise, human-like email (max {MAX_WORDS} words) to the clinic below.
    Personalize it using these details:

    - Clinic Name: {clinic_info.get('clinic_name', 'N/A')}
    - Specialties: {clinic_info.get('clinic_sub_type', 'N/A')}
    - City: {clinic_info.get('city', 'N/A')}
    - Brief Description: {clinic_info.get('website_desc', 'N/A')}

    Include:
    - A friendly introduction referencing the clinic or its specialty
    - Lyyvora branding and Sharmeen Aqeel as the CEO
    - How Lyyvora can help clinics scale with fast, transparent financing
    - A polite call-to-action to schedule a call or learn more

    Guardrails:
    - Do NOT promise loan approval
    - Avoid aggressive sales language
    - Keep it professional, friendly, and human

    **Output format:**  
    Subject: <subject line here>  
    Body: <email body here>
    
    """
    messages = [{"role": "user", "content": prompt}]
    email_text = ""
    for part in client.chat(OLLAMA_MODEL, messages=messages, stream=True):
        email_text += part.message.content
        
    elapsed = time.perf_counter() - start_time

    logging.info(
        f"END email generation for clinic: {clinic_name} | "
        f"duration={elapsed:.2f}s"
    )
    
    logging.info(f"RESPONSE for {clinic_name}:\n\n{email_text.strip()}")
    
    return email_text.strip()


if __name__=="__main__":
    batch_start = time.perf_counter()
    logging.info("START outreach email generation batch")

    for clinic_info in clinic_infos:
        generate_email(clinic_info)

    batch_elapsed = time.perf_counter() - batch_start
    logging.info(
        f"END outreach email generation batch | "
        f"total_duration={batch_elapsed:.2f}s"
    )