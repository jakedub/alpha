from django.db import models

from app.models.user import User
from app.models.vendor_visit import VendorVisit
from app.models.event import Event

class CalendarEvent(models.Model):
    EVENT_TYPES = [
        ('gencon_event', 'GenCon Event'),
        ('vendor_visit', 'Vendor Visit'),
        ('custom', 'Custom Event'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    
    
    # Nullable relations — only one set depending on event_type
    gencon_event = models.ForeignKey(Event, null=True, blank=True, on_delete=models.SET_NULL)
    vendor_visit = models.ForeignKey(VendorVisit, null=True, blank=True, on_delete=models.SET_NULL)
    user_event = models.ForeignKey(
        'app.UserEvent',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='calendar_events'
    )
    
    # For custom or overrides
    title_override = models.CharField(max_length=255, null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    def __str__(self):
        if self.title_override:
            return self.title_override
        if self.event_type == 'gencon_event' and self.gencon_event:
            return self.gencon_event.title
        if self.event_type == 'vendor_visit' and self.vendor_visit:
            return f"Visit {self.vendor_visit.vendor.name}"
        return "Custom Event"