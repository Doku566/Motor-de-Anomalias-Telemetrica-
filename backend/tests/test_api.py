import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "Telemetry Anomaly Engine API"}

def test_ingest_telemetry():
    payload = {
        "machine_id": "TEST-MACH-01",
        "readings": [
            {
                "sensor_id": "SENS-01",
                "temperature": 45.5,
                "vibration_hz": 110.2,
                "cpu_usage_pct": 25.0
            }
        ]
    }
    # Test valid data ingestion
    response = client.post("/api/v1/telemetry/ingest", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "accepted"
    assert "ticket_id" in data
    assert "queued" in data["message"]

def test_ingest_invalid_data():
    # Missing required 'machine_id'
    payload = {
        "readings": [
            {
                "sensor_id": "SENS-01",
                "temperature": 45.5
            }
        ]
    }
    response = client.post("/api/v1/telemetry/ingest", json=payload)
    assert response.status_code == 422 # Unprocessable Entity (Pydantic validation error)
