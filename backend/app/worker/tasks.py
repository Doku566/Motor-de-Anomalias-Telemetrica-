import logging
import json
from celery import shared_task
from app.ml.detector import detector

logger = logging.getLogger(__name__)

@shared_task(name="app.worker.tasks.process_telemetry")
def process_telemetry(payload_dict: dict):
    """
    Background task to process ingested telemetry.
    Deserializes the data and scores it against the ML Anomaly Detection model.
    """
    machine_id = payload_dict.get("machine_id", "UNKNOWN")
    readings = payload_dict.get("readings", [])
    
    logger.info(f"Worker received telemetry batch for machine {machine_id} [{len(readings)} readings]")
    results = []
    
    for reading in readings:
        temp = reading.get("temperature", 0.0)
        vib = reading.get("vibration_hz", 0.0)
        cpu = reading.get("cpu_usage_pct", 0.0)
        sensor_id = reading.get("sensor_id")
        
        # Process through the ML Model pipeline
        analysis = detector.predict(temp, vib, cpu)
        
        # Flag action if necessary
        if analysis["is_anomaly"]:
            logger.warning(
                f"🚨 ANOMALY DETECTED! | Machine: {machine_id} | Sensor: {sensor_id} | "
                f"Metrics: Temp={temp}°C, Vib={vib}Hz, CPU={cpu}% | Score: {analysis['anomaly_score']}"
            )
        
        results.append({
            "sensor_id": sensor_id,
            "analysis": analysis
        })
        
    # In a fully complete system, this would write the results to a time-series DB (like InfluxDB / TimescaleDB)
    # or emit a websocket event so dashboards can auto-update.
    # For this demonstration, processing the queue and logging is sufficient.
    return {
        "machine_id": machine_id,
        "processed_count": len(results),
        "status": "success",
        "anomalies_found": sum(1 for r in results if r["analysis"]["is_anomaly"])
    }
