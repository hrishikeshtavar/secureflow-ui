"""
SecureFlow AI — Configuration
Loads settings from environment variables or .env file.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# GCP
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-project-id")
GCP_LOCATION = os.getenv("GCP_LOCATION", "eu")

# Document AI
DOCAI_PROCESSOR_ID = os.getenv("DOCAI_PROCESSOR_ID", "")

# Gemini
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-preview-04-17")

# Feature flags
DLP_ENABLED = os.getenv("DLP_ENABLED", "true").lower() == "true"
MODEL_ARMOR_ENABLED = os.getenv("MODEL_ARMOR_ENABLED", "false").lower() == "true"

# Firestore collections
COL_SCANS = os.getenv("FIRESTORE_COLLECTION_SCANS", "invoice_scans")
COL_SECURITY = os.getenv("FIRESTORE_COLLECTION_SECURITY", "security_events")
COL_AUDIT = os.getenv("FIRESTORE_COLLECTION_AUDIT", "audit_trail")
COL_GRAPH = os.getenv("FIRESTORE_COLLECTION_GRAPH", "graph_data")
