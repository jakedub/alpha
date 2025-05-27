# models/entrance.py
from django.db import models

class Entrance(models.Model):
    location = models.ForeignKey('Location', related_name='entrances', on_delete=models.CASCADE)
    name = models.CharField(max_length=255, null=True, blank=True)  # Optional, e.g., "Main Entrance", "West Gate"
    en_latitude = models.FloatField(null=True, blank=True)
    en_longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.name or 'Entrance'} at {self.location.name}"