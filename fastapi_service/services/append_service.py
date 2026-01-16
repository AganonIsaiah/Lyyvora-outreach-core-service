import pandas as pd
from fastapi import UploadFile
from core.lead_data_pipeline.lead_data_pipeline import run_pipeline
from core.lead_scoring_model.rules_based_baseline import run_rules_baseline
from configs.logging_module import Logger

logger = Logger(log_file="append_service.log")


def append_csv_to_leads(file: UploadFile):
    try:
        run_pipeline(file)
        run_rules_baseline()

        return {
            "status": "success",
            "message": "Leads appended and scored successfully.",
        }

    except Exception as e:
        logger.error(f"Append service failed: {e}")
        return {"status": "error", "message": str(e)}
