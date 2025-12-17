from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from backend.database import Base, engine
from backend.models.leads import Lead

app=FastAPI(title="Lyyvora Lead Pipeline API")

@app.get("/")
def root():
    return{"message": "welcome"}

@app.post("/create-tables")
def create_tables():
    Base.metadata.create_all(bind=engine)
    return {"message": "Tables created successfully"}