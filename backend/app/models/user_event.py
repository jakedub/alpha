# models/user_event.py
from django.db import models
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='wishlist')
    
    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f'{self.user.username} - {self.event.title} - {self.status}'