from django.db import models
from app.models.tag import Tag  # Assuming Tag model is defined in tag.py


class Vendor(models.Model):
    gencon_id = models.CharField(max_length=100, unique=True)  # Gen Con unique ID
    name = models.CharField(max_length=255)
    booth_number = models.CharField(max_length=255, blank=True, null=True)  # Comma-separated booth numbers
    website_url = models.URLField(blank=True, null=True)
    map_url = models.URLField(blank=True, null=True)  # Link to Gen Con map location if any
    is_guest_exhibitor = models.BooleanField(default=False)  # True if this is a guest exhibitor
    makers_market = models.BooleanField(default=False)
    # Coordinates for placing vendor on the map
    map_x = models.FloatField(blank=True, null=True)
    map_y = models.FloatField(blank=True, null=True)
    map_floor = models.IntegerField(blank=True, null=True)  # floor_level from Gen Con API (e.g. 1)
    map_polygon = models.JSONField(blank=True, null=True)  # [[lng, lat], ...] booth outline from latlng
    
    description = models.TextField(blank=True, null=True)  # Optional additional info
    tags = models.ManyToManyField(Tag, blank=True, related_name='vendors')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (Booth(s): {self.booth_number})"

    def booth_list(self):
        if not self.booth_number:
            return []
        return [b.strip() for b in self.booth_number.split(',')]
