# models/route.py
from django.db import models
from .location import Location

class Route(models.Model):
    start_location = models.ForeignKey(Location, related_name='start_routes', on_delete=models.CASCADE)
    end_location = models.ForeignKey(Location, related_name='end_routes', on_delete=models.CASCADE)
    travel_time = models.IntegerField()  # In minutes
    is_elevator = models.BooleanField(default=False)
    stairs = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.start_location} -> {self.end_location}'