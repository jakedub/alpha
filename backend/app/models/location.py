# models/location.py
from django.db import models

class Location(models.Model):
    name = models.CharField(max_length=255)  # e.g., "ICC", "Union Station"
    address = models.CharField(max_length=255, null=True, blank=True)  # Optional, can be used for more specific address data
    base_latitude = models.FloatField()
    base_longitude = models.FloatField()
    
    def __str__(self):
        return f"{self.id} -{self.name}"