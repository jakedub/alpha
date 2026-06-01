"""
Convention center pathfinding using NetworkX.

Architecture
------------
The graph has two kinds of nodes:
  room_<id>    — Room objects (spaces, entrance arrows, building_exits)
  vendor_<id>  — Vendor booth objects

And two kinds of edges:
  indoor   — Nodes in the same (location, floor) group, within INDOOR_THRESHOLD
             Gen Con units. Weight is approximate meters.
  outdoor  — Pairs of building_exit nodes from different locations that both
             have real_world_latitude/longitude. Weight is Haversine meters.

Coordinate systems
------------------
* Gen Con map coords (Room.longitude / Room.latitude, Vendor.map_x / Vendor.map_y)
  use Web Mercator geographic space (lon ±180, lat ±85).  One "unit" in this
  space corresponds to roughly GENCON_METERS_PER_UNIT real metres.
* Real-world coords (Room.real_world_latitude / Room.real_world_longitude) are
  WGS-84 decimal degrees used only for outdoor (cross-building) edges via Haversine.
"""

import math
import pickle
from pathlib import Path
from typing import Optional

import networkx as nx

# ── Tunable constants ──────────────────────────────────────────────────────────
# 1 Gen Con coordinate unit ≈ 2 metres (rough empirical estimate for ICC).
# Adjust if routing distances look wrong.
GENCON_METERS_PER_UNIT: float = 2.0

# Max Gen Con distance (in units) to auto-connect two nodes in the same
# (location, floor) group.  ~20 units ≈ 40 m — enough to bridge adjacent
# hall sections but not to skip entire wings.
INDOOR_THRESHOLD: float = 20.0

# Cache path for the serialised graph.
GRAPH_CACHE_PATH = Path(__file__).resolve().parent.parent / 'assets' / 'pathfinding_graph.pkl'


# ── Math helpers ───────────────────────────────────────────────────────────────

