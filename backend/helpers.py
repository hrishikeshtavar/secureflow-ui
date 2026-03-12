"""
SecureFlow AI — Shared Utilities
Hashing, timestamps, ID generation, and common helpers.
"""
import hashlib
import uuid
from datetime import datetime, timezone


def generate_scan_id(prefix="scan"):
    return f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"


def generate_event_id(prefix="sec"):
    return f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def risk_level_from_score(score: float) -> str:
    if score >= 0.8:
        return "critical"
    elif score >= 0.6:
        return "high"
    elif score >= 0.4:
        return "medium"
    return "low"


def risk_color(level: str) -> str:
    return {
        "critical": "#EA4335",
        "high": "#FA7B17",
        "medium": "#F9AB00",
        "low": "#34A853",
    }.get(level, "#5F6368")
