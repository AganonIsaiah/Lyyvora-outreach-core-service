import pandas as pd
import sqlite3
import logging
import re
import os
from urllib.parse import urlparse

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
INPUT_FILE = os.path.join(PROJECT_ROOT, "datasets", "real_set_v1", "records.csv")
DB_FILE = os.path.join(PROJECT_ROOT, "datasets", "real_set_v1", "records.db")
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")

os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "lead_data_pipeline.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"
LEADS_TABLE_SCHEMA = """
                   CREATE TABLE IF NOT EXISTS leads (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       clinic_name TEXT NOT NULL,
                       clinic_main_type TEXT,
                       clinic_sub_type TEXT,
                       city TEXT,
                       province TEXT,
                       phone TEXT UNIQUE,
                       email TEXT UNIQUE NOT NULL,
                       website_url TEXT,
                       website_desc TEXT,
                       total_reviews INTEGER,
                       average_rating REAL
                   );
                   """

def get_primary_email(email1: str, email2: str):
    for email in [email1, email2]:
        if not isinstance(email, str):
            continue
        
        email_clean = email.strip().lower()
        
        if re.match(EMAIL_REGEX, email_clean):
            return email_clean
        
        else:
            logging.warning(f"Dropping invalid email: {email_clean}")
            
    return None

def clean_text(text: str):
    if not isinstance(text, str): return None
    
    return text.strip()

def clean_clinic_name(text: str):
    if not isinstance(text, str): return None 
    
    regex_chars = r'[@#|-]'
    return re.split(regex_chars, text)[0].strip()

def clean_phone(phone: str):
    if not isinstance(phone, str): return None
    
    digits = re.sub(r"\D", "", phone)
        
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
        
    if len(digits) != 10:
        logging.warning(f"Dropping invalid phone: {phone}")
        return None
        
    return digits

def clean_website(site: str):
    if not isinstance(site, str) or not site.strip():
        return None
    
    site = site.strip()
    parsed = urlparse(site)
    
    if parsed.scheme in ["http", "https"] and parsed.netloc:
        return site
    
    if "." in site and " " not in site: 
        return site
    
    logging.warning(f"Invalid website URL: {site}")
    return None

def normalize_province(p: str):
    if not isinstance(p, str): return None
    
    p = p.strip().upper()
  
    lookup = {
        "ON": "ON", "ONTARIO": "ON",
        "QC": "QC", "QUEBEC": "QC", "QUÉBEC": "QC",
        "BC": "BC", "BRITISH COLUMBIA": "BC",
        "AB": "AB", "ALBERTA": "AB",
        "MB": "MB", "MANITOBA": "MB",
        "SK": "SK", "SASKATCHEWAN": "SK",
        "NS": "NS", "NOVA SCOTIA": "NS",
        "NB": "NB", "NEW BRUNSWICK": "NB",
        "PE": "PE", "PEI": "PE", "PRINCE EDWARD ISLAND": "PE",
        "NL": "NL", "NF": "NL", "NEWFOUNDLAND": "NL", "LABRADOR": "NL", "NEWFOUNDLAND AND LABRADOR": "NL",
        "YT": "YT", "YUKON": "YT",
        "NT": "NT", "NWT": "NT", "NORTHWEST TERRITORIES": "NT",
        "NU": "NU", "NUNAVUT": "NU"
    }
    
    return lookup.get(p, p)

def save_to_sqlite(df: pd.DataFrame):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute(LEADS_TABLE_SCHEMA)
    df.to_sql("leads", conn, if_exists="append", index=False)
    
    conn.commit()
    conn.close()


def main():
    logging.info("Pipeline started.")
    print("Pipeline started.")
    
    # Load CSV
    df = pd.read_csv(INPUT_FILE)
    logging.info(f"Loaded {len(df)} rows from {INPUT_FILE}")
    print(f"Loaded {len(df)} rows from {INPUT_FILE}")

    # Map raw CSV columns to DB columns
    logging.info("Renaming columns to match DB schema.")
    df = df.rename(columns={
        "business_name": "clinic_name",
        "type": "clinic_main_type",
        "sub_types": "clinic_sub_type",
        "business_website": "website_url",
        "state": "province",
        "business_phone": "phone"
    })

    # Clean & map
    logging.info("Cleaning text fields and normalizing data.")
    for col in ["clinic_main_type", "clinic_sub_type", "city"]:
        df[col] = df[col].apply(clean_text)
        logging.info(f"Cleaned column '{col}'")
        
    df["clinic_name"] = df["clinic_name"].apply(clean_clinic_name)
    logging.info("Cleaned 'clinic_name' column.")


    df["province"] = df["province"].apply(normalize_province)
    logging.info("Normalized 'province' column.")

    df["phone"] = df["phone"].apply(clean_phone)
    logging.info("Cleaned 'phone' column.")

    df["website_url"] = df["website_url"].apply(clean_website)
    logging.info("Cleaned 'website_url' column.")

    df["email"] = df.apply(lambda row: get_primary_email(row.get("email_1"), row.get("email_2")), axis=1)
    logging.info("Mapped primary email for each row.")

    df["total_reviews"] = pd.to_numeric(df["total_reviews"], errors="coerce")
    df["average_rating"] = pd.to_numeric(df["average_rating"], errors="coerce")
    logging.info("Converted 'total_reviews' and 'average_rating' to numeric.")

    # Deduplicate
    before = len(df)
    df = df.drop_duplicates(subset=["clinic_name", "city"], keep='first')
    logging.info(f"Dropped {before - len(df)} duplicate rows based on ['clinic_name', 'city'].")

    before = len(df)
    df = df[df['phone'].isna() | ~df.duplicated(subset=['phone'], keep='first')]
    logging.info(f"Dropped {before - len(df)} duplicate rows based on 'phone'.")

    before = len(df)
    df = df[df['email'].isna() | ~df.duplicated(subset=['email'], keep='first')]
    logging.info(f"Dropped {before - len(df)} duplicate rows based on 'email'.")

    # Drop missing essential fields
    before = len(df)
    df = df.dropna(subset=["clinic_name"])
    logging.info(f"Dropped {before - len(df)} rows missing 'clinic_name'.")

    before = len(df)
    df = df.dropna(subset=["email"])
    logging.info(f"Dropped {before - len(df)} rows missing 'email'.")

    # Reorder for SQLite
    df = df[[
        "clinic_name", "clinic_main_type", "clinic_sub_type",
        "city", "province", "phone", "email",
        "website_url", "website_desc", "total_reviews", "average_rating"
    ]]
    logging.info("Reordered columns for SQLite.")

    # Convert NaN to None for SQLite
    df = df.where(pd.notnull(df), None)
    logging.info("Converted NaN values to None for SQLite.")

    # Save
    save_to_sqlite(df)
    logging.info(f"Saved {len(df)} rows to SQLite.")

    logging.info("Pipeline completed successfully.")
    print("Pipeline completed successfully.")

if __name__ == "__main__":
    main()