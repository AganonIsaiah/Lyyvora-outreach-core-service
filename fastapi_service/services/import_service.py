import sqlite3
import os
import shutil
from fastapi import UploadFile, HTTPException

from shared.configs import CSV_INPUT_FILE, DB_FILE
from shared.queries import Queries

from core.lead_data_pipeline.lead_data_pipeline import run_pipeline
from core.lead_scoring_model.rules_based_baseline import run_rules_baseline

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def drop_all_tables():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM lead_scores;")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='lead_scores';")
         
        cursor.execute("DELETE FROM leads;")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='leads';")
         
        cursor.execute("DELETE FROM smartlead;")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='smartlead';")
        
        conn.commit()
        print("All tables dropped successfully.")
    except sqlite3.Error as e:
        print(f"Error dropping tables: {e}")
        raise
    finally:
        conn.close()

def process_uploaded_csv(file: UploadFile) -> dict:
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    temp_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        global CSV_INPUT_FILE
        original_csv_path = CSV_INPUT_FILE
        CSV_INPUT_FILE = temp_path

        drop_all_tables()
        run_pipeline()
        run_rules_baseline()

        return {
            "status": "success",
            "message": f"File '{file.filename}' imported and scored successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        CSV_INPUT_FILE = original_csv_path
        if os.path.exists(temp_path):
            os.remove(temp_path)
