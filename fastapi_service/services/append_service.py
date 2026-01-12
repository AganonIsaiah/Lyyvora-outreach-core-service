import pandas as pd
from fastapi import UploadFile
from core.lead_data_pipeline.lead_data_pipeline import run_pipeline
from core.lead_scoring_model.rules_based_baseline import run_rules_baseline
from shared.logging_module import Logger

logger = Logger(log_file="append_service.log")


def append_csv_to_leads(file: UploadFile):
 
    logger.info("Append service started.")

    try:
        logger.info("Running lead data pipeline.")
        run_pipeline(file)
        logger.info("Lead data pipeline completed successfully.")

        logger.info("Running rules-based baseline scoring.")
        run_rules_baseline()
        logger.info("Rules-based baseline completed successfully.")

        return {"status": "success", "message": "Leads appended and scored successfully."}

    except Exception as e:
        logger.error(f"Append service failed: {e}")
        return {"status": "error", "message": str(e)}
