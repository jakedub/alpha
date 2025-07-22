from app.models.event import Event
from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()

class UserWatchedEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watched_events')
    event = models.ForeignKey(
            Event,
            on_delete=models.CASCADE,
            to_field='game_id',
            related_name='watched_by_users',
            null=True,  # ← add this
            blank=True  # ← optional for admin forms
        )
    last_known_status = models.BooleanField(default=False)  # True = available
    last_checked = models.DateTimeField(auto_now=True)
    gencon_event_id = models.CharField(max_length=100, blank=True, null=True)  # Optional field for GenCon event ID

    
    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user} → {self.event.game_id}, {self.event.title}"