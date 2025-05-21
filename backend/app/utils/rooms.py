# utils/rooms.py
from app.models.room import Room

def get_room_location(full_name):
    try:
        venue_name, room_name = full_name.split(" - ", 1)
        return Room.objects.get(venue__name__iexact=venue_name, name__iexact=room_name)
    except (ValueError, Room.DoesNotExist):
        return None