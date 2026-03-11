from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="Telemetry Anomaly Engine",
    description="API for ingesting sensor data and detecting anomalies using Edge ML models.",
    version="1.0.0",
)

# Allow CORS for the GitHub Pages frontend (or any origin for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Welcome to the Telemetry Anomaly API. See /docs for the API schema."
    }
