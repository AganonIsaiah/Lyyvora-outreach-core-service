import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_FILE = os.path.join(PROJECT_ROOT, "datasets", "real_set_v1", "leads.db")
CSV_INPUT_FILE = os.path.join(PROJECT_ROOT, "datasets", "real_set_v1", "records.csv")