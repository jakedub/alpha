from app.models.location import Location
from app.models.room import Room
from utils.geocoding import geocode_venue

def get_room_coordinates(location, room):
    try:
        return IndoorLocation.objects.get(venue_name__icontains=location, room_name__iexact=room)
    except IndoorLocation.DoesNotExist:
        base_lat, base_lng = geocode_venue(location)
        # Optional: use logic or static offset for room
        # This is where you’d add custom mapping logic
        return {
            "latitude": base_lat,
            "longitude": base_lng,
            "room_name": room
        }  