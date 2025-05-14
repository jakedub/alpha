from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from app.models.event import Event
from app.models.user_event import UserEvent
from app.serializers.event_serializer import EventSerializer
from app.filters.event_filter import EventFilter

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = EventFilter

    def get_queryset(self):
        user = self.request.user
        return Event.objects.filter(user_events__user=user)

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.save()
        # Automatically set status to "wishlist" when an event is added
        UserEvent.objects.create(user=user, event=event, status='wishlist')