"""
SecureFlow AI — Graph-Based Entity Analysis (Person 2)
Models supplier-buyer relationships as a network graph.
Detects: circular billing, shell companies, suspicious clusters, anomalous new connections.
"""
import networkx as nx
import json
from typing import Optional
from utils.helpers import now_iso


def build_demo_graph() -> nx.DiGraph:
    """
    Build the pre-populated demo graph with legitimate entities and embedded fraud patterns.
    Returns a NetworkX directed graph.
    """
    G = nx.DiGraph()

    # ============================================================
    # LEGITIMATE ENTITIES (healthy network)
    # ============================================================

    # Buyers
    buyers = [
        {"id": "buyer_warwick_mfg", "name": "Warwick Manufacturing Ltd", "type": "buyer", "registered": "2018-03-15", "status": "established"},
        {"id": "buyer_midlands_eng", "name": "Midlands Engineering Co", "type": "buyer", "registered": "2015-07-22", "status": "established"},
        {"id": "buyer_coventry_tech", "name": "Coventry Tech Solutions", "type": "buyer", "registered": "2020-01-10", "status": "established"},
    ]

    # Legitimate suppliers
    suppliers = [
        {"id": "sup_techparts", "name": "TechParts UK Ltd", "type": "supplier", "registered": "2019-06-01", "status": "established", "avg_amount": 4250},
        {"id": "sup_office", "name": "Office Supplies Direct", "type": "supplier", "registered": "2017-09-15", "status": "established", "avg_amount": 1900},
        {"id": "sup_steel", "name": "Birmingham Steel Works", "type": "supplier", "registered": "2012-03-20", "status": "established", "avg_amount": 12500},
        {"id": "sup_logistics", "name": "Central Logistics Ltd", "type": "supplier", "registered": "2016-11-05", "status": "established", "avg_amount": 3200},
        {"id": "sup_cleaning", "name": "ProClean Services", "type": "supplier", "registered": "2021-04-18", "status": "established", "avg_amount": 850},
    ]

    # Add legitimate nodes
    for entity in buyers + suppliers:
        G.add_node(entity["id"], **entity)

    # Add legitimate edges (invoice relationships)
    legitimate_edges = [
        ("sup_techparts", "buyer_warwick_mfg", {"invoices": 12, "total_value": 51000, "last_invoice": "2026-02-28", "status": "normal"}),
        ("sup_office", "buyer_warwick_mfg", {"invoices": 8, "total_value": 15200, "last_invoice": "2026-03-05", "status": "normal"}),
        ("sup_steel", "buyer_warwick_mfg", {"invoices": 6, "total_value": 75000, "last_invoice": "2026-01-15", "status": "normal"}),
        ("sup_steel", "buyer_midlands_eng", {"invoices": 15, "total_value": 187500, "last_invoice": "2026-03-01", "status": "normal"}),
        ("sup_logistics", "buyer_midlands_eng", {"invoices": 10, "total_value": 32000, "last_invoice": "2026-02-20", "status": "normal"}),
        ("sup_logistics", "buyer_coventry_tech", {"invoices": 5, "total_value": 16000, "last_invoice": "2026-03-08", "status": "normal"}),
        ("sup_cleaning", "buyer_warwick_mfg", {"invoices": 4, "total_value": 3400, "last_invoice": "2026-02-10", "status": "normal"}),
        ("sup_cleaning", "buyer_coventry_tech", {"invoices": 3, "total_value": 2550, "last_invoice": "2026-01-28", "status": "normal"}),
        ("sup_office", "buyer_midlands_eng", {"invoices": 6, "total_value": 11400, "last_invoice": "2026-02-15", "status": "normal"}),
    ]

    for src, dst, attrs in legitimate_edges:
        G.add_edge(src, dst, **attrs)

    # ============================================================
    # FRAUD PATTERN 1: CIRCULAR BILLING
    # Three entities billing each other in a loop
    # ============================================================
    circular_entities = [
        {"id": "circ_alpha", "name": "Alpha Consulting Ltd", "type": "supplier", "registered": "2026-02-20", "status": "new", "avg_amount": 7500, "fraud_pattern": "circular_billing"},
        {"id": "circ_beta", "name": "Beta Services Group", "type": "supplier", "registered": "2026-02-22", "status": "new", "avg_amount": 8200, "fraud_pattern": "circular_billing"},
        {"id": "circ_gamma", "name": "Gamma Holdings Ltd", "type": "supplier", "registered": "2026-02-25", "status": "new", "avg_amount": 6800, "fraud_pattern": "circular_billing"},
    ]

    for entity in circular_entities:
        G.add_node(entity["id"], **entity)

    # The circular billing chain: Alpha → Beta → Gamma → Alpha
    G.add_edge("circ_alpha", "circ_beta", invoices=3, total_value=22500, last_invoice="2026-03-08", status="suspicious")
    G.add_edge("circ_beta", "circ_gamma", invoices=2, total_value=16400, last_invoice="2026-03-10", status="suspicious")
    G.add_edge("circ_gamma", "circ_alpha", invoices=2, total_value=13600, last_invoice="2026-03-11", status="suspicious")

    # Connect one to the legitimate network (how they enter the system)
    G.add_edge("circ_alpha", "buyer_warwick_mfg", invoices=1, total_value=7500, last_invoice="2026-03-06", status="suspicious")

    # ============================================================
    # FRAUD PATTERN 2: SHELL COMPANY CLUSTER
    # One hub connected to entities with no other connections
    # ============================================================
    shell_entities = [
        {"id": "shell_hub", "name": "Zenith Industrial Co", "type": "supplier", "registered": "2025-11-20", "status": "suspicious", "avg_amount": 5800, "fraud_pattern": "shell_company"},
        {"id": "shell_spoke1", "name": "ZN Procurement Ltd", "type": "supplier", "registered": "2026-01-05", "status": "new", "fraud_pattern": "shell_company"},
        {"id": "shell_spoke2", "name": "ZN Logistics Services", "type": "supplier", "registered": "2026-01-08", "status": "new", "fraud_pattern": "shell_company"},
        {"id": "shell_spoke3", "name": "ZN Technical Support", "type": "supplier", "registered": "2026-01-12", "status": "new", "fraud_pattern": "shell_company"},
    ]

    for entity in shell_entities:
        G.add_node(entity["id"], **entity)

    G.add_edge("shell_hub", "shell_spoke1", invoices=2, total_value=11600, last_invoice="2026-02-28", status="suspicious")
    G.add_edge("shell_hub", "shell_spoke2", invoices=1, total_value=5800, last_invoice="2026-03-02", status="suspicious")
    G.add_edge("shell_hub", "shell_spoke3", invoices=1, total_value=4900, last_invoice="2026-03-05", status="suspicious")
    G.add_edge("shell_spoke1", "shell_hub", invoices=1, total_value=9200, last_invoice="2026-03-07", status="suspicious")

    # Connect to legitimate network
    G.add_edge("shell_hub", "buyer_midlands_eng", invoices=3, total_value=17400, last_invoice="2026-03-10", status="suspicious")

    return G


