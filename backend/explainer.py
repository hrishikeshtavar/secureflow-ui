"""
SecureFlow AI — Explainability Engine (Person 1)
Uses Gemini to generate 3-layer explanations for fraud flags.
Falls back to template-based explanations if Gemini is unavailable.
"""
import json
from utils.config import GCP_PROJECT_ID, GCP_LOCATION, GEMINI_MODEL
from utils.helpers import risk_level_from_score


def generate_explanation_with_gemini(entities: dict, flags: list[dict], risk_score: float, graph_alerts: list[dict] = None) -> dict:
    """
    Call Gemini to generate a 3-layer explanation.
    """
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION)
        model = GenerativeModel(GEMINI_MODEL)

        # Build the prompt
        prompt = f"""You are SecureFlow AI's explainability engine. Your job is to generate clear, evidence-based explanations for invoice risk assessments.

Given the following parsed invoice data and fraud flags, generate a structured explanation in JSON format.

INVOICE DATA:
{json.dumps(entities, indent=2, default=str)}

FRAUD FLAGS DETECTED:
{json.dumps(flags, indent=2, default=str)}

GRAPH ALERTS:
{json.dumps(graph_alerts or [], indent=2, default=str)}

OVERALL RISK SCORE: {risk_score}
RISK LEVEL: {risk_level_from_score(risk_score)}

Generate a JSON response with exactly this structure:
{{
    "summary": "A 1-2 sentence plain-English summary of why this invoice was flagged. Be specific — mention actual values, supplier names, and what was detected. If no flags, say the invoice appears legitimate.",
    "evidence": [
        {{
            "flag": "the flag name",
            "description": "What was found, with specific numbers and names",
            "data_points": "The specific evidence (e.g., 'Invoice amount £48,500 vs historical average £4,250')",
            "confidence": 0.95
        }}
    ],
    "recommendation": "What the finance team should do: approve, review, reject, or escalate."
}}

IMPORTANT: Respond with ONLY the JSON object. No markdown, no backticks, no explanation outside the JSON."""

        response = model.generate_content(prompt)
        text = response.text.strip()

        # Clean potential markdown wrapping
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        return json.loads(text)

    except Exception as e:
        # Fall back to template-based explanation
        return generate_explanation_template(entities, flags, risk_score, graph_alerts)


def generate_explanation_template(entities: dict, flags: list[dict], risk_score: float, graph_alerts: list[dict] = None) -> dict:
    """
    Template-based fallback explanation when Gemini is unavailable.
    Still produces the 3-layer structure.
    """
    supplier = entities.get("supplier_name", {}).get("value", "Unknown supplier")
    invoice_id = entities.get("invoice_id", {}).get("value", "Unknown")
    amount_data = entities.get("total_amount", {})
    amount_str = amount_data.get("value", "Unknown amount")

    # Layer 1: Summary
    if not flags and not graph_alerts:
        summary = f"Invoice {invoice_id} from {supplier} for {amount_str} appears legitimate. No anomalies detected across all checks."
    else:
        flag_descriptions = []
        for f in flags:
            flag_descriptions.append(f["detail"])
        if graph_alerts:
            for g in graph_alerts:
                flag_descriptions.append(g.get("detail", "Graph anomaly detected"))

        summary = f"Invoice {invoice_id} from {supplier} for {amount_str} was flagged as {risk_level_from_score(risk_score)} risk. " + " ".join(flag_descriptions[:2])

    # Layer 2: Evidence
    evidence = []
    for f in flags:
        evidence.append({
            "flag": f["flag"],
            "description": f["detail"],
            "data_points": json.dumps(f.get("evidence", {})),
            "confidence": f["confidence"],
        })

    if graph_alerts:
        for g in graph_alerts:
            evidence.append({
                "flag": g.get("type", "graph_anomaly"),
                "description": g.get("detail", "Network anomaly detected in supplier-buyer graph"),
                "data_points": json.dumps(g.get("entities", [])),
                "confidence": g.get("confidence", 0.85),
            })

    # Layer 3: Recommendation
    level = risk_level_from_score(risk_score)
    recommendations = {
        "critical": "REJECT — This invoice shows critical risk indicators. Do not process. Escalate to fraud investigation team immediately.",
        "high": "ESCALATE — This invoice requires manual review by a senior team member before processing.",
        "medium": "REVIEW — Flag for manual verification. Check supplier details and cross-reference with procurement records.",
        "low": "APPROVE — This invoice appears legitimate. Standard processing can proceed.",
    }

    return {
        "summary": summary,
        "evidence": evidence,
        "recommendation": recommendations.get(level, recommendations["medium"]),
    }


def generate_explanation(entities: dict, flags: list[dict], risk_score: float, graph_alerts: list[dict] = None, use_gemini: bool = True) -> dict:
    """
    Main entry point for explanation generation.
    """
    if use_gemini:
        return generate_explanation_with_gemini(entities, flags, risk_score, graph_alerts)
    return generate_explanation_template(entities, flags, risk_score, graph_alerts)
