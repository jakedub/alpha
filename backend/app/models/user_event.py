# models/user_event.py
from django.db import models

from app.models.related_user import RelatedUser
from .user import User
from .event import Event

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