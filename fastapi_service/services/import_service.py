import sqlite3
from fastapi import UploadFile, HTTPException

from shared.configs import DB_FILE
from shared.queries import Queries

from core.lead_data_pipeline.lead_data_pipeline import run_pipeline
from core.lead_scoring_model.rules_based_baseline import run_rules_baseline


def drop_all_tables():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute(Queries.create_table_leads())
        cursor.execute(Queries.create_table_lead_scores())
        cursor.execute(Queries.create_smartlead_table())
        
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
    """
    Process a CSV uploaded via FastAPI, drop existing tables,
    run the pipeline, and run the scoring model.
    """

    # Only accept CSVs
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        # Reset file pointer just in case
        file.file.seek(0)

        # Drop all previous tables
        drop_all_tables()

        # Run the pipeline directly on the uploaded file
        run_pipeline(file)

        # Run the scoring model
        run_rules_baseline()

        return {
            "status": "success",
            "message": f"File '{file.filename}' imported and scored successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
