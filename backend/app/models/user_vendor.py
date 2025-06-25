from django.db import models
from django.contrib.auth import get_user_model

from app.models.vendor import Vendor

User = get_user_model()

class UserVendor(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_vendors')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='user_vendors')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'vendor')

    def __str__(self):
        return f"{self.user} → {self.vendor.name}"