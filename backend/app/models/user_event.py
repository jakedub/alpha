# models/user_event.py
from django.db import models

from app.models.related_user import RelatedUser
from .user import User
from .event import Event
from app.models.calendar_event import CalendarEvent

class UserEvent(models.Model):
    STATUS_CHOICES = [
        ('wishlist', 'Wish List'),
        ('unavailable', 'Unavailable'),
        ('purchased', 'Purchased'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_events')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='user_events')
    related_users = models.ManyToManyField(RelatedUser, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='wishlist')
    self_assigned = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f'{self.user.username} - {self.event.title} - {self.status}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Create or update CalendarEvent tied to this UserEvent
        CalendarEvent.objects.update_or_create(
            user=self.user,
            user_event=self,
            defaults={
                'event_type': 'gencon_event',
                'gencon_event': self.event,
                'start_time': self.event.start_time,
                'end_time': self.event.end_time
            }
        )

    def delete(self, *args, **kwargs):
        # Delete all linked CalendarEvent(s) if they exist
        self.calendar_events.all().delete()
        super().delete(*args, **kwargs)