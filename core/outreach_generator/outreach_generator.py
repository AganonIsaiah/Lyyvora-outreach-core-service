import sqlite3
from ollama import Client
import os
from dotenv import load_dotenv
import time
from config.queries import Queries
from config.logging_module import Logger
from config.configs import DB_FILE

MAX_WORDS = 120
OLLAMA_MODEL = "gpt-oss:120b"
EMAIL_BATCH_SIZE = 1

load_dotenv()

logger = Logger(log_file="outreach_generator.log")

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()
query = Queries.get_top_clinics_for_outreach(limit=EMAIL_BATCH_SIZE, offset=0)
cursor.execute(query)
rows = cursor.fetchall()
columns = [desc[0] for desc in cursor.description] 
clinic_infos = [dict(zip(columns, row)) for row in rows]

client = Client(
    host="https://ollama.com",
    headers={"Authorization": f"Bearer {os.environ.get('OLLAMA_API')}"}
)

def generate_email(clinic_info):
    clinic_name = clinic_info.get("clinic_name", "N/A")
    start_time = time.perf_counter()
    logger.start_item(clinic_name)
    
    prompt = f"""
        ROLE
        You are Sharmeen Aqeel, Founder and CEO of Lyyvora.

        FACTUAL CONTEXT (USE AS GIVEN — DO NOT MODIFY)
        Lyyvora facts you may reference:
        - Lending-as-a-Service platform for healthcare clinics and pharmacies
        - Works with multiple lending partners across Canada and the U.S.
        - Actively supports financing deals ranging from $20,000 to $2,000,000
        - Focused on data-driven capital based on real clinic performance
        - Built to help clinics manage reinvestment, equipment upgrades, and expansion
        - Founder background includes leading global product design teams in France and Canada

        IMPORTANT:
        - Use these facts naturally if relevant
        - Do NOT invent new metrics, numbers, partnerships, or claims
        - Do NOT exaggerate outcomes or imply guaranteed funding

        TASK
        Write 3 personalized outreach emails (maximum {MAX_WORDS} words).

        PERSONALIZATION INPUT
        Incorporate this information where appropriate:
        - Clinic: {clinic_info.get('clinic_name', 'N/A')}
        - Clinic's specialties: {clinic_info.get('clinic_sub_type', 'N/A')}
        - Clinic's location: {clinic_info.get('city', 'N/A')}
        - Clinic background context: {clinic_info.get('website_desc', 'N/A')}

        STRUCTURE
        1. Open with a thoughtful, specific acknowledgment of the clinic’s work or specialty
        2. Introduce yourself and why you built Lyyvora
        3. Reference Lyyvora’s real operating context (partners, deal ranges, markets) to establish credibility
        4. Close with a respectful, low-pressure invitation to continue the conversation

        STYLE GUIDELINES
        - First-person, founder-to-founder voice
        - Reflective, credible, and calm
        - No sales language, no buzzwords
        - 2–4 short paragraphs
        - For the subject lines, use title case

        CALL-TO-ACTION
        - Do NOT include links or URLs
        - Use exactly one CTA
        - CTA must invite replying directly to the email

        STRICT GUARDRAILS
        - Do NOT promise funding, approval, or outcomes
        - Do NOT add statistics beyond those listed
        - Do NOT include placeholders or bracketed text
        - Stay within the word limit

        OUTPUT
        subject_1: <one concise subject line>
        body_1: <email body>

        subject_2: <one concise subject line follow-up>
        body_2: <email body>

        subject_3: <one concise subject line follow-up>
        body_3: <email body>
    """

    messages = [{"role": "user", "content": prompt}]
    email_text = ""
    for part in client.chat(OLLAMA_MODEL, messages=messages, stream=True):
        email_text += part.message.content
        
    elapsed = time.perf_counter() - start_time
    logger.end_item(clinic_name, duration=elapsed)
    logger.log_response(clinic_name, email_text)
    
    return email_text.strip()

if __name__=="__main__":
    batch_start = time.perf_counter()
    logger.start_batch("outreach_email_generation")
    print(f"START outreach generation for {EMAIL_BATCH_SIZE} emails...")

    for clinic_info in clinic_infos:
        generate_email(clinic_info)

    batch_elapsed = time.perf_counter() - batch_start
    logger.end_batch("outreach_email_generation", duration=batch_elapsed, avg_per_item=batch_elapsed/EMAIL_BATCH_SIZE)
    print(f"END outreach generation | total_duration={batch_elapsed:.2f}s | average_time_per_email={batch_elapsed/EMAIL_BATCH_SIZE:.2f}")