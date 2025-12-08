# ----------------------------
# VARIABLES
# ----------------------------
APP_NAME = lyyvora
PYTHON = python
DOCKER_IMAGE = lyyvora:test

# ----------------------------
# DEFAULT
# ----------------------------
.PHONY: help
help:
	@echo "Makefile commands:"
	@echo "  make run-backend      Run FastAPI locally"
	@echo "  make run-pipeline     Run the data pipeline"
	@echo "  make run-ml           Run lead scoring ML script"
	@echo "  make test             Run Python tests locally"
	@echo "  make docker-build     Build Docker image"
	@echo "  make docker-run       Run FastAPI in Docker"
	@echo "  make docker-pipeline  Run data pipeline in Docker"
	@echo "  make docker-ml        Run ML script in Docker"
	@echo "  make docker-test      Run tests in Docker"

# ----------------------------
# LOCAL PYTHON COMMANDS
# ----------------------------
.PHONY: run-backend
run-backend:
	$(PYTHON) -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: run-pipeline
run-pipeline:
	$(PYTHON) lead_data_pipeline/data_pipeline.py

.PHONY: run-ml
run-ml:
	$(PYTHON) ml/lead_scoring.py

.PHONY: test
test:
	$(PYTHON) -m pytest --maxfail=1 --disable-warnings -vv

# ----------------------------
# DOCKER COMMANDS
# ----------------------------
.PHONY: docker-build
docker-build:
	docker build -t $(DOCKER_IMAGE) .

.PHONY: docker-run
docker-run:
	docker run --rm -p 8000:8000 $(DOCKER_IMAGE)

.PHONY: docker-pipeline
docker-pipeline:
	docker run --rm $(DOCKER_IMAGE) python lead_data_pipeline/data_pipeline.py

.PHONY: docker-ml
docker-ml:
	docker run --rm $(DOCKER_IMAGE) python ml/lead_scoring.py

.PHONY: docker-test
docker-test:
	docker run --rm $(DOCKER_IMAGE) python -m pytest --maxfail=1 --disable-warnings -vv
