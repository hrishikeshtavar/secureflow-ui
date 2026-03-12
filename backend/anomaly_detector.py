"""
SecureFlow AI — Unsupervised Anomaly Detection (Mentor Feedback)
Uses Isolation Forest for anomaly detection on invoice features.
Handles class imbalance naturally — no labelled fraud data needed.

Why Isolation Forest:
- Unsupervised: learns what "normal" looks like, flags deviations
- Handles class imbalance natively (designed for rare outliers)
- Fast inference (important for real-time demo)
- Explainable: anomaly score maps to "how different is this from normal"
- Works with small datasets (our demo has ~15-20 invoices)

Mentor note: "A pattern of anomalies = fraud"
- Single anomaly = medium confidence (could be data entry error)
- Multiple anomalies from same entity = high confidence
- Anomalies + graph pattern = fraud signal
"""
import numpy as np
from typing import Optional


class InvoiceAnomalyDetector:
    """
    Isolation Forest-based anomaly detector for invoice data.
    Extracts numerical features from parsed invoices and scores them.
    """

    def __init__(self):
        self.model = None
        self.is_fitted = False
        self.feature_means = {}
        self.feature_stds = {}
        self.training_data = []

        # Pre-load with "normal" invoice feature vectors for the demo
        # In production, this would be trained on historical invoice data
        self._seed_training_data()

    def _seed_training_data(self):
        """
        Seed with synthetic normal invoice patterns for the demo.
        Mentor note: Use synthetic data to handle class imbalance.
        These represent typical invoice patterns for our demo buyer.
        """
        np.random.seed(42)

        normal_invoices = [
            # [amount, supplier_history_count, days_since_registration, amount_to_avg_ratio, is_new_supplier, description_length]
            [4250.0, 12, 650, 1.0, 0, 25],
            [4100.0, 11, 650, 0.96, 0, 30],
            [4500.0, 10, 650, 1.06, 0, 22],
            [1875.0, 8, 560, 1.0, 0, 18],
            [1950.0, 7, 560, 1.04, 0, 20],
            [1800.0, 9, 560, 0.96, 0, 28],
            [12500.0, 6, 1460, 1.0, 0, 35],
            [12800.0, 5, 1460, 1.02, 0, 32],
            [11900.0, 7, 1460, 0.95, 0, 40],
            [3200.0, 10, 730, 1.0, 0, 20],
            [3400.0, 9, 730, 1.06, 0, 22],
            [3000.0, 11, 730, 0.94, 0, 19],
            [850.0, 4, 500, 1.0, 0, 15],
            [900.0, 3, 500, 1.06, 0, 16],
            [800.0, 5, 500, 0.94, 0, 14],
            # Add some slight variation
            [5200.0, 8, 400, 1.1, 0, 24],
            [2100.0, 6, 300, 1.05, 0, 20],
            [9800.0, 4, 900, 0.98, 0, 30],
            [1500.0, 3, 200, 0.95, 0, 18],
            [6500.0, 7, 550, 1.02, 0, 26],
        ]

        self.training_data = normal_invoices
        self._fit()

    def _fit(self):
        """Fit the Isolation Forest on training data."""
        try:
            from sklearn.ensemble import IsolationForest

            X = np.array(self.training_data)

            # Compute feature statistics for normalisation
            self.feature_means = {i: X[:, i].mean() for i in range(X.shape[1])}
            self.feature_stds = {i: max(X[:, i].std(), 0.001) for i in range(X.shape[1])}

            # Normalise
            X_norm = (X - np.array([self.feature_means[i] for i in range(X.shape[1])])) / \
                     np.array([self.feature_stds[i] for i in range(X.shape[1])])

            # Fit Isolation Forest
            # contamination=0.1 means we expect ~10% anomalies
            # n_estimators=100 for robust detection
            self.model = IsolationForest(
                n_estimators=100,
                contamination=0.1,
                random_state=42,
                max_samples="auto",
            )
            self.model.fit(X_norm)
            self.is_fitted = True

        except ImportError:
            # sklearn not available — fall back to statistical method
            self.is_fitted = False

    def extract_features(self, entities: dict, historical_data: dict = None) -> list[float]:
        """
        Extract numerical features from parsed invoice entities.

        Features:
        1. amount: invoice total amount
        2. supplier_history: number of prior invoices from this supplier
        3. days_since_registration: how old is the supplier
        4. amount_to_avg_ratio: invoice amount / historical average for this supplier
        5. is_new_supplier: 1 if first-time supplier, 0 otherwise
        6. description_length: length of description field (unusually long = injection risk)
        """
        # Amount
        amount = 0.0
        total = entities.get("total_amount", {})
        if total.get("normalised") and isinstance(total["normalised"], dict):
            amount = total["normalised"].get("amount", 0)
        elif total.get("value"):
            try:
                amount = float(total["value"].replace("£", "").replace("$", "").replace(",", "").strip())
            except (ValueError, AttributeError):
                pass

        # Supplier history
        supplier_name = entities.get("supplier_name", {}).get("value", "Unknown")
        hist = historical_data or {}
        supplier_hist = hist.get(supplier_name, {})
        invoice_count = supplier_hist.get("invoice_count", 0)
        avg_amount = supplier_hist.get("avg_amount", amount)  # default to current if no history

        # Days since registration
        days_since_reg = 0
        first_seen = supplier_hist.get("first_seen", "")
        if first_seen:
            try:
                from datetime import datetime, date
                reg_date = datetime.strptime(first_seen, "%Y-%m-%d").date()
                days_since_reg = (date.today() - reg_date).days
            except (ValueError, TypeError):
                days_since_reg = 0

        # Amount to average ratio
        ratio = amount / avg_amount if avg_amount > 0 else 1.0

        # Is new supplier
        is_new = 1 if invoice_count == 0 else 0

        # Description length (longer descriptions may indicate injection attempts)
        desc = entities.get("description", {}).get("value", "")
        notes = entities.get("notes", {}).get("value", "")
        desc_length = len(desc) + len(notes)

        return [amount, invoice_count, days_since_reg, ratio, is_new, desc_length]

    def score(self, entities: dict, historical_data: dict = None) -> dict:
        """
        Score an invoice for anomalies using Isolation Forest.

        Returns:
        - anomaly_score: 0.0 (normal) to 1.0 (highly anomalous)
        - is_anomaly: bool
        - feature_contributions: which features drove the anomaly
        """
        features = self.extract_features(entities, historical_data)

        if not self.is_fitted or self.model is None:
            return self._statistical_fallback(features)

        # Normalise using training stats
        features_norm = [
            (features[i] - self.feature_means.get(i, 0)) / self.feature_stds.get(i, 1)
            for i in range(len(features))
        ]

        X = np.array([features_norm])

        # Isolation Forest decision_function: negative = anomaly, positive = normal
        # We invert and normalise to 0-1 range
        raw_score = self.model.decision_function(X)[0]
        prediction = self.model.predict(X)[0]  # -1 = anomaly, 1 = normal

        # Convert to 0-1 anomaly score (higher = more anomalous)
        # decision_function typically ranges from about -0.5 to 0.5
        anomaly_score = max(0.0, min(1.0, 0.5 - raw_score))

        # Feature contribution analysis
        # Compare each feature's z-score to identify which drove the anomaly
        feature_names = [
            "amount", "supplier_history", "days_since_registration",
            "amount_to_avg_ratio", "is_new_supplier", "description_length"
        ]
        contributions = []
        for i, (name, z_score) in enumerate(zip(feature_names, features_norm)):
            if abs(z_score) > 1.5:  # More than 1.5 std deviations
                direction = "unusually high" if z_score > 0 else "unusually low"
                contributions.append({
                    "feature": name,
                    "value": features[i],
                    "z_score": round(z_score, 2),
                    "direction": direction,
                    "description": self._describe_feature_anomaly(name, features[i], z_score),
                })

        return {
            "anomaly_score": round(anomaly_score, 4),
            "is_anomaly": prediction == -1,
            "raw_isolation_score": round(raw_score, 4),
            "features": {name: features[i] for i, name in enumerate(feature_names)},
            "feature_contributions": contributions,
            "method": "isolation_forest",
        }

    def _statistical_fallback(self, features: list[float]) -> dict:
        """
        Statistical fallback when sklearn is not available.
        Uses z-scores against training data statistics.
        """
        feature_names = [
            "amount", "supplier_history", "days_since_registration",
            "amount_to_avg_ratio", "is_new_supplier", "description_length"
        ]

        z_scores = []
        contributions = []
        for i in range(len(features)):
            mean = self.feature_means.get(i, 0)
            std = self.feature_stds.get(i, 1)
            z = (features[i] - mean) / std
            z_scores.append(abs(z))

            if abs(z) > 1.5:
                direction = "unusually high" if z > 0 else "unusually low"
                contributions.append({
                    "feature": feature_names[i],
                    "value": features[i],
                    "z_score": round(z, 2),
                    "direction": direction,
                    "description": self._describe_feature_anomaly(feature_names[i], features[i], z),
                })

        # Overall anomaly score based on max z-score
        max_z = max(z_scores) if z_scores else 0
        anomaly_score = min(1.0, max_z / 5.0)  # normalise: z=5 maps to score 1.0

        return {
            "anomaly_score": round(anomaly_score, 4),
            "is_anomaly": anomaly_score > 0.4,
            "raw_isolation_score": None,
            "features": {name: features[i] for i, name in enumerate(feature_names)},
            "feature_contributions": contributions,
            "method": "statistical_fallback",
        }

    def _describe_feature_anomaly(self, feature: str, value: float, z_score: float) -> str:
        """Generate human-readable description of a feature anomaly."""
        descriptions = {
            "amount": f"Invoice amount (£{value:,.2f}) is {'significantly higher' if z_score > 0 else 'significantly lower'} than typical invoices.",
            "supplier_history": f"Supplier has only {int(value)} prior invoices, {'far fewer' if z_score < 0 else 'more'} than typical.",
            "days_since_registration": f"Supplier registered {int(value)} days ago — {'very recently' if z_score < 0 else 'longer than usual'}.",
            "amount_to_avg_ratio": f"Amount is {value:.1f}x the supplier's historical average — {'well above' if z_score > 0 else 'below'} normal range.",
            "is_new_supplier": "This is a first-time supplier with no transaction history.",
            "description_length": f"Description field is {int(value)} characters — {'unusually long, potential injection risk' if z_score > 0 else 'normal length'}.",
        }
        return descriptions.get(feature, f"{feature} value ({value}) is unusual (z-score: {z_score:.1f}).")


# Singleton instance for the demo
_detector = None

def get_anomaly_detector() -> InvoiceAnomalyDetector:
    global _detector
    if _detector is None:
        _detector = InvoiceAnomalyDetector()
    return _detector


def score_invoice_anomaly(entities: dict, historical_data: dict = None) -> dict:
    """Convenience function to score a single invoice."""
    detector = get_anomaly_detector()
    return detector.score(entities, historical_data)
