from fastapi import UploadFile, HTTPException
from configs.database import supabase
from core.lead_data_pipeline.lead_data_pipeline import run_pipeline
from core.lead_scoring_model.rules_based_baseline import run_rules_baseline

TABLES_TO_TRUNCATE = ["lead_scores", "smartlead", "leads"]


def drop_all_tables_supabase():
    for table in TABLES_TO_TRUNCATE:
        try:
            resp = supabase.table(table).delete().neq("id", 0).execute()
        except Exception as e:
            raise Exception(f"Error clearing {table}: {str(e)}")


def process_uploaded_csv(file: UploadFile) -> dict:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        drop_all_tables_supabase()

        file.file.seek(0)

        run_pipeline(file)
        run_rules_baseline()

        return {
            "status": "success",
            "message": f"File '{file.filename}' imported and scored successfully.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
