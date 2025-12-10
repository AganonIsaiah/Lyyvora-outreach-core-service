# --------------------------------------------
# VARIABLES
# --------------------------------------------
VENV = env
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip

# --------------------------------------------
# HELP (Visible to user)
# --------------------------------------------
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make run-backend      Run FastAPI locally"
	@echo "  make run-pipeline     Run the data pipeline"
	@echo "  make test             Run Python tests locally"

# --------------------------------------------
# INTERNAL TARGETS (Auto venv setup)
# --------------------------------------------
$(VENV)/bin/python:
	@echo "🔧 Creating virtual environment..."
	python3 -m venv $(VENV)

$(VENV)/bin/activated: requirements.txt | $(VENV)/bin/python
	@echo "📦 Installing dependencies into virtual environment..."
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@touch $(VENV)/bin/activated

# Ensures venv + deps are ready before running anything
setup: $(VENV)/bin/activated

# --------------------------------------------
# USER COMMANDS (run inside venv automatically)
# --------------------------------------------
.PHONY: run-backend
run-backend: setup
	@echo "============================================================================" 
	@echo "🚀 Starting FastAPI backend. Visit http://0.0.0.0:8000/docs to view APIs..."
	@echo "============================================================================" 
	@echo " "
	$(PYTHON) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: run-pipeline
run-pipeline: setup
	@echo "============================================================================" 
	@echo "📊 Running data pipeline..."
	@echo "============================================================================" 
	@echo " "
	$(PYTHON) lead_data_pipeline/data_pipeline.py

.PHONY: test
test: setup
	@echo "============================================================================" 
	@echo "🧪 Running tests..."
	@echo "============================================================================" 
	@echo " "
	$(PYTHON) -m pytest --maxfail=1 --disable-warnings -vv
