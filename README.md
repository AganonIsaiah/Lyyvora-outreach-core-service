# Lyyvora Dev Outreach Core Service

A full-stack outreach automation platform built for Lyyvora to identify, score, and engage healthcare clinics with AI-generated personalized emails.

**Dev links**: use mock data for demonstration. Real production environment is separate for dev environment.

**Live dev deployments:**
- Dashboard: https://lyyvora-outreach-ui-dev.aganonlabs.com
- API Docs: https://lyyvora-outreach-api-dev.aganonlabs.com/docs

---

## What This Project Does

Lyyvora needs to reach out to healthcare clinics at scale. This service automates the entire pipeline:

1. **Ingest & Clean** — Uploads a raw CSV of clinic leads, validates and normalizes the data, then stores it in a PostgreSQL database.
2. **Score** — Runs an ML-based lead scoring model (0–100) to rank clinics by their likelihood to convert, identifying which ones to prioritize.
3. **Generate** — Uses GPT-4o-mini with a structured prompt template to write personalized outreach emails (subject line + 80–120 word body) for each clinic based on their specialty, city, and other attributes.
4. **Export** — Exports generated emails grouped by campaign batch into a `.csv` file ready to upload to Smartlead for delivery.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Next.js (App Router), TypeScript, Redux Toolkit, Tailwind CSS |
| Backend | Python 3.14, FastAPI, WebSockets |
| Database | PostgreSQL via Supabase |
| AI | OpenAI GPT-4o-mini |
| Email delivery | AWS SES |
| Deployment | Vercel (frontend), AWS EC2 (backend), Docker |

---

## Key Features

### Dashboard & State Management
- **Redux Toolkit** manages all global state — clinic data, filters, auth, and campaign status — in a single store.
- **Page-level caching**: fetched pages are stored in the Redux store, so navigating back to a previously visited page is instant with no re-fetch.
- **Clinic detail caching**: individual clinic pages are cached (LRU-style, capped at 100 entries) so repeated visits don't hit the API again.

### Clinics Table
- Paginated table (100 records per page) showing all clinics with their lead score, type, city, province, email status, campaign batch, and average rating.
- **Smart sorting**: clinics are always sorted by email status priority (`Replied → Exported → Generated → Not Generated`), then by lead score descending — highest-value uncontacted clinics appear first.
- **Filters**: filter by clinic type, email status, campaign batch, and sort order. Active filters are displayed as removable chips.
- Skeleton loading state during data fetches.

### Outreach Generator
- Configurable **word limit** (1–200) and **batch size** (1–100, capped to the number of uncontacted clinics) before triggering generation.
- Editable **prompt template** displayed directly in the UI, so the copy can be adjusted without a code deploy.
- **Real-time progress** via WebSocket: the campaign stats cards (Batch Progress, Total Generated, Emails Sent, Replies Received) update live as emails are generated.
- Generate button is disabled until both word limit and batch size are set, and while generation is in progress.

### Campaign Stats
- Four progress cards at the top of the dashboard, each showing a count, a denominator, and a live progress bar:
  - **Batch Progress** — emails generated in the current run vs. the requested batch size
  - **Total Generated** — all generated emails vs. total clinics
  - **Emails Sent** — sent vs. total clinics
  - **Replies Received** — replies vs. total clinics

### Authentication & Roles
- JWT-based authentication using a custom `auth` table in Supabase.
- `role` column on the `auth` table enables role-based access control (`admin` vs. standard user).
- The frontend hydrates the user's role into Redux on login and uses it to conditionally show admin-only actions.

### CSV Import & Export
- **Import**: upload a raw clinic `.csv` from the UI; the backend runs the data pipeline and populates the database.
- **Export**: select a campaign batch ID from the table filter, then export a Smartlead-ready `.csv` of the generated emails for that batch.

---

## Directory Structure

```
Lyyvora-outreach-core-service/
│
├── configs/                    # Centralized Python configuration modules
│   ├── database.py             # Supabase/Postgres connection setup
│   ├── prompt_template.py      # AI prompt template for outreach generation
│   ├── logging_module.py       # Logging setup and formatters
│   └── configs.py              # Environment variable loader
│
├── core/                       # Core business logic (Python)
│   ├── lead_data_pipeline/     # CSV ingestion, data cleaning, validation
│   ├── lead_scoring_model/     # ML-based lead scoring (0–100 priority score)
│   └── outreach_generator/     # GPT-4o-mini powered email generation
│
├── fastapi_service/            # Backend API (FastAPI)
│   ├── services/               # Business/service layer
│   ├── models/                 # Request/response Pydantic models
│   └── main.py                 # Application entry point
│
├── dashboard_ui/               # Frontend (React + Next.js)
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard (table, filters, generator, stats)
│   │   ├── clinics/[id]/       # Individual clinic detail page
│   │   └── login/              # Login page
│   ├── store/                  # Redux Toolkit slices (dashboardSlice, authSlice)
│   ├── context/                # DashboardContext wrapping Redux for component access
│   ├── hooks/                  # Custom hooks (outreach generation, CSV import/export, auth)
│   ├── services/               # API communication layer
│   └── lib/                    # Shared TypeScript types and constants
│
└── tests/                      # Python unit tests
```

