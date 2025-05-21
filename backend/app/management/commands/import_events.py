import csv
from datetime import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.timezone import make_aware
from app.models.event import Event
from app.models.location import Location
from app.models.room import Room

def parse_floor_level(room_name):
    for part in room_name.split():
        if part.isdigit():
            return int(part)
        elif part and part[0].isdigit():
            return int(''.join(filter(str.isdigit, part)))
    return 1  # Default if no number


def determine_room_type(room_name):
    if 'Hall' in room_name:
        return 'Hall'
    elif 'Lobby' in room_name:
        return 'Lobby'
    elif 'Ballroom' in room_name:
        return 'Ballroom'
    elif 'Field' in room_name:
        return 'Lucas Oil Stadium Field'
    elif 'Meeting Room' in room_name:
        return 'Meeting Room'
    return None

def determine_location_name(location):
    if 'ICC' in location:
        return 'Indiana Convention Center'
    elif 'JW' in location:
        return 'JW Marriot'
    elif 'Stadium' in location:
        return 'Lucas Oil Stadium'
    return None


class Command(BaseCommand):
    help = 'Import events from a CSV file and link to locations and rooms'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **kwargs):
        file_path ='app/assets/events.csv'
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
# Normalize header keys to remove BOM from the first key
            if reader.fieldnames:
                reader.fieldnames[0] = reader.fieldnames[0].lstrip('\ufeff')
            inserted_count = 0
            error_count = 0
            for row in reader:
                try:
                    location_input = row['Location'].strip()
                    location_name = determine_location_name(location_input) or location_input
                    location, _ = Location.objects.get_or_create(name=location_name)

                    room_name = row['Room Name'].strip()
                    floor_level = parse_floor_level(room_name)
                    room_type = determine_room_type(room_name)
                    room, _ = Room.objects.get_or_create(
                        location=location,
                        room_name=room_name,
                        defaults={'floor_level': floor_level, 'room_type': room_type}
                    )

                    event_data = {
                        'gaming_group': row['Group'],
                        'title': row['Title'],
                        'short_description': row['Short Description'],
                        'long_description': row['Long Description'],
                        'event_type': row['Event Type'].split(' - ')[0],
                        'game_system': row['Game System'] or '',
                        'rules_edition': row['Rules Edition'] or '',
                        'minimum_players': int(row['Minimum Players']) if row['Minimum Players'] else None,
                        'maximum_players': int(row['Maximum Players']) if row['Maximum Players'] else None,
                        'minimum_age': row['Age Required'].split()[0],
                        'experience_required': row['Experience Required'].split()[0],
                        'materials_required': row['Materials Required'].strip().lower() == 'yes',
                        'materials_required_details': row['Materials Required Details'],
                        'start_time': make_aware(datetime.strptime(row['Start Date & Time'], '%m/%d/%y %H:%M')),
                        'duration_hours': float(row['Duration']) if row['Duration'] else None,
                        'end_time': make_aware(datetime.strptime(row['End Date & Time'], '%m/%d/%y %H:%M')),
                        'gm_names': row['GM Names'],
                        'website': row['Website'] or '',
                        'email': row['Email'] or '',
                        'tournament': row['Tournament?'].strip().lower() == 'yes',
                        'round_number': int(row['Round Number']) if row['Round Number'] else None,
                        'total_rounds': int(row['Total Rounds']) if row['Total Rounds'] else None,
                        'attendee_registration': row['Attendee Registration?'],
                        'cost': Decimal(row['Cost $']) if row['Cost $'] else Decimal('0.00'),
                        'location': location,
                        'room': room,
                        'table_number': row['Table Number'],
                        'special_category': row['Special Category'],
                        'tickets_available': int(row['Tickets Available']) if row['Tickets Available'] else None,
                        'last_modified': datetime.strptime(row['Last Modified'], '%m/%d/%y').date(),
                    }

                    _, created = Event.objects.update_or_create(game_id=row['Game ID'], defaults=event_data)
                    if created:
                        inserted_count += 1
                except Exception as e:
                    error_count += 1
                    self.stdout.write(self.style.ERROR(
                    f"[ERROR] Could not import event '{row.get('Title', 'Unknown')}' "
                    f"at row #{reader.line_num}: {str(e)}\nAvailable keys: {list(row.keys())}"
                ))

        self.stdout.write(self.style.SUCCESS(f"Import complete. Inserted: {inserted_count}, Errors: {error_count}"))