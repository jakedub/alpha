"""
Pathfinding API endpoint.

GET /api/pathfind/?from=room_12&to=vendor_5
GET /api/pathfind/?from=room_12&to=room_88&rebuild=1

Query params:
    from    (required)  Node ID — "room_<pk>" or "vendor_<pk>"
    to      (required)  Node ID — "room_<pk>" or "vendor_<pk>"
    rebuild (optional)  Pass rebuild=1 to force a graph rebuild instead of
                        loading the cached pickle. Useful after running
                        load_building_exits or importing new geo_elements data.

Response (200):
    {
        "from_node":    "room_12",
        "to_node":      "vendor_5",
        "total_metres": 412.3,
        "path":         ["room_12", "room_34", ..., "vendor_5"],
        "segments": [
            {
                "from_label": "Hall A — Table 10",
                "to_label":   "ICC Exhibit Hall A Entrance",
                "edge_type":  "indoor",
                "metres":     38.4
            },
            ...
        ]
    }

Response (404):
    { "error": "No path found between room_12 and vendor_5." }

Response (400):
    { "error": "<reason>" }
"""

import logging

from django.http import JsonResponse
from django.views.decorators.http import require_GET

from app.utils.pathfinder import build_graph, find_path, load_graph, path_to_segments, save_graph

logger = logging.getLogger(__name__)

_VALID_PREFIXES = ('room_', 'vendor_')


def _validate_node_id(value: str, param_name: str) -> 'str | None':
    """Return an error string if the node ID is invalid, else None."""
    if not value:
        return f"'{param_name}' query parameter is required."
    if not any(value.startswith(p) for p in _VALID_PREFIXES):
        return f"'{param_name}' must start with 'room_' or 'vendor_' (got: {value!r})."
    suffix = value.split('_', 1)[1]
    if not suffix.isdigit():
        return f"'{param_name}' must end with a numeric ID (got: {value!r})."
    return None


@require_GET
def pathfind(request):
    from_node = request.GET.get('from', '').strip()
    to_node   = request.GET.get('to',   '').strip()
    force_rebuild = request.GET.get('rebuild', '0') == '1'

    # ── Validate inputs ──────────────────────────────────────────────────────
    for param, value in (('from', from_node), ('to', to_node)):
        err = _validate_node_id(value, param)
        if err:
            return JsonResponse({'error': err}, status=400)

    if from_node == to_node:
        return JsonResponse({'error': 'from and to nodes must be different.'}, status=400)

    # ── Load or build graph ──────────────────────────────────────────────────
    try:
        if force_rebuild:
            logger.info('pathfind: forced graph rebuild requested')
            G = build_graph()
            save_graph(G)
        else:
            G = load_graph()
            if G is None:
                logger.info('pathfind: no cached graph found — building now')
                G = build_graph()
                save_graph(G)
    except Exception as exc:
        logger.exception('pathfind: error loading/building graph')
        return JsonResponse({'error': f'Graph error: {exc}'}, status=500)

    # ── Run pathfinding ──────────────────────────────────────────────────────
    if from_node not in G:
        return JsonResponse(
            {'error': f'Node {from_node!r} not found in pathfinding graph.'},
            status=404,
        )
    if to_node not in G:
        return JsonResponse(
            {'error': f'Node {to_node!r} not found in pathfinding graph.'},
            status=404,
        )

    path, total_metres = find_path(G, from_node, to_node)

    if path is None:
        return JsonResponse(
            {'error': f'No path found between {from_node} and {to_node}.'},
            status=404,
        )

    segments = path_to_segments(G, path)

    # Flat waypoint list — convenient for drawing a single polyline on the map.
    # Each entry: { node_id, label, lng, lat }
    waypoints = []
    for node_id in path:
        nd = G.nodes[node_id]
        waypoints.append({
            'node_id': node_id,
            'label':   nd.get('label', node_id),
            'lng':     nd.get('lng'),
            'lat':     nd.get('lat'),
        })

    return JsonResponse({
        'from_node':    from_node,
        'to_node':      to_node,
        'total_metres': round(total_metres, 1),
        'path':         path,
        'waypoints':    waypoints,
        'segments':     segments,
    })
