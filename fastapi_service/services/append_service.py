from fastapi import UploadFile
from core.lead_data_pipeline.lead_data_pipeline import run_pipeline
from core.lead_scoring_model.rules_based_baseline import run_rules_baseline


def append_csv_to_leads(file: UploadFile):
    try:
        run_pipeline(file)
        run_rules_baseline()

        return {
            "status": "success",
            "message": "Leads appended and scored successfully.",
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
