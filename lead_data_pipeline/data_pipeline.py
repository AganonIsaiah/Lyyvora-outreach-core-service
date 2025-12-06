import pandas as pd
import sqlite3
import logging
import re
import os

# --------------------------------
# Paths
# --------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "data", "mock_data_sets", "mock_dirty_data.csv")
# OUTPUT_FILE = os.path.join(BASE_DIR, "data", "mock_data_sets", "mock_cleaned_data.csv")
DB_FILE = os.path.join(BASE_DIR, "data", "mock_data_sets", "cleaned_data.db")

# --------------------------------
# Logging Setup
# --------------------------------
logging.basicConfig(
    filename=os.path.join(BASE_DIR, "logs", "data_pipeline.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"
PHONE_REGEX = r"\d{10}"

# --------------------------------
# Cleaning functions
# --------------------------------
def clean_email(email: str):
    if not isinstance(email, str): return None
    
    email = email.strip().lower()
    valid = re.match(EMAIL_REGEX, email)
    
    if not valid:
        logging.warning(f"Dropping invalid email: {email}")
        
    return email if valid else None

def clean_phone(phone: str):
    if not isinstance(phone, str): return None
    
    digits = re.sub(r"\D", "", phone)
    valid = re.fullmatch(PHONE_REGEX, digits)
    
    if not valid:
        logging.warning(f"Dropping invalid phone: {phone}")
        
    return digits if valid else None

def clean_website(site: str):
    if not isinstance(site, str) or not site.strip(): return None
    
    site = site.strip().lower()
    
    if not site.startswith("http"):
        site = "https://" + site
        
    return site

def clean_text(s: str):
    if not isinstance(s, str): return None 
    
    s = s.strip()
    words = s.split()
    
    lower_words = {"and", "or", "the", "of", "in", "for"}
    cleaned_words = []
    
    for i, word in enumerate(words):
        if "'" in word:
            parts = word.split("'")
            word = "'".join([parts[0].capitalize()] + [p.lower() for p in parts[1:]])
        elif word.lower() in lower_words and i != 0:
            word = word.lower()
        else: 
            word = word.capitalize()
            
        cleaned_words.append(word)
        
    return " ".join(cleaned_words)
    

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

# --------------------------------
# Save to SQLite
# --------------------------------
def save_to_sqlite(df: pd.DataFrame):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("""
                   CREATE TABLE IF NOT EXISTS leads (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       clinic_name TEXT NOT NULL,
                       specialty TEXT,
                       city TEXT,
                       province TEXT,
                       phone TEXT UNIQUE,
                       website TEXT,
                       email TEXT UNIQUE NOT NULL,
                       notes TEXT
                   )
                   """)
    
    
    df.to_sql("leads", conn, if_exists="replace", index=False)
    conn.commit()
    conn.close()
    
    logging.info(f"Saved cleaned dataset to SQLite: {DB_FILE}")

# --------------------------------
# Pipeline
# --------------------------------
def main():
    logging.info("Pipeline started.")
    
    df = pd.read_csv(INPUT_FILE)
    logging.info(f"Loaded {len(df)} rows from {INPUT_FILE}")

    # Clean each column
    df["clinic_name"] = df["clinic_name"].apply(clean_text)
    df["specialty"] = df["specialty"].apply(clean_text)
    df["city"] = df["city"].apply(clean_text)
    df["province"] = df["province"].apply(normalize_province)
    df["phone"] = df["phone"].apply(clean_phone)
    df["website"] = df["website"].apply(clean_website)
    df["email"] = df["email"].apply(clean_email)

    # Remove missing essential fields
    before = len(df)
    df = df.dropna(subset=["clinic_name", "email"], how="all")
    logging.info(f"Dropped {before - len(df)} rows missing clinic_name or email")

    # Deduplicate by name + city
    before = len(df)
    df = df.drop_duplicates(subset=["clinic_name", "city"], keep='first')
    logging.info(f"Dropped {before - len(df)} duplicates by clinic_name+city")

    # Deduplicate by phone 
    before = len(df)
    df = df[df['phone'].isna() | ~df.duplicated(subset=['phone'], keep='first')]
    logging.info(f"Dropped {before - len(df)} duplicates by phone")

    # Deduplicate by email  
    before = len(df)
    df = df[df['email'].isna() | ~df.duplicated(subset=['email'], keep='first')]
    logging.info(f"Dropped {before - len(df)} duplicates by email")

    # Reorder
    df = df[["clinic_name", "specialty", "city", "province", "phone", "website", "email", "notes"]]

    # Save CSV
    # df.to_csv(OUTPUT_FILE, index=False)
    # logging.info(f"Saved cleaned CSV: {OUTPUT_FILE}")
    
    # Standardize missing fields for SQLite
    df = df.where(pd.notnull(df), None)

    # Save SQLite
    save_to_sqlite(df)
    logging.info("Pipeline completed successfully.")

if __name__ == "__main__":
    main()
