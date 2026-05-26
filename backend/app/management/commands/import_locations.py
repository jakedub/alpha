import csv
from pathlib import Path
from django.core.management.base import BaseCommand

ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / 'assets'
from app.models.location import Location
from app.models.room import Room
from app.models.travel_connection import TravelConnection


class Command(BaseCommand):
    help = 'Import locations and rooms from events CSV into the database and deduplicate locations'

    def handle(self, *args, **kwargs):
        csv_file_path = ASSETS_DIR / 'events.csv'
        locations_data = {}

        with open(csv_file_path, newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            for row in reader:
                location_name = row['Location']
                room_name = row['Room Name']

                if location_name not in locations_data:
                    location_instance, _ = Location.objects.get_or_create(name=location_name)
                    locations_data[location_name] = {'location_instance': location_instance, 'rooms': []}

                room_data = {"room_name": room_name}

                if room_name and room_name[0].isdigit() and '-' in room_name:
                    try:
                        floor_level = int(room_name.split('-')[0]) // 100
                        room_data['floor_level'] = floor_level
                    except ValueError:
                        pass

                existing_names = [r['room_name'] for r in locations_data[location_name]['rooms']]
                if room_name not in existing_names:
                    locations_data[location_name]['rooms'].append(room_data)

        rooms_created = 0
        connections_created = 0

        for location_name, location_info in locations_data.items():
            location_instance = location_info['location_instance']
            room_instances = {}

            for room_data in location_info['rooms']:
                room_instance, created = Room.objects.get_or_create(
                    location=location_instance,
                    room_name=room_data['room_name'],
                    defaults={'floor_level': room_data.get('floor_level')}
                )
                room_instances[room_data['room_name']] = room_instance
                if created:
                    rooms_created += 1

            room_list = list(room_instances.values())
            for i, from_room in enumerate(room_list):
                for to_room in room_list[i + 1:]:
                    _, created = TravelConnection.objects.get_or_create(
                        from_room=from_room,
                        to_room=to_room
                    )
                    if created:
                        connections_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Import complete. Rooms created: {rooms_created}, Travel connections created: {connections_created}"
        ))