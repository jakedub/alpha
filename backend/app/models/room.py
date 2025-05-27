from django.db import models
from app.models.location import Location

class Room(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='rooms')  # Link rooms to a location
    room_name = models.CharField(max_length=100)  # e.g., "044" or "Grand Hall"
    floor_level = models.IntegerField(null=True, blank=True)  # The floor of the room (e.g., 1, 2, 3, basement)
    room_type = models.CharField(max_length=100, null=True, blank=True)  # Optional: Room type (e.g., "Conference Room", "Lobby")
    longitude = models.FloatField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.location.name} - {self.room_name}"