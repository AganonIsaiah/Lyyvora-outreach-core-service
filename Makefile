# --------------------------------------------
# VARIABLES
# --------------------------------------------
VENV = env
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip
NODE = node
NPM = npm

# --------------------------------------------
# HELP
# --------------------------------------------
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make run-backend      Run FastAPI locally"
	@echo "  make run-frontend     Run Next.js dashboard locally"
	@echo "  make run              Run both backend and frontend together"

# --------------------------------------------
# VENV SETUP
# --------------------------------------------
$(VENV)/bin/python:
	@echo "🔧 Creating virtual environment..."
	python3 -m venv $(VENV)

$(VENV)/bin/activated: requirements.txt | $(VENV)/bin/python
	@echo "📦 Installing dependencies..."
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@touch $(VENV)/bin/activated

setup: $(VENV)/bin/activated

# --------------------------------------------
# USER COMMANDS
# --------------------------------------------
.PHONY: run-backend
run-backend: setup
	@echo "🚀 Starting FastAPI backend..."
	$(PYTHON) -m uvicorn fastapi_service.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: run-frontend
run-frontend:
	@echo "🎨 Starting Next.js frontend..."
	cd dashboard_ui && $(NPM) run dev

.PHONY: run
run:
	@echo "🚀 Running both backend and frontend..."
	# Start backend in background
	$(MAKE) run-backend & \
	# Start frontend in background
	$(MAKE) run-frontend
	@echo " "
	@echo "Visit Frontend Dashboard: http://localhost:3000"
	@echo "Visit FastAPI Docs: http://0.0.0.0:8000/docs"
