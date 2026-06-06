import traceback
from fastapi import UploadFile, HTTPException
from configs.database import supabase
from core.lead_data_pipeline.lead_data_pipeline import run_pipeline
from core.lead_scoring_model.rules_based_baseline import run_rules_baseline

UUID_TABLES = ["scheduled_emails"]
INT_TABLES = ["lead_scores", "smartlead", "leads"]

NULL_UUID = "00000000-0000-0000-0000-000000000000"


def drop_all_tables_supabase():
    for table in UUID_TABLES:
        try:
            supabase.table(table).delete().neq("id", NULL_UUID).execute()
        except Exception as e:
            raise Exception(f"Error clearing {table}: {str(e)}")

    for table in INT_TABLES:
        try:
            supabase.table(table).delete().neq("id", 0).execute()
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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