# ============================================================
# GRAPH ANALYSIS FUNCTIONS
# ============================================================

def detect_cycles(G: nx.DiGraph) -> list[dict]:
    """Detect circular billing patterns (cycles in the graph)."""
    alerts = []
    try:
        cycles = list(nx.simple_cycles(G))
        for cycle in cycles:
            if len(cycle) >= 3:  # only meaningful cycles
                entity_names = [G.nodes[n].get("name", n) for n in cycle]
                alerts.append({
                    "type": "circular_billing",
                    "severity": "critical",
                    "confidence": 0.91,
                    "entities": entity_names,
                    "entity_ids": cycle,
                    "detail": f"Circular billing detected: {' → '.join(entity_names)} → {entity_names[0]}. Each entity invoices the next in a closed loop.",
                    "cycle_length": len(cycle),
                })
    except Exception:
        pass
    return alerts


def detect_shell_companies(G: nx.DiGraph) -> list[dict]:
    """Detect shell company patterns: hub nodes connected to isolated spokes."""
    alerts = []

    for node in G.nodes():
        node_data = G.nodes[node]
        if node_data.get("type") != "supplier":
            continue

        # Get neighbours
        successors = set(G.successors(node))
        predecessors = set(G.predecessors(node))
        all_neighbours = successors | predecessors

        if len(all_neighbours) < 3:
            continue

        # Check if neighbours are isolated (only connected to this hub)
        isolated_neighbours = 0
        for neighbour in all_neighbours:
            n_successors = set(G.successors(neighbour))
            n_predecessors = set(G.predecessors(neighbour))
            n_all = (n_successors | n_predecessors) - {node}

            if len(n_all) == 0:
                isolated_neighbours += 1

        if isolated_neighbours >= 2:
            entity_names = [G.nodes[n].get("name", n) for n in all_neighbours]
            alerts.append({
                "type": "shell_company_cluster",
                "severity": "high",
                "confidence": 0.85,
                "hub": G.nodes[node].get("name", node),
                "hub_id": node,
                "entities": entity_names,
                "entity_ids": list(all_neighbours),
                "isolated_count": isolated_neighbours,
                "detail": f"Potential shell company cluster: '{G.nodes[node].get('name', node)}' is connected to {isolated_neighbours} entities with no other business relationships.",
            })

    return alerts


