import json
import time
import requests
from pathlib import Path
from django.core.management.base import BaseCommand

ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / 'assets'

FLOORS = [0, 1, 2, 3, 4]
CONVENTION_ID = 27

# Zoom 7 surfaces the most room-level detail (min_zoom_level up to 7).
ZOOM = 7

# Tile size chosen to stay under the API's per-request result cap.
# The Hyatt viewport (~54° lng × 9° lat) returned 6 rooms fine.
# Using 20° × 8° gives plenty of headroom and ~207 tiles per floor.
LNG_STEP = 20
LAT_STEP = 8
OVERLAP = 2   # degree overlap so features near tile edges aren't missed

LNG_MIN, LNG_MAX = -180, 180
LAT_MIN, LAT_MAX = -85.05, 85.05


def build_tiles():
    """Yield (tl_lat, tl_lng, br_lat, br_lng) viewport tuples covering the full map."""
    lat = LAT_MIN
    while lat < LAT_MAX:
        lng = LNG_MIN
        br_lat = lat                                        # bottom of tile
        tl_lat = min(lat + LAT_STEP + OVERLAP, LAT_MAX)    # top of tile
        while lng < LNG_MAX:
            tl_lng = lng
            br_lng = min(lng + LNG_STEP + OVERLAP, LNG_MAX)
            yield (tl_lat, tl_lng, br_lat, br_lng)
            lng += LNG_STEP
        lat += LAT_STEP


class Command(BaseCommand):
    help = (
        'Fetch room/space features from the Gen Con geo_elements API across '
        'all floor levels using a fine-grained tile grid to stay under the '
        'per-request result cap. Saves combined results to assets/geo_elements.json.\n\n'
        'Default: zoom=7, 20°×8° tiles (~207 per floor, ~1035 total requests).\n'
        'Estimated runtime at --delay=0.15: ~3 minutes.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--floors',
            nargs='+',
            type=int,
            default=FLOORS,
            metavar='FLOOR',
            help=f'Floor levels to fetch (default: {FLOORS}).',
        )
        parser.add_argument(
            '--convention-id',
            type=int,
            default=CONVENTION_ID,
            help=f'Gen Con convention ID (default: {CONVENTION_ID}).',
        )
        parser.add_argument(
            '--zoom',
            type=int,
            default=ZOOM,
            help=f'Zoom level (default: {ZOOM}). Higher zoom surfaces more room-level features.',
        )
        parser.add_argument(
            '--lng-step',
            type=float,
            default=LNG_STEP,
            help=f'Tile width in degrees longitude (default: {LNG_STEP}).',
        )
        parser.add_argument(
            '--lat-step',
            type=float,
            default=LAT_STEP,
            help=f'Tile height in degrees latitude (default: {LAT_STEP}).',
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=0.15,
            help='Seconds to wait between requests (default: 0.15).',
        )
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Output file path. Defaults to assets/geo_elements.json.',
        )

    def handle(self, *args, **options):
        floors = options['floors']
        convention_id = options['convention_id']
        zoom = options['zoom']
        delay = options['delay']

        global LNG_STEP, LAT_STEP
        LNG_STEP = options['lng_step']
        LAT_STEP = options['lat_step']

        output_path = (
            Path(options['output']) if options['output']
            else ASSETS_DIR / 'geo_elements.json'
        )
        ASSETS_DIR.mkdir(parents=True, exist_ok=True)

        tiles = list(build_tiles())
        total_requests = len(floors) * len(tiles)
        est_seconds = total_requests * delay
        self.stdout.write(
            f'Fetching {len(floors)} floor(s) × {len(tiles)} tile(s) '
            f'= {total_requests} requests  '
            f'(zoom={zoom}, tile={LNG_STEP}°lng×{LAT_STEP}°lat, delay={delay}s, '
            f'est. {est_seconds:.0f}s)'
        )

        all_points: dict = {}  # keyed by _id for dedup
        request_num = 0

        for floor in floors:
            floor_new = 0
            for (tl_lat, tl_lng, br_lat, br_lng) in tiles:
                request_num += 1
                params = {
                    'convention_id': convention_id,
                    'zoom': zoom,
                    'floor_level': floor,
                    'top_left[lat]': tl_lat,
                    'top_left[lng]': tl_lng,
                    'bottom_right[lat]': br_lat,
                    'bottom_right[lng]': br_lng,
                }

                try:
                    response = requests.get(
                        'https://www.gencon.com/api/geo_elements',
                        params=params,
                        timeout=30,
                    )
                except requests.RequestException as e:
                    self.stderr.write(f'  [{request_num}/{total_requests}] error: {e}')
                    continue

                if response.status_code != 200:
                    self.stderr.write(
                        f'  [{request_num}/{total_requests}] HTTP {response.status_code} — skipping'
                    )
                    continue

                points = response.json().get('points', [])
                new_this_tile = 0
                for point in points:
                    pid = point.get('_id')
                    if pid and pid not in all_points:
                        all_points[pid] = point
                        new_this_tile += 1
                        floor_new += 1

                if new_this_tile:
                    self.stdout.write(
                        f'  [{request_num}/{total_requests}] '
                        f'floor={floor} ({tl_lat:.0f},{tl_lng:.0f})→({br_lat:.0f},{br_lng:.0f}): '
                        f'+{new_this_tile} (total {len(all_points)})'
                    )

                if delay:
                    time.sleep(delay)

            self.stdout.write(f'  Floor {floor} done: {floor_new} new feature(s)')

        combined = {
            'convention_id': str(convention_id),
            'points': list(all_points.values()),
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(combined, f, indent=2, ensure_ascii=False)

        self.stdout.write(
            self.style.SUCCESS(
                f'Saved {len(all_points)} unique feature(s) to {output_path}'
            )
        )
