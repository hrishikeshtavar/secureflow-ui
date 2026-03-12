"""
SecureFlow AI — Streamlit Dashboard (Person 3)
The main user interface for the hackathon demo.
"""
import streamlit as st
import json
import time
from datetime import datetime

# Must be first Streamlit command
st.set_page_config(
    page_title="SecureFlow AI",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Import pipeline
import sys
sys.path.insert(0, ".")
from pipeline import process_invoice, get_graph, reset_graph
from graph.graph_engine import graph_to_vis_data, analyse_graph, build_demo_graph
from fraud.detector import reset_seen_invoices
from utils.helpers import risk_color, risk_level_from_score

# ============================================================
# SESSION STATE
# ============================================================
if "scan_results" not in st.session_state:
    st.session_state.scan_results = []
if "security_events" not in st.session_state:
    st.session_state.security_events = []
if "audit_trail" not in st.session_state:
    st.session_state.audit_trail = []


# ============================================================
# CUSTOM CSS
# ============================================================
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1A73E8;
        margin-bottom: 0;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #5F6368;
        margin-top: -10px;
        margin-bottom: 30px;
    }
    .risk-card {
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #DADCE0;
        margin-bottom: 16px;
    }
    .risk-critical { border-left: 6px solid #EA4335; background: #FDE7E7; }
    .risk-high { border-left: 6px solid #FA7B17; background: #FEF7E0; }
    .risk-medium { border-left: 6px solid #F9AB00; background: #FFFDE7; }
    .risk-low { border-left: 6px solid #34A853; background: #E6F4EA; }
    .security-alert {
        padding: 16px;
        border-radius: 8px;
        border-left: 6px solid #EA4335;
        background: #FDE7E7;
        margin-bottom: 12px;
    }
    .canary-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-safe { background: #E6F4EA; color: #137333; }
    .badge-blocked { background: #FDE7E7; color: #C5221F; }
    .evidence-card {
        padding: 12px 16px;
        border-radius: 8px;
        background: #F8F9FA;
        border: 1px solid #E8EAED;
        margin-bottom: 8px;
    }
    .metric-box {
        text-align: center;
        padding: 16px;
        border-radius: 10px;
        background: #F8F9FA;
    }
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] {
        padding: 10px 24px;
        border-radius: 8px 8px 0 0;
    }
</style>
""", unsafe_allow_html=True)


# ============================================================
# HEADER
# ============================================================
col_logo, col_title = st.columns([1, 11])
with col_logo:
    st.markdown("# 🛡️")
with col_title:
    st.markdown('<p class="main-header">SecureFlow AI</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Fraud-Proof Invoices. Attack-Proof AI. Decisions Anyone Can Understand.</p>', unsafe_allow_html=True)


# ============================================================
# SIDEBAR
# ============================================================
with st.sidebar:
    st.markdown("### ⚙️ Settings")
    use_mock = st.toggle("Use mock data (no GCP needed)", value=True, help="Toggle off when GCP is configured")
    use_gemini = st.toggle("Use Gemini for explanations", value=False, help="Requires Vertex AI setup")
    use_gemini_classifier = st.toggle("Use Gemini injection classifier", value=False, help="Second-line Canary defence")

    st.markdown("---")
    st.markdown("### 📊 Session Stats")
    total_scans = len(st.session_state.scan_results)
    total_alerts = len(st.session_state.security_events)
    high_risk = sum(1 for r in st.session_state.scan_results if r.get("risk_level") in ("critical", "high"))

    st.metric("Total Scans", total_scans)
    st.metric("Security Alerts", total_alerts, delta=None)
    st.metric("High/Critical Risk", high_risk, delta=None)

    st.markdown("---")
    if st.button("🔄 Reset Demo", use_container_width=True):
        st.session_state.scan_results = []
        st.session_state.security_events = []
        st.session_state.audit_trail = []
        reset_seen_invoices()
        reset_graph()
        st.rerun()


# ============================================================
# MAIN TABS
# ============================================================
tab_scan, tab_results, tab_graph, tab_security, tab_audit = st.tabs([
    "📤 Scan Invoice", "📋 Results", "🕸️ Network Graph", "🔒 Security Events", "📝 Audit Trail"
])


# ============================================================
# TAB 1: SCAN INVOICE
# ============================================================
with tab_scan:
    st.markdown("### Upload an Invoice for Analysis")
    st.markdown("Upload a PDF invoice and SecureFlow will parse it, detect fraud, check for AI attacks, and explain every decision.")

    col_upload, col_demo = st.columns([2, 1])

    with col_upload:
        uploaded_file = st.file_uploader(
            "Drop an invoice PDF here",
            type=["pdf", "png", "jpg", "jpeg"],
            help="Supports PDF and image formats"
        )

    with col_demo:
        st.markdown("#### 🎯 Quick Demo Files")
        st.caption("Click to simulate different invoice types:")
        demo_files = {
            "✅ Legitimate Invoice": "legitimate_1.pdf",
            "✅ Legitimate Invoice #2": "legitimate_2.pdf",
            "🔴 Fraudulent (Duplicate ID)": "fraudulent_duplicate.pdf",
            "🔴 Fraudulent (Inflated Amount)": "fraudulent_inflated.pdf",
            "💀 Attack (Prompt Injection)": "attack_injection.pdf",
        }
        demo_selected = None
        for label, fname in demo_files.items():
            if st.button(label, key=fname, use_container_width=True):
                demo_selected = fname

    # Process
    process_file = None
    process_name = None

    if uploaded_file is not None:
        process_file = uploaded_file.getvalue()
        process_name = uploaded_file.name
    elif demo_selected:
        process_file = b"demo"
        process_name = demo_selected

    if process_file is not None:
        with st.spinner("🔍 SecureFlow AI analysing invoice..."):
            # Progress bar for visual effect
            progress = st.progress(0, text="Parsing invoice with Document AI...")
            time.sleep(0.3)
            progress.progress(20, text="Canary Layer: scanning for prompt injection...")
            time.sleep(0.3)
            progress.progress(40, text="Running fraud detection rules...")
            time.sleep(0.3)
            progress.progress(60, text="Analysing supplier network graph...")
            time.sleep(0.3)
            progress.progress(80, text="Generating explainable risk assessment...")
            time.sleep(0.3)

            result = process_invoice(
                file_bytes=process_file,
                filename=process_name,
                use_mock=use_mock,
                use_gemini=use_gemini,
                use_gemini_classifier=use_gemini_classifier,
            )

            progress.progress(100, text="✅ Analysis complete!")
            time.sleep(0.3)
            progress.empty()

        # Store results
        st.session_state.scan_results.append(result)
        st.session_state.security_events.extend(result.get("security_events", []))
        st.session_state.audit_trail.append(result.get("audit", {}))

        # Display result immediately
        st.markdown("---")
        risk_level = result.get("risk_level", "low")
        risk_score = result.get("risk_score", 0)
        invoice = result.get("invoice", {})

        # Risk banner
        risk_css = f"risk-{risk_level}"
        risk_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(risk_level, "⚪")

        st.markdown(f"""
        <div class="risk-card {risk_css}">
            <h2>{risk_emoji} Risk Level: {risk_level.upper()} — Score: {risk_score:.0%}</h2>
            <p><strong>Invoice:</strong> {invoice.get('invoice_id', 'N/A')} | <strong>Supplier:</strong> {invoice.get('supplier_name', 'N/A')} | <strong>Amount:</strong> £{invoice.get('total_amount', 0):,.2f} | <strong>Date:</strong> {invoice.get('date', 'N/A')}</p>
        </div>
        """, unsafe_allow_html=True)

        # Canary Layer status
        canary = result.get("canary_input", {})
        if canary.get("injection_detected"):
            st.markdown(f"""
            <div class="security-alert">
                <h3>🚨 CANARY LAYER ALERT: Prompt Injection Detected & Blocked</h3>
                <p>Hidden instructions were found in this invoice attempting to manipulate the AI risk assessment. The attack was <strong>blocked</strong> before reaching the analysis engine.</p>
                <span class="canary-badge badge-blocked">⛔ INJECTION BLOCKED</span>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f'<span class="canary-badge badge-safe">✅ Canary: Input Safe</span>', unsafe_allow_html=True)

        # Explainability panel
        explanation = result.get("explanation", {})
        if explanation:
            st.markdown("### 📖 Explainable AI — Why This Decision Was Made")

            # Layer 1: Summary
            st.markdown(f"**Summary:** {explanation.get('summary', 'No summary available.')}")

            # Layer 2: Evidence
            evidence_list = explanation.get("evidence", [])
            if evidence_list:
                st.markdown("**Evidence:**")
                for ev in evidence_list:
                    confidence = ev.get("confidence", 0)
                    conf_color = "#EA4335" if confidence > 0.85 else "#F9AB00" if confidence > 0.7 else "#34A853"
                    st.markdown(f"""
                    <div class="evidence-card">
                        <strong>{ev.get('flag', 'Unknown')}</strong>
                        <span style="float: right; color: {conf_color}; font-weight: 600;">{confidence:.0%} confidence</span>
                        <br/>{ev.get('description', '')}
                        <br/><small style="color: #5F6368;">Data: {ev.get('data_points', '')}</small>
                    </div>
                    """, unsafe_allow_html=True)

            # Layer 3: Recommendation
            st.markdown(f"**Recommendation:** {explanation.get('recommendation', 'Review required.')}")

        # Graph alerts
        graph_alerts = result.get("graph_alerts", [])
        if graph_alerts:
            st.markdown("### 🕸️ Network Graph Alerts")
            for alert in graph_alerts:
                st.warning(f"**{alert.get('type', 'Graph anomaly').replace('_', ' ').title()}:** {alert.get('detail', '')}")

        # Anomaly Detection (Isolation Forest)
        anomaly = result.get("anomaly_detection", {})
        if anomaly.get("is_anomaly"):
            st.markdown("### 🔬 ML Anomaly Detection (Isolation Forest)")
            st.markdown(f"**Anomaly Score:** {anomaly.get('anomaly_score', 0):.0%} — Method: {anomaly.get('method', 'N/A')}")
            contribs = anomaly.get("feature_contributions", [])
            if contribs:
                st.markdown("**Feature anomalies detected:**")
                for c in contribs:
                    st.markdown(f"""
                    <div class="evidence-card">
                        <strong>{c.get('feature', '').replace('_', ' ').title()}</strong>
                        <span style="float: right; color: #EA4335; font-weight: 600;">z-score: {c.get('z_score', 0):.1f}</span>
                        <br/>{c.get('description', '')}
                    </div>
                    """, unsafe_allow_html=True)
        elif anomaly.get("anomaly_score", 0) > 0:
            st.markdown(f"🔬 **ML Anomaly Score:** {anomaly.get('anomaly_score', 0):.0%} (within normal range)")


# ============================================================
# TAB 2: ALL RESULTS
# ============================================================
with tab_results:
    st.markdown("### All Scanned Invoices")

    if not st.session_state.scan_results:
        st.info("No invoices scanned yet. Upload an invoice in the Scan tab.")
    else:
        for i, result in enumerate(reversed(st.session_state.scan_results)):
            risk_level = result.get("risk_level", "low")
            risk_score = result.get("risk_score", 0)
            invoice = result.get("invoice", {})
            risk_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(risk_level, "⚪")
            canary_status = "⛔ INJECTION" if result.get("canary_input", {}).get("injection_detected") else "✅ Safe"

            with st.expander(
                f"{risk_emoji} {invoice.get('invoice_id', 'N/A')} — {invoice.get('supplier_name', 'Unknown')} — £{invoice.get('total_amount', 0):,.2f} — {risk_level.upper()} ({risk_score:.0%}) — Canary: {canary_status}",
                expanded=(i == 0),
            ):
                col1, col2, col3, col4 = st.columns(4)
                col1.metric("Risk Score", f"{risk_score:.0%}")
                col2.metric("Fraud Flags", len(result.get("fraud_flags", [])))
                col3.metric("Graph Alerts", len(result.get("graph_alerts", [])))
                col4.metric("Security Events", len(result.get("security_events", [])))

                explanation = result.get("explanation", {})
                if explanation:
                    st.markdown(f"**Summary:** {explanation.get('summary', '')}")
                    st.markdown(f"**Recommendation:** {explanation.get('recommendation', '')}")

                if result.get("fraud_flags"):
                    st.markdown("**Fraud Flags:**")
                    for flag in result["fraud_flags"]:
                        st.markdown(f"- **{flag['flag']}** ({flag['confidence']:.0%}): {flag['detail']}")


# ============================================================
# TAB 3: NETWORK GRAPH
# ============================================================
with tab_graph:
    st.markdown("### 🕸️ Supplier-Buyer Relationship Graph")
    st.markdown("Nodes represent suppliers (green) and buyers (blue). Red nodes indicate fraud patterns. Red edges are suspicious relationships.")

    from pyvis.network import Network
    import tempfile
    import os
    import streamlit.components.v1 as components

    G = get_graph()

    if G.number_of_nodes() > 0:
        net = Network(
            height="550px",
            width="100%",
            directed=True,
            bgcolor="#FAFAFA",
            font_color="#202124"
        )

        for node_id, data in G.nodes(data=True):
            fraud_pattern = data.get("fraud_pattern")
            status = data.get("status", "established")
            node_type = data.get("type", "supplier")

            if fraud_pattern == "circular_billing":
                color = "#EA4335"
            elif fraud_pattern == "shell_company":
                color = "#FA7B17"
            elif status == "new":
                color = "#F9AB00"
            elif node_type == "buyer":
                color = "#1A73E8"
            else:
                color = "#34A853"

            shape = "diamond" if node_type == "buyer" else "dot"

            net.add_node(
                node_id,
                label=data.get("name", node_id),
                color=color,
                shape=shape,
                size=max(15, min(40, 10 + G.degree(node_id) * 5)),
                title=f"{node_type} | Status: {status}" + (f" | ⚠️ {fraud_pattern}" if fraud_pattern else "")
            )

        for src, dst, data in G.edges(data=True):
            status = data.get("status", "normal")

            total_value = data.get("total_value", 0)
            try:
                edge_label = f"£{float(total_value):,.0f}"
            except Exception:
                edge_label = str(total_value)

            net.add_edge(
                src,
                dst,
                label=edge_label,
                color="#EA4335" if status == "suspicious" else "#DADCE0",
                width=2 if status == "suspicious" else 1,
                arrows="to",
                font={
                    "size": 18,
                    "align": "middle",
                    "background": "#FFFFFF",
                    "strokeWidth": 0
                }
            )

        net.set_options("""
        {
        "physics": {
            "enabled": true,
            "barnesHut": {
            "gravitationalConstant": -5000,
            "centralGravity": 0.15,
            "springLength": 220,
            "springConstant": 0.03,
            "damping": 0.18,
            "avoidOverlap": 1
            },
            "minVelocity": 0.75
        },
        "layout": {
            "improvedLayout": true
        },
        "interaction": {
            "hover": true,
            "tooltipDelay": 100,
            "navigationButtons": true
        },
        "edges": {
            "smooth": {
            "type": "dynamic"
            }
        }
        }
        """)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".html") as tmp_file:
            net.write_html(tmp_file.name, notebook=False, open_browser=False)
            html_path = tmp_file.name

        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()

        components.html(html, height=580, scrolling=False)
        os.unlink(html_path)

        # Legend
        col1, col2, col3, col4, col5 = st.columns(5)
        col1.markdown("🟢 **Legitimate Supplier**")
        col2.markdown("🔵 **Buyer**")
        col3.markdown("🔴 **Circular Billing**")
        col4.markdown("🟠 **Shell Company**")
        col5.markdown("🟡 **New Entity**")

        # Graph stats
        st.markdown("---")
        st.markdown("### Graph Analysis")
        alerts = analyse_graph(G)
        if alerts:
            for alert in alerts:
                severity_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡"}.get(alert.get("severity"), "⚪")
                st.markdown(
                    f"{severity_emoji} **{alert['type'].replace('_', ' ').title()}** "
                    f"({alert.get('confidence', 0):.0%} confidence): {alert['detail']}"
                )
        else:
            st.success("No structural anomalies detected in the current graph.")

        col_a, col_b, col_c = st.columns(3)
        col_a.metric("Total Entities", G.number_of_nodes())
        col_b.metric("Total Relationships", G.number_of_edges())
        col_c.metric("Fraud Patterns Found", len(alerts))
    else:
        st.info("Graph will populate as invoices are scanned.")


# ============================================================
# TAB 4: SECURITY EVENTS
# ============================================================
with tab_security:
    st.markdown("### 🔒 Canary Layer — Security Events")
    st.markdown("Every AI interaction is monitored. Prompt injections, PII leaks, hallucinations, and output anomalies are caught and logged here.")

    if not st.session_state.security_events:
        st.success("✅ No security events. All AI interactions are clean.")
    else:
        for event in reversed(st.session_state.security_events):
            severity = event.get("severity", "medium")
            severity_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(severity, "⚪")

            st.markdown(f"""
            <div class="security-alert">
                <strong>{severity_emoji} {event.get('event_type', 'Unknown').replace('_', ' ').upper()}</strong>
                <span style="float: right; font-size: 0.85rem; color: #5F6368;">{event.get('timestamp', '')}</span>
                <br/>{event.get('detail', '')}
                <br/><small><strong>Action:</strong> {event.get('action_taken', 'N/A').upper()} | <strong>Scan ID:</strong> {event.get('scan_id', 'N/A')}</small>
            </div>
            """, unsafe_allow_html=True)


# ============================================================
# TAB 5: AUDIT TRAIL
# ============================================================
with tab_audit:
    st.markdown("### 📝 Immutable Audit Trail")
    st.markdown("Every AI decision is logged with full traceability. No raw content stored — metadata only.")

    if not st.session_state.audit_trail:
        st.info("No audit entries yet. Scan an invoice to generate audit records.")
    else:
        for entry in reversed(st.session_state.audit_trail):
            if not entry:
                continue
            canary_in = "✅ Safe" if entry.get("canary_input_safe") else "⛔ Injection Detected"
            canary_out = "✅ Valid" if entry.get("canary_output_valid") else "⚠️ Issues Found"

            with st.expander(f"🔗 {entry.get('audit_id', 'N/A')} — Score: {entry.get('final_risk_score', 0):.0%} — {entry.get('timestamp', '')}"):
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**Scan ID:** `{entry.get('scan_id', '')}`")
                    st.markdown(f"**Input Hash:** `{entry.get('input_hash', '')[:16]}...`")
                    st.markdown(f"**Model:** `{entry.get('model_version', '')}`")
                with col2:
                    st.markdown(f"**Canary Input:** {canary_in}")
                    st.markdown(f"**Canary Output:** {canary_out}")
                    st.markdown(f"**Final Risk Score:** {entry.get('final_risk_score', 0):.0%}")

                st.markdown("**Checks Performed:**")
                for check in entry.get("checks_performed", []):
                    st.markdown(f"- ✅ {check.replace('_', ' ').title()}")


# ============================================================
# FOOTER
# ============================================================
st.markdown("---")
st.markdown(
    '<div style="text-align: center; color: #5F6368; font-size: 0.85rem;">'
    'SecureFlow AI — Built for "The Secure Intelligence Frontier" Hackathon with Google Cloud<br/>'
    'WMG Venture Studio • NatWest Accelerator • Warwick Business School • March 2026'
    '</div>',
    unsafe_allow_html=True,
)
