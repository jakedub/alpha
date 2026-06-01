import re
from typing import Optional
from django.core.management.base import BaseCommand
from app.models.room import Room


# Named rooms whose floor level can't be inferred from the room name itself.
# Add entries here as they're confirmed from Gen Con's floor maps.
NAMED_ROOM_FLOORS = {
    # Serpentine lobbies (text hint in name handled automatically, but listed
    # here for completeness / in case name casing varies)
    # 'Serpentine Lobby': 1,

    # Add confirmed mappings in the form 'Room Name': floor_int
}


def infer_floor(room_name: str) -> Optional[int]:
    """
    Return the inferred floor level for a room name, or None if unknown.

    Rules applied in order:
    1. NNN-X  pattern  (import_locations logic, applied retroactively)
       e.g. "101-A" → 1,  "204-B" → 2
    2. Bare integer
       e.g. "101" → 1,  "2704" → 27  (room numbers at ICC)
    3. Ordinal text prefix
       e.g. "1st floor Serpentine Lobby" → 1
            "2nd Floor Foyer" → 2
            "Basement Level" → 0  (treated as floor 0 / basement)
    4. NAMED_ROOM_FLOORS lookup (manual overrides)
    """
    name = room_name.strip()

    # 1. NNN-X
    if name and name[0].isdigit() and '-' in name:
        try:
            return int(name.split('-')[0]) // 100
        except ValueError:
            pass

    # 2. Bare integer (possibly with trailing non-digit chars like " S Illinois St")
    leading_digits = re.match(r'^(\d+)', name)
    if leading_digits:
        try:
            n = int(leading_digits.group(1))
            # Only treat as a room number if it looks like a room number
            # (3–4 digits where the hundreds digit maps to a floor).
            # Ignore short numbers like "1" or "2" which are ambiguous.
            if 100 <= n <= 9999:
                return n // 100
        except ValueError:
            pass

    # 3. Ordinal / floor text in the name
    lower = name.lower()
    ordinal_map = {
        'basement': 0, 'lower level': 0,
        '1st': 1, 'first': 1,
        '2nd': 2, 'second': 2,
        '3rd': 3, 'third': 3,
        '4th': 4, 'fourth': 4,
    }
    for keyword, floor in ordinal_map.items():
        if keyword in lower:
            return floor

    # 4. Manual lookup
    if name in NAMED_ROOM_FLOORS:
        return NAMED_ROOM_FLOORS[name]

    return None


class Command(BaseCommand):
    help = (
        'Assign floor_level to Rooms where it can be inferred from the room '
        'name. Skips rooms that already have a floor_level unless --overwrite '
        'is passed. Use --dry-run to preview changes without writing.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print what would change without writing to the database.',
        )
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Re-infer and overwrite floor_level even for rooms that already have one.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        overwrite = options['overwrite']

        qs = Room.objects.select_related('location').all()
        if not overwrite:
            qs = qs.filter(floor_level__isnull=True)

        updated = 0
        skipped = 0

        for room in qs.order_by('location__name', 'room_name'):
            floor = infer_floor(room.room_name)
            if floor is None:
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(
                    f'  [dry-run] {room.location.name} / {room.room_name!r} '
                    f'→ floor {floor}'
                )
            else:
                room.floor_level = floor
                room.save(update_fields=['floor_level'])

            updated += 1

        label = 'Would update' if dry_run else 'Updated'
        self.stdout.write(
            self.style.SUCCESS(
                f'{label} {updated} room(s). '
                f'Skipped {skipped} room(s) with no inferrable floor.'
            )
        )
