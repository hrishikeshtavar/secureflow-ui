"""
SecureFlow AI — Fraud Detection Rules (Person 1)
Analyses parsed invoice data for anomalies.
Returns structured fraud flags with evidence and confidence.
"""
from typing import Optional


# Simulated historical data for demo
HISTORICAL_DATA = {
    "TechParts UK Ltd": {"avg_amount": 4250.0, "invoice_count": 12, "first_seen": "2024-06-15"},
    "Office Supplies Direct": {"avg_amount": 1900.0, "invoice_count": 8, "first_seen": "2024-09-01"},
    "Zenith Industrial Co": {"avg_amount": 5800.0, "invoice_count": 3, "first_seen": "2025-11-20"},
    "Global Freight Solutions": {"avg_amount": 3100.0, "invoice_count": 0, "first_seen": "2026-03-09"},  # brand new
}

# Previously seen invoice IDs (for duplicate detection)
SEEN_INVOICE_IDS = {}


def _get_amount(entities: dict) -> Optional[float]:
    total = entities.get("total_amount", {})
    if total.get("normalised") and isinstance(total["normalised"], dict):
        return total["normalised"].get("amount")
    # Try to parse from value string
    val = total.get("value", "")
    try:
        cleaned = val.replace("£", "").replace("$", "").replace(",", "").strip()
        return float(cleaned)
    except (ValueError, AttributeError):
        return None


def _get_supplier(entities: dict) -> str:
    return entities.get("supplier_name", {}).get("value", "Unknown")


def _get_invoice_id(entities: dict) -> str:
    return entities.get("invoice_id", {}).get("value", "")


def check_duplicate_invoice(entities: dict) -> Optional[dict]:
    """Check if this invoice ID has been seen from a different supplier."""
    inv_id = _get_invoice_id(entities)
    supplier = _get_supplier(entities)

    if not inv_id:
        return None

    if inv_id in SEEN_INVOICE_IDS:
        prev_supplier = SEEN_INVOICE_IDS[inv_id]
        if prev_supplier != supplier:
            return {
                "flag": "duplicate_invoice_id",
                "severity": "critical",
                "confidence": 0.98,
                "detail": f"Invoice number '{inv_id}' was previously submitted by '{prev_supplier}'. Now submitted by '{supplier}'.",
                "evidence": {
                    "invoice_id": inv_id,
                    "original_supplier": prev_supplier,
                    "current_supplier": supplier,
                },
            }
        else:
            return {
                "flag": "resubmitted_invoice",
                "severity": "high",
                "confidence": 0.95,
                "detail": f"Invoice '{inv_id}' has been submitted before by the same supplier '{supplier}'. Possible duplicate submission.",
                "evidence": {"invoice_id": inv_id, "supplier": supplier},
            }

    # Record this invoice
    SEEN_INVOICE_IDS[inv_id] = supplier
    return None


def check_amount_anomaly(entities: dict) -> Optional[dict]:
    """Check if the invoice amount is significantly above historical average."""
    amount = _get_amount(entities)
    supplier = _get_supplier(entities)

    if amount is None:
        return None

    hist = HISTORICAL_DATA.get(supplier)
    if hist is None or hist["invoice_count"] == 0:
        return None  # new supplier handled separately

    avg = hist["avg_amount"]
    if avg == 0:
        return None

    ratio = amount / avg

    if ratio > 3.0:
        return {
            "flag": "amount_anomaly",
            "severity": "critical" if ratio > 5.0 else "high",
            "confidence": min(0.95, 0.7 + (ratio - 3.0) * 0.05),
            "detail": f"Invoice amount £{amount:,.2f} is {ratio:.1f}x the historical average of £{avg:,.2f} for '{supplier}'.",
            "evidence": {
                "invoice_amount": amount,
                "historical_average": avg,
                "deviation_ratio": round(ratio, 2),
                "invoice_count": hist["invoice_count"],
            },
        }
    return None


