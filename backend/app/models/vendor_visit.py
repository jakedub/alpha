from django.db import models
from django.contrib.auth import get_user_model

from app.models.user import User
from app.models.vendor import Vendor

class VendorVisit(models.Model):
    NOTE_TYPES = [
        ("purchase", "Purchase"),
        ("demo", "Demo"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="vendor_visits")
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="visits")
    note = models.TextField(blank=True)
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)

    class Meta:
        unique_together = ("user", "vendor")

    def __str__(self):
        return f"{self.user} visiting {self.vendor} ({self.note_type})"