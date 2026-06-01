import json
import html
import re
from pathlib import Path
from typing import Optional
from django.core.management.base import BaseCommand, CommandError
from app.models.location import Location
from app.models.room import Room

ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / 'assets'

# Keywords found in entrance-arrow names → Location name to search for.
# Extend this as more buildings are added.
ENTRANCE_LOCATION_HINTS = {
    'hall h': 'ICC',
    'hall i': 'ICC',
    'hall j': 'ICC',
    'hall k': 'ICC',
    'hoosier': 'ICC',
    'exhibit hall': 'ICC',
}


def clean_name(raw: str) -> str:
    """Strip HTML entities and tags from a geo_elements name field."""
    unescaped = html.unescape(raw)
    return re.sub(r'<[^>]+>', ' ', unescaped).strip()


def parse_searchable_name(searchable_name: str):
    """
    Split 'Hyatt : Concept A' into ('Hyatt', 'Concept A').
    Returns (None, cleaned_name) if there is no ' : ' separator.
    """
    if ' : ' in searchable_name:
        parts = searchable_name.split(' : ', 1)
        return parts[0].strip(), parts[1].strip()
    return None, searchable_name.strip()


def find_location(prefix: Optional[str]) -> Optional[Location]:
    """
    Try to match a Location by the searchable_name prefix.
    1. Exact match
    2. Case-insensitive exact match
    3. Case-insensitive contains match (first result)
    """
    if not prefix:
        return None
    qs = Location.objects.filter(name=prefix)
    if qs.exists():
        return qs.first()
    qs = Location.objects.filter(name__iexact=prefix)
    if qs.exists():
        return qs.first()
    qs = Location.objects.filter(name__icontains=prefix)
    if qs.exists():
        return qs.first()
    return None


def location_from_entrance_name(name: str) -> Optional[Location]:
    """Infer Location for an entrance-arrow feature from keywords in its name."""
    lower = name.lower()
    for keyword, loc_name in ENTRANCE_LOCATION_HINTS.items():
        if keyword in lower:
            return find_location(loc_name)
    return None


def centroid(latlng: list) -> tuple:
    """Return (lng, lat) centroid of a latlng polygon."""
    lngs = [float(p[0]) for p in latlng]
    lats = [float(p[1]) for p in latlng]
    return sum(lngs) / len(lngs), sum(lats) / len(lats)


class Command(BaseCommand):
    help = (
        'Import rooms from a saved geo_elements API JSON response. '
        'Filters for searchable_category="Spaces" and creates/updates '
        'Room records matched to existing Locations by the searchable_name '
        'prefix (e.g. "Hyatt : Concept A" → Location "Hyatt", Room "Concept A"). '
        'Saves the Gen Con map coordinates (lng/lat) onto Room.longitude / Room.latitude. '
        '\n\n'
        'Usage: python manage.py geo_elements_extract [--file assets/geo_elements.json] [--dry-run]'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default=None,
            help=(
                'Path to the geo_elements JSON file. '
                'Defaults to assets/geo_elements.json.'
            ),
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print what would be created/updated without writing.',
        )
        parser.add_argument(
            '--create-locations',
            action='store_true',
            help=(
                'Create a bare Location record when the prefix does not match '
                'any existing Location. Off by default.'
            ),
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        create_locations = options['create_locations']

        # Resolve file path
        file_arg = options['file']
        if file_arg:
            json_path = Path(file_arg)
            if not json_path.is_absolute():
                json_path = Path.cwd() / json_path
        else:
            json_path = ASSETS_DIR / 'geo_elements.json'

        if not json_path.exists():
            raise CommandError(f'File not found: {json_path}')

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        points = data.get('points', [])
        self.stdout.write(f'Loaded {len(points)} geo_elements point(s) from {json_path.name}')

        created = 0
        updated = 0
        skipped = 0
        no_location = 0

        # Track processed (name, floor) pairs to deduplicate entrance arrows,
        # which appear twice in the API response with consecutive IDs.
        seen_entrances: set = set()

        for point in points:
            source = point.get('_source', {})
            map_cat = source.get('map_feature', {}).get('properties', {}).get('category', '')
            search_cat = source.get('searchable_category', '')

            is_space = search_cat == 'Spaces'
            is_entrance = map_cat == 'entrance-arrow'

            if not is_space and not is_entrance:
                continue

            floor_level = source.get('floor_level')
            latlng = source.get('latlng', [])

            # ── Entrance arrows ────────────────────────────────────────────
            if is_entrance:
                room_name = clean_name(source.get('name', ''))
                if not room_name:
                    skipped += 1
                    continue

                dedup_key = (room_name, floor_level)
                if dedup_key in seen_entrances:
                    continue
                seen_entrances.add(dedup_key)

                map_lng, map_lat = None, None
                if latlng:
                    try:
                        map_lng, map_lat = centroid(latlng)
                    except (TypeError, ValueError, ZeroDivisionError):
                        pass

                location = location_from_entrance_name(room_name)
                if location is None:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  No Location for entrance {room_name!r} — skipping'
                        )
                    )
                    no_location += 1
                    continue

                if dry_run:
                    self.stdout.write(
                        f'  [dry-run entrance] {location.name} / {room_name!r} '
                        f'floor={floor_level} lng={map_lng:.3f} lat={map_lat:.3f}'
                    )
                    created += 1
                    continue

                room, was_created = Room.objects.update_or_create(
                    location=location,
                    room_name=room_name,
                    defaults={
                        'floor_level': floor_level,
                        'longitude': map_lng,
                        'latitude': map_lat,
                        'room_type': 'entrance',
                    },
                )
                created += 1 if was_created else 0
                updated += 0 if was_created else 1
                continue

            # ── Named spaces ───────────────────────────────────────────────
            raw_name = source.get('searchable_name') or source.get('name', '')
            location_prefix, room_name = parse_searchable_name(clean_name(raw_name))

            if not room_name:
                skipped += 1
                continue

            map_lng, map_lat = None, None
            if latlng:
                try:
                    map_lng = float(latlng[0][0])
                    map_lat = float(latlng[0][1])
                except (IndexError, TypeError, ValueError):
                    pass

            location = find_location(location_prefix)
            if location is None:
                if create_locations and location_prefix:
                    if not dry_run:
                        location, _ = Location.objects.get_or_create(name=location_prefix)
                    self.stdout.write(
                        f'  [{"dry-run " if dry_run else ""}created location] {location_prefix!r}'
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  No Location match for prefix {location_prefix!r} '
                            f'— skipping {room_name!r}'
                        )
                    )
                    no_location += 1
                    continue

            if dry_run:
                self.stdout.write(
                    f'  [dry-run space] {location.name} / {room_name!r} '
                    f'floor={floor_level} lng={map_lng} lat={map_lat}'
                )
                created += 1
                continue

            room, was_created = Room.objects.update_or_create(
                location=location,
                room_name=room_name,
                defaults={
                    'floor_level': floor_level,
                    'longitude': map_lng,
                    'latitude': map_lat,
                    'room_type': 'space',
                },
            )
            created += 1 if was_created else 0
            updated += 0 if was_created else 1

        label = 'Would create' if dry_run else 'Created'
        self.stdout.write(
            self.style.SUCCESS(
                f'{label} {created}, updated {updated}, '
                f'skipped {skipped} (no name), '
                f'{no_location} unmatched location(s).'
            )
        )
