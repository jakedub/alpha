import csv
import re
from decimal import Decimal, InvalidOperation
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / 'assets'
from django.utils.timezone import make_aware

from app.models.event import Event
from app.models.location import Location
from app.models.room import Room


# ------------------------
# Safe parsing utilities
# ------------------------

def clean(value):
    return str(value).strip() if value not in [None, ""] else ""


def safe_int(value):
    value = clean(value)
    try:
        return int(value) if value else None
    except ValueError:
        return None


def safe_decimal(value):
    value = clean(value)
    try:
        return Decimal(value) if value else Decimal("0.00")
    except (InvalidOperation, ValueError):
        return Decimal("0.00")


def safe_bool_yes(value):
    return clean(value).lower() == "yes"


def safe_split_first(value):
    value = clean(value)
    return value.split()[0] if value else None


def parse_datetime(value, fmt):
    value = clean(value)
    if not value:
        return None
    try:
        return make_aware(datetime.strptime(value, fmt))
    except ValueError:
        return None


def parse_floor_level(room_name):
    room_name = clean(room_name)
    for part in room_name.split():
        if part.isdigit():
            return int(part)
        digits = "".join(filter(str.isdigit, part))
        if digits:
            return int(digits)
    return 1

def parse_event_id(game_id):
    game_id = clean(game_id)
    if not game_id:
        return None
    match = re.search(r'(\d+)$', game_id)
    if match:
        return int(match.group(1))
    return None
# ------------------------
# Normalizers
# ------------------------

def determine_room_type(room_name):
    room_name = clean(room_name)
    if not room_name:
        return None

    mapping = {
        "Hall": "Hall",
        "Lobby": "Lobby",
        "Ballroom": "Ballroom",
        "Field": "Lucas Oil Stadium Field",
        "Meeting Room": "Meeting Room",
    }

    for key, value in mapping.items():
        if key in room_name:
            return value
    return None


def determine_location_name(location):
    location = clean(location)

    if "ICC" in location:
        return "Indiana Convention Center"
    if "JW" in location:
        return "JW Marriott"
    if "Stadium" in location:
        return "Lucas Oil Stadium"

    return location or None


# ------------------------
# Command
# ------------------------

class Command(BaseCommand):
    help = "Import events from a CSV file and link to locations and rooms"

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_file",
            nargs="?",
            default=str(ASSETS_DIR / 'events.csv'),
            help="Path to the GenCon CSV file",
        )

    def handle(self, *args, **kwargs):
        file_path = kwargs["csv_file"]

        inserted_count = 0
        error_count = 0

        with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    def get(col):
                        return clean(row.get(col))

                    # ------------------------
                    # Location / Room
                    # ------------------------
                    location_input = get("Location")
                    location_name = determine_location_name(location_input)

                    location, _ = Location.objects.get_or_create(
                        name=location_name or location_input
                    )

                    room_name = get("Room Name")

                    room, _ = Room.objects.get_or_create(
                        location=location,
                        room_name=room_name
                    )

                    # ------------------------
                    # Event Data
                    # ------------------------
                    duration = row.get("Duration")
                    try:
                        duration_hours = float(duration) if duration not in [None, ""] else None
                    except ValueError:
                        duration_hours = None

                    last_modified_dt = parse_datetime(
                        get("Last Modified"),
                        "%Y-%m-%d %H:%M:%S",
                    )
                    last_modified_date = last_modified_dt.date() if last_modified_dt else None

                    event_data = {
                        "gaming_group": get("Group"),
                        "title": get("Title"),
                        "short_description": get("Short Description"),
                        "long_description": get("Long Description"),

                        "event_type": get("Event Type").split(" - ")[0] if get("Event Type") else None,
                        "game_system": get("Game System"),
                        "rules_edition": get("Rules Edition"),

                        "minimum_players": safe_int(get("Minimum Players")),
                        "maximum_players": safe_int(get("Maximum Players")),

                        "minimum_age": safe_split_first(get("Age Required")),
                        "experience_required": safe_split_first(get("Experience Required")),

                        "materials_required": safe_bool_yes(get("Materials Required")),
                        "materials_required_details": get("Materials Required Details"),

                        "start_time": parse_datetime(
                            get("Start Date & Time"),
                            "%m/%d/%Y %I:%M %p",
                        ),
                        "end_time": parse_datetime(
                            get("End Date & Time"),
                            "%m/%d/%Y %I:%M %p",
                        ),

                        "duration_hours": duration_hours,

                        "gm_names": get("GM Names"),
                        "website": get("Website"),
                        "email": get("Email"),

                        "tournament": safe_bool_yes(get("Tournament?")),
                        "round_number": safe_int(get("Round Number")),
                        "total_rounds": safe_int(get("Total Rounds")),

                        "attendee_registration": get("Attendee Registration?"),
                        "cost": safe_decimal(get("Cost $")),

                        "location": location,
                        "room": room,

                        "table_number": get("Table Number"),
                        "special_category": get("Special Category"),

                        "tickets_available": safe_int(get("Tickets Available")),
                        "last_modified": last_modified_date,
                        "event_id": parse_event_id(get("Game ID")),
                    }

                    _, created = Event.objects.update_or_create(
                        game_id=get("Game ID"),
                        defaults=event_data,
                    )

                    if created:
                        inserted_count += 1

                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f"[ERROR] Row #{reader.line_num} '{row.get('Title','Unknown')}': {e}"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete. Inserted: {inserted_count}, Errors: {error_count}"
            )
        )