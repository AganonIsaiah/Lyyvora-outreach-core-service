from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(title="Lyyvora Lead Pipeline API")


@app.get("/")
def root():
    return{"message": "welcome"}