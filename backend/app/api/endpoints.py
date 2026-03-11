import os
from fastapi import APIRouter, HTTPException, status
from app.domain.models import TelemetryPayload, IngestionResponse
from app.core.celery_app import celery_app

router = APIRouter()

@router.post("/telemetry/ingest", response_model=IngestionResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_telemetry(payload: TelemetryPayload):
    """
    Ingest stream of telemetry data from sensors.
    This endpoint delegates the heavy ML anomaly detection to a background Celery worker 
    to prevent blocking the API event loop.
    """
    try:
        # Convert Pydantic payload to dictionary to make it JSON serializable for Celery
        payload_dict = payload.model_dump(mode="json")
        
        # Enqueue the task
        task = celery_app.send_task("app.worker.tasks.process_telemetry", args=[payload_dict])
        
        return IngestionResponse(
            status="accepted",
            ticket_id=task.id,
            message="Telemetry data queued for anomaly detection"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue telemetry data: {str(e)}"
        )

@router.get("/status")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "service": "Telemetry Anomaly Engine API"}
