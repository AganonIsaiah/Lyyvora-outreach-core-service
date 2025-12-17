# Lyyvora-outreach-core-service
- Lightweight MVP service for Lyyvora built with Python 3.13.7
- This service helps Lyyvora prioritize and engage healthcare clinics by cleaning public lead data, scoring prospects with ML, generating safe personalized outreach messages, and evaluating financing readiness with a rules engine

## Table of Contents
- [Setup and Run](#setup-and-run)
    - [Quick Setup and Run](#quick-setup-and-run)
    - [Setup and Run FastAPI or the Pipeline Locally](#setup-and-run-fastapi-or-the-pipeline-locally)
- [To Open Notebook](#to-open-notebook)
    1. [Compliant Lead Data Pipeline](#1-compliant-lead-data-pipeline)
- [Libraries](#libraries)
- [Architecture Layout](#architecture-layout)
    - [Database Schema Diagram](#database-schema-diagram)
    - [Pipeline Architecture](#pipeline-architecture)

# Setup and Run
## Before you Run, you must set the Environment Variables in the `.env` file
- To set `OLLAMA_API` get the key here: https://ollama.com/settings/keys

## Quick Setup and Run
Enter the command `make` in the terminal to view the run options

## Setup and Run FastAPI and React Frontend
### 1) Activate the virtual env using the terminal, then enter the following commands:
1. `python3 -m venv env`
2. `source env/bin/activate`
3. `pip3 install -r requirements.txt`

### 2) Run FastAPI Server
- `uvicorn fastapi_service.main:app --reload`

Once the server is running, visit http://127.0.0.1:8000/docs to see available API endpoints

### 3) Run React Frontend
1. `cd dashboard_ui`
2. `npm install`
3. `npm run dev`

### To Run Tests
- `pytest`
- `pytest -vv` (Runs tests and shows more details)

# To Open Notebook
Jupyter Notebook is used here for interactive testing, data exploration, and clear documentation of the pipeline

### 1) Compliant Lead Data Pipeline
- Click here to open [`data_pipeline.ipynb`](core/lead_data_pipeline/data_pipeline.ipynb) in GitHub 

# Libraries
- FastAPI
- SQLite3 
- pytest
- scikit-learn
- pandas


# Architecture Layout

### Database Schema Diagram
Click here to view the database diagram:
https://dbdiagram.io/d/Riipen-Lyyvora-DB-Schema-69214ff8228c5bbc1affa94e

### Pipeline Architecture
- The applications follows this logical flow: **1)** Perform data cleaning and validation with the compliant lead data pipeline, and then store the cleaned data in our database, **2)** Perform lead scoring with cleaned data,  **3)** Generate personalized outreach (i.e., emails, SMS, LinkedIn DM)

1. **lead_data_pipeline.py**: 
    - Performs data cleaning and validation on an uncleaned data set. It then stores the cleaned data in a `leads` table containing columns: `id`, `clinic_name`, `specialty`, `city`, `province`, `phone`, `website`, `email`, `notes`

2. **lead_scoring_model.py**: 
    - From the cleaned data in the `leads` table, performs lead scoring with priority ranking (0-100).
    - priority ranking is done using interpretable features such as `specialty`, `region`, `availability of contact info`, `presence of financing keywords on site`, `inferred clinic size signals`, `recent posts`
    - Data is then stored in a `lead_scores` table containing columns: `id`, `leads_id`, `score`, `top_features`, `explanation`, `created_at`
<!-- 
3. **bank_ready_rules_engine.py**:
    - Performs bank ready audit checks on lead clinics.
    - Rules include: 
        - At least 6 months in business
        - At least $10k monthly revenue
    - Performs basic doc checks:
        - 6 months bank statements
        - Last year P&L
        - Owner id -->

3. **outreach_generator.py**:
    - This service is a personalized outreach generator. It uses the data stored in our database + generative AI to create customized messages to clients.
    - It creates a subject line + 80-120 word email, a 150-char SMS, and a LinkedIn DM.
    - It uses a prompt template with slots (specialty, city, bank-ready offer, risk-reversal) and contains content guardrails (i.e., no promises of approval)
    - It provides A/B variants and a toxicity/safety check (i.e., keyword block list + length checks)
    - Data is then stored in a `outreach_messages` table containing columns: `id`, `leads_id`, `channel`, `variant`, `subject_line`, `message_body`, `created_at`