def check_new_supplier(entities: dict) -> Optional[dict]:
    """Flag invoices from suppliers with no or very little history."""
    supplier = _get_supplier(entities)
    hist = HISTORICAL_DATA.get(supplier)

    if hist is None:
        return {
            "flag": "unknown_supplier",
            "severity": "medium",
            "confidence": 0.75,
            "detail": f"Supplier '{supplier}' has no prior transaction history. First-time supplier.",
            "evidence": {"supplier": supplier, "prior_invoices": 0},
        }

    if hist["invoice_count"] == 0:
        return {
            "flag": "new_supplier",
            "severity": "high",
            "confidence": 0.82,
            "detail": f"Supplier '{supplier}' was registered very recently ({hist['first_seen']}) with no prior invoices.",
            "evidence": {
                "supplier": supplier,
                "registration_date": hist["first_seen"],
                "prior_invoices": 0,
            },
        }
    return None


def check_supplier_address_mismatch(entities: dict) -> Optional[dict]:
    """Flag if supplier address seems suspicious."""
    address = entities.get("supplier_address", {}).get("value", "")
    supplier = _get_supplier(entities)

    suspicious_keywords = ["registered", "days ago", "po box only", "virtual office"]
    if any(kw in address.lower() for kw in suspicious_keywords):
        return {
            "flag": "suspicious_address",
            "severity": "medium",
            "confidence": 0.72,
            "detail": f"Supplier '{supplier}' address appears suspicious: '{address}'.",
            "evidence": {"supplier": supplier, "address": address},
        }
    return None


def check_date_anomaly(entities: dict) -> Optional[dict]:
    """Flag suspicious dates (future dates, very old, weekends)."""
    date_str = entities.get("invoice_date", {}).get("normalised")
    if not date_str or not isinstance(date_str, str):
        return None

    try:
        from datetime import datetime, date
        inv_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        today = date.today()

        if inv_date > today:
            return {
                "flag": "future_date",
                "severity": "high",
                "confidence": 0.90,
                "detail": f"Invoice date {date_str} is in the future.",
                "evidence": {"invoice_date": date_str, "today": str(today)},
            }

        days_old = (today - inv_date).days
        if days_old > 365:
            return {
                "flag": "stale_invoice",
                "severity": "medium",
                "confidence": 0.70,
                "detail": f"Invoice is {days_old} days old, which is unusually old.",
                "evidence": {"invoice_date": date_str, "days_old": days_old},
            }
    except (ValueError, TypeError):
        pass

    return None


def run_all_checks(entities: dict) -> list[dict]:
    """
    Run all fraud detection checks on parsed invoice entities.
    Returns a list of fraud flags (empty list = no issues found).
    """
    checks = [
        check_duplicate_invoice,
        check_amount_anomaly,
        check_new_supplier,
        check_supplier_address_mismatch,
        check_date_anomaly,
    ]

    flags = []
    for check_fn in checks:
        result = check_fn(entities)
        if result is not None:
            flags.append(result)

    return flags


def calculate_risk_score(flags: list[dict]) -> float:
    """
    Calculate overall risk score from individual flags.
    Uses weighted combination of flag confidences and severities.
    """
    if not flags:
        return 0.05  # baseline low risk

    severity_weights = {"critical": 1.0, "high": 0.7, "medium": 0.4, "low": 0.2}

    weighted_scores = []
    for flag in flags:
        severity = flag.get("severity", "medium")
        confidence = flag.get("confidence", 0.5)
        weight = severity_weights.get(severity, 0.4)
        weighted_scores.append(confidence * weight)

    # Combine: higher if more flags, capped at 0.99
    combined = 1.0 - 1.0
    for s in weighted_scores:
        combined = combined + s * (1.0 - combined) * 0.8

    # Boost for multiple flags
    if len(flags) >= 3:
        combined = min(0.99, combined + 0.1)
    elif len(flags) >= 2:
        combined = min(0.99, combined + 0.05)

    return round(max(0.05, min(0.99, combined)), 2)


def reset_seen_invoices():
    """Reset the duplicate detection state (useful between demo runs)."""
    global SEEN_INVOICE_IDS
    SEEN_INVOICE_IDS = {}
