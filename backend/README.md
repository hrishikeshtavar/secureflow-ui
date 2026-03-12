# 🛡️ SecureFlow AI

**Fraud-Proof Invoices. Attack-Proof AI. Decisions Anyone Can Understand.**

Built for "The Secure Intelligence Frontier" Hackathon with Google Cloud — March 2026.

---

## Quick Start (Local Development)

```bash
# 1. Clone and enter the project
cd secureflow

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment config
cp .env.example .env
# Edit .env with your GCP project details (or leave defaults for mock mode)

# 5. Run the app
streamlit run app.py
```

The app starts at `http://localhost:8501`. Mock mode is enabled by default — no GCP needed to start developing.

---

## Project Structure

```
secureflow/
├── app.py                    # Streamlit dashboard (Person 3)
├── pipeline.py               # Main orchestration pipeline
├── fraud/
│   ├── parser.py             # Document AI invoice parser (Person 1)
│   ├── detector.py           # Fraud detection rules (Person 1)
│   └── explainer.py          # Gemini explainability engine (Person 1)
├── canary/
│   └── canary_layer.py       # Canary Layer security middleware (Person 2)
├── graph/
│   └── graph_engine.py       # Graph-based entity analysis (Person 2)
├── utils/
│   ├── config.py             # Environment configuration
│   └── helpers.py            # Shared utilities
├── .streamlit/
│   └── config.toml           # Streamlit theme config
├── requirements.txt
├── Dockerfile                # Cloud Run deployment
├── .env.example              # Environment template
└── README.md
```

---

## Who Owns What

| Person | Files | Responsibilities |
|--------|-------|-----------------|
| **Person 1** (ML) | `fraud/parser.py`, `fraud/detector.py`, `fraud/explainer.py` | Document AI, fraud rules, Gemini explainability |
| **Person 2** (ML) | `canary/canary_layer.py`, `graph/graph_engine.py` | Canary Layer, graph analysis |
| **Person 3** (Full-stack) | `app.py`, `pipeline.py` | Streamlit UI, pipeline orchestration |
| **Person 4** (Pitch) | Sample data, pitch deck | Demo invoices, graph dataset, presentation |

---

## Running with GCP (Production Mode)

1. **Enable APIs** in GCP Console:
   - Document AI API
   - Vertex AI API
   - Cloud DLP API

2. **Create Document AI Invoice Parser:**
   - Go to Document AI in GCP Console
   - Create processor → Invoice Parser
   - Copy the Processor ID to `.env`

3. **Authenticate:**
   ```bash
   gcloud auth application-default login
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Update `.env`:**
   ```
   GCP_PROJECT_ID=your-actual-project-id
   DOCAI_PROCESSOR_ID=your-processor-id
   ```

5. **Toggle off mock mode** in the app sidebar.

---

## Deploy to Cloud Run

```bash
# Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/secureflow

# Deploy
gcloud run deploy secureflow \
  --image gcr.io/YOUR_PROJECT_ID/secureflow \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars GCP_PROJECT_ID=YOUR_PROJECT_ID,DOCAI_PROCESSOR_ID=YOUR_PROCESSOR_ID
```

---

## Demo Flow (Saturday)

1. **Open the app.** Show the clean dashboard.
2. **Click "Legitimate Invoice"** → Green, low risk, explanation says "no anomalies."
3. **Click "Legitimate Invoice #2"** → Green again.
4. **Click "Fraudulent (Duplicate ID)"** → Red! Explanation shows which invoice it duplicates.
5. **Click "Fraudulent (Inflated Amount)"** → Red! Shows 11x deviation from average.
6. **Switch to Graph tab.** Show the network. Point to circular billing loop and shell company cluster.
7. **Click "Attack (Prompt Injection)"** → TWO alerts: fraud flag + Canary injection blocked!
8. **Switch to Security Events tab.** Show the logged security event.
9. **Switch to Audit Trail tab.** Show full traceability.

---

## Architecture

```
Invoice PDF
     │
     ▼
┌──────────────────┐
│  Document AI      │  ← Extracts 30+ fields
│  Invoice Parser   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CANARY LAYER     │  ← Scans for prompt injection
│  Input Scanner    │     BEFORE reaching LLM
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Fraud   │ │ Graph   │
│ Rules   │ │ Engine  │
└────┬───┘ └────┬───┘
     └────┬─────┘
          ▼
┌──────────────────┐
│  Gemini           │  ← Generates explanations
│  Explainability   │     (sanitised input only)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CANARY LAYER     │  ← Validates output
│  Output Validator │     (hallucination check)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Dashboard        │  ← Risk card + explanation
│  + Audit Trail    │     + graph + security log
└──────────────────┘
```
