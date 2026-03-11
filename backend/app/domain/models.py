from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SensorData(BaseModel):
    sensor_id: str = Field(..., description="Unique identifier for the sensor", example="SENS-8492")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time the reading was taken")
    temperature: float = Field(..., description="Machine temperature in Celsius", example=45.2)
    vibration_hz: float = Field(..., description="Vibration frequency in Hertz", example=120.5)
    cpu_usage_pct: float = Field(..., description="CPU usage percentage of the edge node", example=14.5)

class TelemetryPayload(BaseModel):
    machine_id: str = Field(..., description="Unique identifier for the machine", example="MACH-01")
    readings: List[SensorData] = Field(..., description="List of sensor readings")

class IngestionResponse(BaseModel):
    status: str = Field(..., example="accepted")
    ticket_id: str = Field(..., description="Tracking ID for the background processing task")
    message: str = Field(..., example="Telemetry data queued for anomaly detection")
