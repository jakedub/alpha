from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
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
        'location__name',
        'minimum_age',
        'experience_required',
        'game_system',
        'title',
        'game_id'
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

    @action(detail=False, methods=['get'], url_path='distinct-values', permission_classes=[IsAuthenticatedOrReadOnly])
    def distinct_values(self, request):
        """Return all unique gaming_group and game_system values for filter dropdowns."""
        groups = (
            Event.objects
            .exclude(gaming_group__isnull=True)
            .exclude(gaming_group='')
            .values_list('gaming_group', flat=True)
            .distinct()
            .order_by('gaming_group')
        )
        game_systems = (
            Event.objects
            .exclude(game_system__isnull=True)
            .exclude(game_system='')
            .values_list('game_system', flat=True)
            .distinct()
            .order_by('game_system')
        )
        from app.models.location import Location
        locations = (
            Location.objects
            .exclude(name__isnull=True)
            .exclude(name='')
            .values_list('name', flat=True)
            .distinct()
            .order_by('name')
        )
        return Response({
            'gaming_groups': list(groups),
            'game_systems': list(game_systems),
            'locations': list(locations),
        })