def detect_anomalous_new_connection(G: nx.DiGraph, new_supplier: str, new_buyer: str) -> list[dict]:
    """
    When a new invoice is added, check if it creates a suspicious new connection.
    Flags: new entity bridging previously disconnected clusters.
    """
    alerts = []

    # Check if new supplier exists in graph
    is_new_node = new_supplier not in G.nodes()

    if is_new_node:
        # Get the buyer's existing community
        buyer_neighbours = set(G.predecessors(new_buyer)) if new_buyer in G.nodes() else set()

        alerts.append({
            "type": "new_entity",
            "severity": "medium",
            "confidence": 0.75,
            "entities": [new_supplier],
            "detail": f"New supplier '{new_supplier}' has no prior transaction history. First invoice submitted.",
        })
    else:
        # Existing supplier creating new connection to a buyer they've never invoiced
        if new_buyer in G.nodes() and not G.has_edge(new_supplier, new_buyer):
            # Check if this bridges two communities
            supplier_community = set(G.successors(new_supplier)) | set(G.predecessors(new_supplier))
            buyer_community = set(G.successors(new_buyer)) | set(G.predecessors(new_buyer))

            overlap = supplier_community & buyer_community
            if len(overlap) == 0:
                alerts.append({
                    "type": "community_bridge",
                    "severity": "high",
                    "confidence": 0.82,
                    "entities": [new_supplier, new_buyer],
                    "detail": f"Supplier '{new_supplier}' is creating a new connection to '{new_buyer}', bridging two previously disconnected business communities.",
                })

    return alerts


def get_node_metrics(G: nx.DiGraph, node_id: str) -> dict:
    """Get graph metrics for a specific node."""
    if node_id not in G.nodes():
        return {}

    undirected = G.to_undirected()

    return {
        "in_degree": G.in_degree(node_id),
        "out_degree": G.out_degree(node_id),
        "total_degree": undirected.degree(node_id),
        "clustering_coefficient": round(nx.clustering(undirected, node_id), 4),
    }


def analyse_graph(G: nx.DiGraph, new_supplier: str = None, new_buyer: str = None) -> list[dict]:
    """
    Run all graph analysis checks.
    Optionally includes checks for a new invoice being added.
    """
    all_alerts = []

    # Structural analysis
    all_alerts.extend(detect_cycles(G))
    all_alerts.extend(detect_shell_companies(G))

    # New connection analysis (if adding a new invoice)
    if new_supplier and new_buyer:
        all_alerts.extend(detect_anomalous_new_connection(G, new_supplier, new_buyer))

    return all_alerts


def add_invoice_to_graph(G: nx.DiGraph, supplier_name: str, buyer_name: str, invoice_data: dict) -> nx.DiGraph:
    """
    Add a new invoice relationship to the graph.
    Creates nodes if they don't exist, adds/updates edge.
    """
    # Create supplier ID from name
    sup_id = "sup_" + supplier_name.lower().replace(" ", "_")[:20]
    buy_id = "buy_" + buyer_name.lower().replace(" ", "_")[:20]

    # Add nodes if new
    if sup_id not in G.nodes():
        G.add_node(sup_id, name=supplier_name, type="supplier", registered=now_iso()[:10], status="new")
    if buy_id not in G.nodes():
        G.add_node(buy_id, name=buyer_name, type="buyer", registered="established", status="established")

    # Add or update edge
    if G.has_edge(sup_id, buy_id):
        edge = G.edges[sup_id, buy_id]
        edge["invoices"] = edge.get("invoices", 0) + 1
        amount = invoice_data.get("amount", 0)
        edge["total_value"] = edge.get("total_value", 0) + amount
        edge["last_invoice"] = now_iso()[:10]
    else:
        G.add_edge(sup_id, buy_id,
                    invoices=1,
                    total_value=invoice_data.get("amount", 0),
                    last_invoice=now_iso()[:10],
                    status="new")

    return G


def graph_to_vis_data(G: nx.DiGraph) -> dict:
    """
    Convert graph to a format suitable for frontend visualisation.
    Returns nodes and edges lists.
    """
    nodes = []
    for node_id, data in G.nodes(data=True):
        fraud_pattern = data.get("fraud_pattern", None)
        status = data.get("status", "established")

        # Color coding
        if fraud_pattern == "circular_billing":
            color = "#EA4335"  # red
        elif fraud_pattern == "shell_company":
            color = "#FA7B17"  # orange
        elif status == "new":
            color = "#F9AB00"  # yellow
        elif data.get("type") == "buyer":
            color = "#1A73E8"  # blue
        else:
            color = "#34A853"  # green

        nodes.append({
            "id": node_id,
            "label": data.get("name", node_id),
            "type": data.get("type", "unknown"),
            "color": color,
            "size": max(15, min(40, 10 + G.degree(node_id) * 5)),
            "status": status,
            "fraud_pattern": fraud_pattern,
        })

    edges = []
    for src, dst, data in G.edges(data=True):
        status = data.get("status", "normal")
        edges.append({
            "from": src,
            "to": dst,
            "label": f"£{data.get('total_value', 0):,.0f}",
            "invoices": data.get("invoices", 0),
            "color": "#EA4335" if status == "suspicious" else "#DADCE0",
            "width": 2 if status == "suspicious" else 1,
            "arrows": "to",
        })

    return {"nodes": nodes, "edges": edges}
