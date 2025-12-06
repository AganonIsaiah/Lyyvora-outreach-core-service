# Lyyvora-outreach-core-service
- Backend service for Lyyvora.

## To Open Notebook

- Click here to open [`data_pipeline.ipynb`](lead_data_pipeline/data_pipeline.ipynb) in GitHub 

## Setup and run FastAPI Locally

### First Create a .env file with these fields:


### To Run Server
1. python3 -m venv env
2. source env/bin/activate
3. pip3 install -r requirements.txt
4. uvicorn app.main:app --reload

visit http://127.0.0.1:8000/docs to see available API endpoints

### To Run Tests
- pytest
- pytest -vv (Runs tests and shows more details)

## Libraries
- FastAPI
- SQLite3 
- pytest
- scikit-learn
- pandas

# Architecture Layout
