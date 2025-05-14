from django.db import models
from app.models.room import Room

class TravelConnection(models.Model):
    from_room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='outgoing_connections')
    to_room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='incoming_connections')
    distance = models.FloatField()  # Distance between rooms (horizontal or vertical)
    travel_time = models.FloatField(null=True, blank=True)  # Time for travel between rooms, if applicable

    def __str__(self):
        return f"From {self.from_room} to {self.to_room}"