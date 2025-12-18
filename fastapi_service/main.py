from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_service.database import Base, engine
from fastapi_service.models.leads import Lead

app=FastAPI(title="Lyyvora Lead Pipeline API")

@app.get("/")
def root():
    return{"message": "welcome"}