---

## Database Schema (Supabase / PostgreSQL)

Five tables power the application:

**`auth`** — user accounts with role-based access (`role` defaults to `'user'`; set to `'admin'` for elevated permissions)
```sql
create table public.auth (
  id bigint generated by default as identity not null,
  name text null,
  password text null,
  role text not null default 'user'::text,
  constraint auth_pkey primary key (id)
) TABLESPACE pg_default;
```

**`leads`** — master clinic table; source of truth for all other tables
```sql
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

**`lead_scores`** — ML scoring output per clinic
```sql
create table public.lead_scores (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  leads_id bigint null,
  score real null,
  top_features text null,
  explanation text null,
  model_version text null,
  constraint lead_scores_pkey primary key (id),
  constraint lead_scores_leads_id_fkey foreign key (leads_id) references leads (id)
) TABLESPACE pg_default;
```

**`scheduled_emails`** — tracks scheduled delivery and send status for each of the 3 follow-up emails per clinic
```sql
create table public.scheduled_emails (
  id uuid not null default gen_random_uuid (),
  send_1_at timestamp with time zone null,
  status_1 text not null default 'pending'::text,
  sent_1_at timestamp with time zone null,
  error_1 text null,
  send_2_at timestamp with time zone null,
  status_2 text not null default 'pending'::text,
  sent_2_at timestamp with time zone null,
  error_2 text null,
  send_3_at timestamp with time zone null,
  status_3 text not null default 'pending'::text,
  sent_3_at timestamp with time zone null,
  error_3 text null,
  created_at timestamp with time zone null default now(),
  smartlead_id bigint null,
  constraint scheduled_emails_pkey primary key (id),
  constraint scheduled_emails_smartlead_id_fkey foreign key (smartlead_id) references smartlead (id)
) TABLESPACE pg_default;
```

**`smartlead`** — AI-generated outreach emails (up to 3 follow-ups per clinic)
```sql
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
  constraint smartlead_leads_id_fkey foreign key (leads_id) references leads (id)
) TABLESPACE pg_default;
```

---

## Core Pipeline Architecture

The application follows a three-stage pipeline:

```
Raw CSV  →  lead_data_pipeline  →  leads table
                                        ↓
                              lead_scoring_model  →  lead_scores table
                                        ↓
                              outreach_generator  →  smartlead table
                                        ↓
                                 Export .csv  →  Smartlead campaign
```

1. **`lead_data_pipeline.py`** — Validates and normalizes raw clinic data (deduplication, phone/email formatting, type classification) and inserts clean records into the `leads` table.

2. **`lead_scoring_model.py`** — Scores each clinic on a 0–100 scale using an ML model trained on signals like specialty, review count, average rating, and geography. Scores and top feature explanations are saved to `lead_scores`.

3. **`outreach_generator.py`** — For each uncontacted clinic, builds a prompt from the template with clinic-specific slots (specialty, city, offer details) and calls GPT-4o-mini to generate a subject line and email body. Includes content guardrails (no approval promises). Results are stored in `smartlead` and the clinic's `email_status` is updated.

---

## External Services

| Service | Purpose |
|---|---|
| **Vercel** | Hosts the Next.js frontend (`dashboard_ui`) |
| **AWS EC2** | Hosts the FastAPI backend (via `Dockerfile.backend`) |
| **Supabase** | Managed PostgreSQL database |
| **OpenAI API** | GPT-4o-mini for email generation |
| **AWS SES** | Email delivery for generated outreach |

---

## Setup & Running Locally

### 1. Configure environment files

```bash
# Backend environment
cp .env.example .env

# Frontend environment (choose dev or production)
cp dashboard_ui/.env.example dashboard_ui/.env.development
```

### 2. Run with Docker (recommended)

```bash
docker-compose up --build -d
```

Then visit:
- Frontend: http://localhost:3000/dashboard
- API docs: http://localhost:8000/docs

```bash
# Cleanup
docker-compose down
```

### 3. Run without Docker

**Backend:**
```bash
python3 -m venv env
source env/bin/activate
pip3 install -r requirements.txt
uvicorn fastapi_service.main:app --reload
```

**Frontend:**
```bash
cd dashboard_ui
npm install
npm run dev
```

**Tests:**
```bash
pytest          # run all tests
pytest -vv      # verbose output
```

**Run a pipeline module directly:**
```bash
python3 -m core.<package_name>.<file_name>
```