def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two WGS-84 points in metres."""
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def gencon_meters(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    """Approximate distance in metres between two Gen Con map coordinate pairs."""
    d = math.hypot(lng2 - lng1, lat2 - lat1)
    return d * GENCON_METERS_PER_UNIT


# ── Graph builder ──────────────────────────────────────────────────────────────

def build_graph() -> nx.Graph:
    """
    Build and return a weighted undirected NetworkX graph from the database.
    Requires an active Django ORM connection (call inside a Django context).
    """
    # Import here so the module is importable without Django set up
    from app.models.room import Room
    from app.models.vendor import Vendor

    G: nx.Graph = nx.Graph()

    # ── 1. Room nodes ──────────────────────────────────────────────────────────
    rooms = (
        Room.objects
        .select_related('location')
        .filter(longitude__isnull=False, latitude__isnull=False)
    )
    for room in rooms:
        G.add_node(
            f'room_{room.id}',
            node_type='room',
            room_type=room.room_type or '',
            location_id=room.location_id,
            location_name=room.location.name if room.location else None,
            floor=room.floor_level if room.floor_level is not None else 1,
            lng=room.longitude,
            lat=room.latitude,
            rw_lat=room.real_world_latitude,
            rw_lng=room.real_world_longitude,
            label=room.room_name,
        )

    # ── 2. Vendor nodes (all assumed ICC floor = map_floor or 1) ──────────────
    vendors = Vendor.objects.filter(map_x__isnull=False, map_y__isnull=False)
    # Resolve ICC location id once
    icc_location_id: Optional[int] = None
    try:
        from app.models.location import Location
        icc_location_id = Location.objects.values_list('id', flat=True).get(name='ICC')
    except Exception:
        pass

    for vendor in vendors:
        G.add_node(
            f'vendor_{vendor.id}',
            node_type='vendor',
            room_type='vendor',
            location_id=icc_location_id,
            location_name='ICC',
            floor=vendor.map_floor if vendor.map_floor is not None else 1,
            lng=vendor.map_x,
            lat=vendor.map_y,
            rw_lat=None,
            rw_lng=None,
            label=vendor.name,
        )

    # ── 3. Indoor edges: same (location_id, floor), within INDOOR_THRESHOLD ───
    from collections import defaultdict
    groups: dict = defaultdict(list)
    for node_id, data in G.nodes(data=True):
        key = (data['location_id'], data['floor'])
        groups[key].append((node_id, data))

    threshold_m = INDOOR_THRESHOLD * GENCON_METERS_PER_UNIT
    for nodes_in_group in groups.values():
        for i, (n1, d1) in enumerate(nodes_in_group):
            for n2, d2 in nodes_in_group[i + 1:]:
                dist = gencon_meters(d1['lng'], d1['lat'], d2['lng'], d2['lat'])
                if dist <= threshold_m:
                    G.add_edge(n1, n2, weight=dist, edge_type='indoor')

    # ── 4. Outdoor edges: building_exit pairs that both have rw coords ─────────
    # Cross-building pairs → 'outdoor' edge (Haversine, uncapped).
    # Same-building pairs  → 'exterior' edge (Haversine, capped at 300 m) so
    #   exits along the same facade connect directly instead of routing through
    #   the interior graph.  300 m is generous enough to span a full ICC face.
    EXTERIOR_MAX_M: float = 300.0

    exit_nodes = [
        (node_id, data)
        for node_id, data in G.nodes(data=True)
        if data.get('room_type') == 'building_exit'
        and data.get('rw_lat') is not None
        and data.get('rw_lng') is not None
    ]
    for i, (n1, d1) in enumerate(exit_nodes):
        for n2, d2 in exit_nodes[i + 1:]:
            dist = haversine_meters(d1['rw_lat'], d1['rw_lng'], d2['rw_lat'], d2['rw_lng'])
            if d1['location_id'] == d2['location_id']:
                if dist <= EXTERIOR_MAX_M:
                    G.add_edge(n1, n2, weight=dist, edge_type='exterior')
            else:
                G.add_edge(n1, n2, weight=dist, edge_type='outdoor')

    return G


# ── Path finder ────────────────────────────────────────────────────────────────

def find_path(
    G: nx.Graph,
    from_node: str,
    to_node: str,
) -> tuple[Optional[list[str]], Optional[float]]:
    """
    Return (path, total_metres) or (None, None) if no path exists.
    `from_node` and `to_node` are graph node IDs, e.g. 'room_42' or 'vendor_7'.
    """
    try:
        path = nx.shortest_path(G, from_node, to_node, weight='weight')
        length = nx.shortest_path_length(G, from_node, to_node, weight='weight')
        return path, length
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None, None


def path_to_segments(G: nx.Graph, path: list[str]) -> list[dict]:
    """
    Convert a raw node-ID path into a list of human-readable segment dicts:
      { from_label, to_label, from_lng, from_lat, to_lng, to_lat, edge_type, metres }
    Gen Con map coords (lng/lat) are included so the frontend can draw a
    coloured polyline without additional API calls.
    """
    segments = []
    for a, b in zip(path, path[1:]):
        edge = G.edges[a, b]
        na = G.nodes[a]
        nb = G.nodes[b]
        segments.append({
            'from_label': na.get('label', a),
            'to_label':   nb.get('label', b),
            'from_lng':   na.get('lng'),
            'from_lat':   na.get('lat'),
            'to_lng':     nb.get('lng'),
            'to_lat':     nb.get('lat'),
            'edge_type':  edge.get('edge_type', 'unknown'),
            'metres':     round(edge['weight'], 1),
        })
    return segments


# ── Cache helpers ──────────────────────────────────────────────────────────────

def save_graph(G: nx.Graph, path: Path = GRAPH_CACHE_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'wb') as f:
        pickle.dump(G, f)


def load_graph(path: Path = GRAPH_CACHE_PATH) -> Optional[nx.Graph]:
    if not path.exists():
        return None
    with open(path, 'rb') as f:
        return pickle.load(f)
