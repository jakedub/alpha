from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()

class UserWatchedEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watched_events')
    gencon_event_id = models.CharField(max_length=32)
    last_known_status = models.BooleanField(default=False)  # True = available
    last_checked = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'gencon_event_id')

    def __str__(self):
        return f"{self.user} → {self.gencon_event_id}"