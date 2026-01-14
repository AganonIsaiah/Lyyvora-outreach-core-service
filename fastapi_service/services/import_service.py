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

        for table in ["lead_scores", "leads", "smartlead"]:
            cursor.execute(Queries.delete_all_from_table(table))
            cursor.execute(Queries.reset_autoincrement(table))

        conn.commit()
        print("All tables dropped successfully.")
    except sqlite3.Error as e:
        print(f"Error dropping tables: {e}")
        raise
    finally:
        conn.close()


def process_uploaded_csv(file: UploadFile) -> dict:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        file.file.seek(0)
        drop_all_tables()
        run_pipeline(file)
        run_rules_baseline()

        return {
            "status": "success",
            "message": f"File '{file.filename}' imported and scored successfully.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
