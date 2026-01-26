# Lyyvora-outreach-core-service
# Deployments
- Frontend Dashboard Url: 
- Backend FastAPI Url: https://lyyvora-api.duckdns.org/docs

# Summary
- Outreach service for Lyyvora built with Python 3.14.2, FastAPI, React, and Next.js
- This service helps Lyyvora prioritize and engage healthcare clinics by cleaning public lead data, scoring prospects with ML, generating safe personalized outreach messages, and evaluating financing readiness with a rules engine

# Directory Structure
```
Lyyvora-outreach-core-service/
│
├── configs/                    # Centralized Python configuration modules
│   ├── database.py             # Database connections, Supabase/Postgres config
│   │── prompt_template.py      # Prompt template for outreach generator
│   │── logging_module.py       # Logging setup and formatters
│   └── configs.py              # Loads environment variables from .env 
│
├── core/                       # Core business logic (Python)
│   ├── lead_data_pipeline/     # Data cleaning, validation, ingestion pipeline
│   ├── lead_scoring_model/     # ML-based lead scoring logic
│   └── outreach_generator/     # AI-powered personalized outreach generation
│
├── fastapi_service/            # Backend service (FastAPI)
│   ├── services/               # Business/service layer
│   ├── models/                 # Request/response models
│   └── main.py                 # FastAPI application entry point
│
├── dashboard_ui/               # Frontend (React + Next.js)
│   ├── app/                    # Next.js app router
│   ├── context/                # Manages global state
│   ├── services/               # API communication layer
│   ├── mock/                   # Stores mock data
│   ├── hooks/                  # Business logic and API communication
│   └── lib/                    # Request/response models
│
└── tests/                      # Python unit tests
```
# Table of Contents
- [Services Used (AWS, Vercel, Supabase, OpenAI API)](#services-used)
- [Configure Environment Files](#configure-environment-files(do-before-running-project))
- [Setup and Run](#setup-and-run)
    - [Quick Setup and Run](#quick-setup-and-run)
    - [Setup and Run FastAPI or the Pipeline Locally](#setup-and-run-fastapi-or-the-pipeline-locally)
- [Architecture Layout](#architecture-layout)
    - [Supabase Database Schema](#supabase-database-schema)
    - [Core Business Logic Architecture](#core-business-logic-architecture)


# Services Used (AWS, Vercel, Supabase, OpenAI API)
1. `Vercel` - https://vercel.com
- Vercel is used for our Frontend React Next.js deployment, deploy the `dashboard_ui` directory on Vercel. Make sure to configure the `.env` file with the deployed frontend url.

2. `Supabase` - https://supabase.com 
- Supabase is used for PostgreSQL deployment, make sure to configure the `.env` file once the database is deployed and see: [Supabase Database Schema](#supabase-database-schema)

3. `AWS EC2` - https://aws.amazon.com
- AWS EC2 is used for Backend FastAPI deployment. Upload the project to your EC2 instance and use `Dockerfile.backend` to run the server. Make sure to configure the `dashboard_ui/.env.production` file with the deployed backend url.

4. `OpenAI API` - https://openai.com/api
- OpenAI API gpt-40-mini model is used in the outreach_generator/outreach_generator.py file for email generation. Make sure to configure the `.env` file with the OpenAI API key.


# Configure Environment Files (DO BEFORE RUNNING PROJECT)
- There are two places where the environment files need to be configured: 
1. at the root of the project, use the command: `cp .env.example .env` 
2. at the root of dashboard_ui, use the command `cp dashboard_ui/.env.example dashboard_ui/.env.development` or `cp dashboard_ui/.env.example dashboard_ui/.env.production` 


# Quick Startup and Run
2. Download Docker Desktop: https://www.docker.com/products/docker-desktop/

3. Run the command `docker-compose up --build -d` and visit:
- http://localhost:3000/dashboard
- http://localhost:8000/docs

4. When finished, run `docker-compose down` for cleanup


# Setup and Run
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

### To run a certain file
- `python3 -m core.<package_name>.<file_name>`

# Architecture Layout
### Supabase Database Schema
- The database includes 4 tables using the https://supabase.com website.

1. `auth` - This table includes a username and password and allows us to secure the app by issuing JWT tokens to the users included inside this table
```
create table public.auth (
  id bigint generated by default as identity not null,
  name text null,
  password text null,
  constraint auth_pkey primary key (id)
) TABLESPACE pg_default;
```

2. `leads` - This table includes all clinic information and acts as the master table bridging the `lead_score` and `smartlead` tables
```
create table public.leads (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  clinic_name text not null,
  clinic_main_type text null,
  clinic_sub_type text null,
  city text null,
  province text null,
  phone text null,
  email text not null,
  website_url text null,
  website_desc text null,
  total_reviews integer null,
  average_rating real null,
  email_status text null default 'Not Generated'::text,
  constraint leads_pkey primary key (id)
) TABLESPACE pg_default;
```

3. `lead_scores` - This table includes the lead scores from the `lead_scoring_model.py` for each clinic in the `leads` table
```
create table public.lead_scores (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  leads_id bigint null,
  score real null,
  top_features text null,
  explanation text null,
  model_version text null,
  constraint lead_scores_pkey primary key (id),
  constraint lead_scores_leads_id_fkey foreign KEY (leads_id) references leads (id)
) TABLESPACE pg_default;
```

4. `smartlead` - This table includes the emails generated from the `outreach_generator.py` file for the clinics
```
create table public.smartlead (
  id bigint generated by default as identity not null,
  leads_id bigint null,
  clinic_name text null,
  email text null,
  subject_line_1 text null,
  email_body_1 text null,
  subject_line_2 text null,
  email_body_2 text null,
  subject_line_3 text null,
  email_body_3 text null,
  clinic_type text null,
  city text null,
  province text null,
  campaign_batch text null,
  constraint smartlead_pkey primary key (id),
  constraint smartlead_leads_id_fkey foreign KEY (leads_id) references leads (id)
) TABLESPACE pg_default;
```
 
### Core Business Logic Architecture
- The applications follows this logical flow: **1)** Perform data cleaning and validation with the compliant lead data pipeline, and then store the cleaned data in our database, **2)** Perform lead scoring with cleaned data,  **3)** Generate personalized outreach for emails

1. **lead_data_pipeline.py**: 
    - Performs data cleaning and validation on an uncleaned data set. It then stores the cleaned data in a `leads` table containing columns: `id`, `clinic_name`, `specialty`, `city`, `province`, `phone`, `website`, `email`, `notes`

2. **lead_scoring_model.py**: 
    - From the cleaned data in the `leads` table, performs lead scoring with priority ranking (0-100).

3. **outreach_generator.py**:
    - This service is a personalized outreach generator. It uses the data stored in our database + generative AI to create customized messages to clients.
    - It creates a subject line + 80-120 word email.
    - It uses a prompt template with slots (specialty, city, bank-ready offer, risk-reversal) and contains content guardrails (i.e., no promises of approval)
