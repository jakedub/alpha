"""
Management command to build, inspect, and cache the pathfinding graph.

Usage:
    python manage.py build_pathfinding_graph              # build + cache
    python manage.py build_pathfinding_graph --stats      # node/edge summary
    python manage.py build_pathfinding_graph --test-route room_<A> room_<B>
    python manage.py build_pathfinding_graph --no-cache   # build without saving
"""
import time
from django.core.management.base import BaseCommand
from app.utils.pathfinder import (
    build_graph, find_path, path_to_segments, save_graph,
    GRAPH_CACHE_PATH,
)


class Command(BaseCommand):
    help = 'Build the NetworkX pathfinding graph from Room + Vendor data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--stats', action='store_true',
            help='Print node/edge breakdown after building.',
        )
        parser.add_argument(
            '--test-route', nargs=2, metavar=('FROM', 'TO'),
            help='Run a test route between two node IDs (e.g. room_12 vendor_5).',
        )
        parser.add_argument(
            '--no-cache', action='store_true',
            help='Build the graph but do not write the pickle cache.',
        )
        parser.add_argument(
            '--list-exits', action='store_true',
            help='List all building_exit nodes and their outdoor edge count.',
        )

    def handle(self, *args, **options):
        self.stdout.write('Building pathfinding graph...')
        t0 = time.perf_counter()
        G = build_graph()
        elapsed = time.perf_counter() - t0

        n_nodes = G.number_of_nodes()
        n_edges = G.number_of_edges()
        self.stdout.write(self.style.SUCCESS(
            f'  Built in {elapsed:.2f}s — {n_nodes} nodes, {n_edges} edges'
        ))

        # ── Stats breakdown ────────────────────────────────────────────────────
        if options['stats']:
            from collections import Counter
            type_counts = Counter(d.get('room_type', '?') for _, d in G.nodes(data=True))
            edge_counts = Counter(d.get('edge_type', '?') for _, _, d in G.edges(data=True))
            self.stdout.write('\nNode types:')
            for t, c in sorted(type_counts.items()):
                self.stdout.write(f'  {t or "(none)":30s} {c}')
            self.stdout.write('\nEdge types:')
            for t, c in sorted(edge_counts.items()):
                self.stdout.write(f'  {t:30s} {c}')

            # Connectivity
            components = list(__import__('networkx').connected_components(G))
            self.stdout.write(f'\nConnected components: {len(components)}')
            for i, comp in enumerate(sorted(components, key=len, reverse=True)[:5]):
                self.stdout.write(f'  Component {i+1}: {len(comp)} nodes')

        # ── List exits ─────────────────────────────────────────────────────────
        if options['list_exits']:
            self.stdout.write('\nBuilding exit nodes:')
            exits = [
                (nid, d) for nid, d in G.nodes(data=True)
                if d.get('room_type') == 'building_exit'
            ]
            for nid, d in sorted(exits, key=lambda x: x[1].get('label', '')):
                outdoor = sum(
                    1 for _, _, ed in G.edges(nid, data=True)
                    if ed.get('edge_type') == 'outdoor'
                )
                has_rw = d.get('rw_lat') is not None
                self.stdout.write(
                    f'  {nid:15s}  rw={"yes" if has_rw else "no"}  '
                    f'outdoor_edges={outdoor}  {d.get("label", "")}'
                )

        # ── Test route ─────────────────────────────────────────────────────────
        if options['test_route']:
            from_node, to_node = options['test_route']
            self.stdout.write(f'\nRouting {from_node} -> {to_node}')
            path, metres = find_path(G, from_node, to_node)
            if path is None:
                self.stdout.write(self.style.WARNING('  No path found.'))
            else:
                self.stdout.write(self.style.SUCCESS(
                    f'  Total distance: ~{metres:.0f} m ({len(path)} nodes)'
                ))
                for seg in path_to_segments(G, path):
                    self.stdout.write(
                        f'  [{seg["edge_type"]:7s}] {seg["from_label"]} -> '
                        f'{seg["to_label"]} ({seg["metres"]} m)'
                    )

        # ── Cache ───────────────────────────────────────────────────────────────
        if not options['no_cache']:
            save_graph(G)
            self.stdout.write(f'\nGraph cached -> {GRAPH_CACHE_PATH}')
