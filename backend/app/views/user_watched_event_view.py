from rest_framework import viewsets, permissions
from app.models.user_watched_event import UserWatchedEvent
from app.serializers.user_watched_event_serializer import UserWatchedEventSerializer

class UserWatchedEventViewSet(viewsets.ModelViewSet):
    queryset = UserWatchedEvent.objects.all()
    serializer_class = UserWatchedEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserWatchedEvent.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)