from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from app.models.event import Event
from app.models.user_event import UserEvent
from app.serializers.event_serializer import EventSerializer
from app.filters.event_filter import EventFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EventFilter 
    search_fields = [
        'event_type',
        'gaming_group',
        'location_name',
        'minimum_age',
        'experience_required',
        'game_system',
        'day'
    ]
    ordering_fields = ['start_time', 'title']
    lookup_field = "game_id"
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        print(f"[🔍 get_queryset] Request by user: {user} | Authenticated: {user.is_authenticated}")
        qs = super().get_queryset()
        qs = self.filter_queryset(qs)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        print(f"[➕ perform_create] Creating Event. User: {user} | Authenticated: {user.is_authenticated}")
        event = serializer.save()
        UserEvent.objects.create(user=user, event=event, status='wishlist')