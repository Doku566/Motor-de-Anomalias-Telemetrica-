import numpy as np
from sklearn.ensemble import IsolationForest
import logging

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """
    Lightweight Edge ML Model for anomaly detection using Isolation Forests.
    Using scikit-learn for memory efficiency and speed rather than Deep Learning
    which overkills the constraints of Edge/IoE nodes.
    """
    
    def __init__(self, contamination_rate=0.05):
        # We assume 5% of our historical data might be anomalous
        self.model = IsolationForest(
            n_estimators=100, 
            max_samples='auto', 
            contamination=contamination_rate,
            random_state=42
        )
        self.is_fitted = False
        
        # In a real-world scenario, we would load existing history from a fast DB/Storage
        # For this prototype we will use dummy baseline data to pre-warm the model
        self._pre_warm_model()

    def _pre_warm_model(self):
        """Generates baseline data to train the model so it can predict immediately."""
        logger.info("Pre-warming Isolation Forest Model with synthetic baseline data...")
        # Normal operating parameters:
        # Temp ~ [40-50], Vib ~ [100-110], CPU ~ [10-30]
        # Shape: (samples, features: [temp, vib, cpu])
        normal_data = np.column_stack((
            np.random.normal(45, 2.5, 500),    # Temperature
            np.random.normal(105, 2.0, 500),   # Vibration
            np.random.normal(20, 5.0, 500)     # CPU
        ))
        
        # Inject some slight anomalies
        anomalies = np.column_stack((
            np.random.uniform(70, 90, 20),      # High Temp
            np.random.uniform(140, 160, 20),    # High Vib
            np.random.uniform(80, 100, 20)      # High CPU
        ))
        
        training_data = np.vstack((normal_data, anomalies))
        self.model.fit(training_data)
        self.is_fitted = True
        logger.info("Model pre-warmed successfully.")

    def predict(self, temperature: float, vibration: float, cpu: float) -> dict:
        """
        Takes sensor readings and returns if they are anomalous.
        Returns 1 for normal, -1 for anomaly (as per sklearn API),
        along with the anomaly score (lower is more anomalous).
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction.")
            
        features = np.array([[temperature, vibration, cpu]])
        prediction = self.model.predict(features)[0]
        score_val = self.model.decision_function(features)[0]
        
        # Scikit-Learn IsolationForest returns -1 for outliers, 1 for inliers.
        is_anomaly = True if prediction == -1 else False
        
        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(float(score_val), 4),
            "threat_level": "CRITICAL" if is_anomaly else "NORMAL"
        }

# Singleton instance across the worker process
detector = AnomalyDetector()
