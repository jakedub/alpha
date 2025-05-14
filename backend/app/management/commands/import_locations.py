import csv
from django.core.management.base import BaseCommand
from app.models.location import Location, Room, TravelConnection

class Command(BaseCommand):
    help = 'Import locations and rooms from events CSV into the database and deduplicate locations'

    def handle(self, *args, **kwargs):
        # Read the CSV file
        csv_file_path = 'app/assets/events.csv'
        locations_data = {}

        with open(csv_file_path, newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            for row in reader:
                location_name = row['Location']
                room_name = row['Room Name']

                # Check if the location already exists or create a new one
                if location_name not in locations_data:
                    location_instance, created = Location.objects.get_or_create(name=location_name)

                    if not created:
                        locations_data[location_name] = {'location_instance': location_instance, 'rooms': []}
                    else:
                        locations_data[location_name] = {'location_instance': location_instance, 'rooms': []}

                # Process room name for floor_level if it starts with a number
                room_data = {"room_name": room_name}
                floor_level = None

                if room_name and room_name[0].isdigit() and '-' in room_name:
                    room_numbers = room_name.split('-')
                    try:
                        floor_level = int(room_numbers[0]) // 100  # Assume floor level from room number
                        room_data.update({
                            "room_numbers": room_name,
                            "floor_level": floor_level
                        })
                    except ValueError:
                        pass

                # Add room to the list of rooms for the location
                locations_data[location_name]['rooms'].append(room_data)

        # Bulk create rooms and connections
        rooms = []
        travel_connections = []
        for location_name, location_info in locations_data.items():
            location_instance = location_info['location_instance']
            for room_data in location_info['rooms']:
                room_instance = Room.objects.create(
                    location=location_instance,
                    room_name=room_data['room_name'],
                    floor_level=room_data.get('floor_level', None)
                )
                rooms.append(room_instance)

                # If there are multiple rooms in the same location, create travel connections between them
                for other_room in location_info['rooms']:
                    if room_data != other_room:  # Skip self-connection
                        other_room_instance = Room.objects.get(
                            location=location_instance,
                            room_name=other_room['room_name']
                        )
                        # Create travel connection
                        travel_connections.append(
                            TravelConnection(from_room=room_instance, to_room=other_room_instance)
                        )

        # Bulk insert rooms and travel connections
        Room.objects.bulk_create(rooms)
        TravelConnection.objects.bulk_create(travel_connections)

        self.stdout.write(self.style.SUCCESS("Locations and rooms have been imported and travel connections created successfully."))