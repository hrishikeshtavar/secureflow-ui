"""
SecureFlow AI — Main Pipeline
Orchestrates the full flow: Parse → Canary Input → Analyse → Anomaly Detection → Graph → Explain → Canary Output → Audit

Updated with mentor feedback:
- Isolation Forest unsupervised anomaly detection (Step 3b)
- Pattern of anomalies = fraud signal (combined scoring)
- Feature contribution analysis feeds into explainability
"""
from utils.helpers import generate_scan_id, now_iso, hash_bytes, hash_content, risk_level_from_score
from fraud.parser import parse_invoice
from fraud.detector import run_all_checks, calculate_risk_score, HISTORICAL_DATA
from fraud.anomaly_detector import score_invoice_anomaly
from fraud.explainer import generate_explanation
from canary.canary_layer import scan_input, validate_output, generate_security_events, create_audit_entry
from graph.graph_engine import build_demo_graph, analyse_graph, add_invoice_to_graph


# Global graph instance (persists across requests in the same session)
GRAPH = None


def get_graph():
    global GRAPH
    if GRAPH is None:
        GRAPH = build_demo_graph()
    return GRAPH


def reset_graph():
    global GRAPH
    GRAPH = None


def process_invoice(
    file_bytes: bytes,
    filename: str,
    mime_type: str = "application/pdf",
    use_mock: bool = False,
    use_gemini: bool = True,
    use_gemini_classifier: bool = False,
) -> dict:
    """
    Full SecureFlow AI pipeline.

    Returns a complete result dict with all layers:
    - parsed data
    - fraud flags
    - risk score
    - explanation (3 layers)
    - canary events
    - graph alerts
    - security events
    - audit trail
    """
    scan_id = generate_scan_id()
    input_hash = hash_bytes(file_bytes) if file_bytes else hash_content(filename)

    # ============================================================
    # STEP 1: Parse the invoice (Document AI or mock)
    # ============================================================
    parsed = parse_invoice(file_bytes, filename, mime_type, use_mock=use_mock)

    if not parsed["success"]:
        return {
            "scan_id": scan_id,
            "timestamp": now_iso(),
            "status": "error",
            "error": parsed.get("error", "Parsing failed"),
            "parsed": parsed,
        }

    entities = parsed["entities"]
    raw_text = parsed.get("raw_text", "")

    # ============================================================
    # STEP 2: CANARY LAYER — Input Scanning
    # ============================================================
    # Scan ALL extracted text for prompt injection before it reaches Gemini
    all_text_content = raw_text
    # Also scan specific fields that are high-risk for injection
    description = entities.get("description", {}).get("value", "")
    notes = entities.get("notes", {}).get("value", "")
    all_text_content += " " + description + " " + notes

    canary_input = scan_input(all_text_content, use_gemini_classifier=use_gemini_classifier)

    # ============================================================
    # STEP 3a: Rule-Based Fraud Detection (individual invoice)
    # ============================================================
    fraud_flags = run_all_checks(entities)
    rule_risk_score = calculate_risk_score(fraud_flags)

    # ============================================================
    # STEP 3b: Isolation Forest Anomaly Detection (unsupervised)
    # Mentor: "Unsupervised - clustering recommended"
    # Mentor: "For imbalance → Isolation Forest for supervised"
    # ============================================================
    anomaly_result = score_invoice_anomaly(entities, HISTORICAL_DATA)

    # Add anomaly findings as fraud flags if significant
    if anomaly_result.get("is_anomaly"):
        for contrib in anomaly_result.get("feature_contributions", []):
            fraud_flags.append({
                "flag": f"anomaly_{contrib['feature']}",
                "severity": "high" if abs(contrib.get("z_score", 0)) > 3 else "medium",
                "confidence": min(0.95, 0.6 + abs(contrib.get("z_score", 0)) * 0.1),
                "detail": contrib["description"],
                "evidence": {
                    "feature": contrib["feature"],
                    "value": contrib["value"],
                    "z_score": contrib["z_score"],
                    "method": "isolation_forest",
                },
            })

    # ============================================================
    # STEP 3c: Combined Risk Score
    # Mentor: "Pattern of anomalies = fraud"
    # Single anomaly = medium. Multiple anomalies = high. Anomalies + graph = fraud.
    # ============================================================
    anomaly_score = anomaly_result.get("anomaly_score", 0)
    # Blend rule-based and ML-based scores (rules get more weight as they're more specific)
    risk_score = min(0.99, rule_risk_score * 0.6 + anomaly_score * 0.4)
    # If BOTH rule-based AND isolation forest flag it, boost significantly
    if rule_risk_score > 0.3 and anomaly_score > 0.3:
        risk_score = min(0.99, risk_score + 0.15)  # Pattern boost

    # ============================================================
    # STEP 4: Graph Analysis
    # ============================================================
    G = get_graph()
    supplier_name = entities.get("supplier_name", {}).get("value", "Unknown")
    buyer_name = entities.get("receiver_name", {}).get("value", "Warwick Manufacturing Ltd")

    # Analyse before adding (to detect new connections)
    graph_alerts = analyse_graph(G, new_supplier=supplier_name, new_buyer=buyer_name)

    # Add to graph
    amount = 0
    total = entities.get("total_amount", {})
    if total.get("normalised") and isinstance(total["normalised"], dict):
        amount = total["normalised"].get("amount", 0)

    G = add_invoice_to_graph(G, supplier_name, buyer_name, {"amount": amount})

    # Boost risk score if graph alerts found
    if graph_alerts:
        graph_boost = max(a.get("confidence", 0.5) * 0.3 for a in graph_alerts)
        risk_score = min(0.99, risk_score + graph_boost)

    # ============================================================
    # STEP 5: Generate Explanation (3 layers)
    # ============================================================
    explanation = generate_explanation(
        entities, fraud_flags, risk_score,
        graph_alerts=graph_alerts,
        use_gemini=use_gemini,
    )

    # ============================================================
    # STEP 6: CANARY LAYER — Output Validation
    # ============================================================
    canary_output = validate_output(explanation, entities, fraud_flags, risk_score)

    # ============================================================
    # STEP 7: Generate Security Events
    # ============================================================
    security_events = generate_security_events(scan_id, canary_input, canary_output)

    # If Canary flagged injection, boost risk score
    if canary_input.get("injection_detected"):
        risk_score = min(0.99, risk_score + 0.3)
        # Add injection info to explanation
        if isinstance(explanation, dict):
            injection_evidence = {
                "flag": "prompt_injection_detected",
                "description": "Hidden instructions were detected in the invoice content, attempting to manipulate the AI risk assessment. The Canary Layer blocked this attack.",
                "data_points": "Injection payload found in document text fields",
                "confidence": 0.95,
            }
            if "evidence" in explanation:
                explanation["evidence"].append(injection_evidence)

    # ============================================================
    # STEP 8: Audit Trail
    # ============================================================
    audit = create_audit_entry(
        scan_id=scan_id,
        input_hash=input_hash,
        canary_input_result=canary_input,
        canary_output_result=canary_output,
        risk_score=risk_score,
    )

    # ============================================================
    # COMPILE FINAL RESULT
    # ============================================================
    risk_level = risk_level_from_score(risk_score)

    return {
        "scan_id": scan_id,
        "timestamp": now_iso(),
        "status": "complete",
        "filename": filename,

        # Invoice data (metadata only — no raw content stored)
        "invoice": {
            "supplier_name": supplier_name,
            "invoice_id": entities.get("invoice_id", {}).get("value", ""),
            "total_amount": amount,
            "currency": total.get("normalised", {}).get("currency", "GBP") if isinstance(total.get("normalised"), dict) else "GBP",
            "date": entities.get("invoice_date", {}).get("normalised", ""),
            "receiver": buyer_name,
        },

        # Risk assessment
        "risk_score": risk_score,
        "risk_level": risk_level,
        "fraud_flags": fraud_flags,

        # Explainability (3 layers)
        "explanation": explanation,

        # Graph analysis
        "graph_alerts": graph_alerts,

        # Anomaly detection (Isolation Forest)
        "anomaly_detection": {
            "anomaly_score": anomaly_result.get("anomaly_score", 0),
            "is_anomaly": anomaly_result.get("is_anomaly", False),
            "method": anomaly_result.get("method", "unknown"),
            "feature_contributions": anomaly_result.get("feature_contributions", []),
        },

        # Security
        "canary_input": {
            "is_safe": canary_input["is_safe"],
            "injection_detected": canary_input["injection_detected"],
            "pii_detected": canary_input["pii_detected"],
            "findings_count": len(canary_input["findings"]),
            "findings": canary_input["findings"],
        },
        "canary_output": {
            "is_valid": canary_output["is_valid"],
            "issues": canary_output["issues"],
        },
        "security_events": security_events,

        # Audit
        "audit": audit,
    }
