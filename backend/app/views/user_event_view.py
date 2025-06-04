from rest_framework import viewsets, permissions
from app.models.user_event import UserEvent
from app.serializers.user_event_serializer import UserEventSerializer

class UserEventViewSet(viewsets.ModelViewSet):
    # Needed for DRF router to generate URLs properly
    queryset = UserEvent.objects.all()
    serializer_class = UserEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict returned objects to only those owned by the current user
        user = self.request.user
        print(f"🔐 get_queryset for user: {user} | Authenticated: {user.is_authenticated}")
        return UserEvent.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        print(f"➕ Creating UserEvent for user: {user} | Authenticated: {user.is_authenticated}")
        serializer.save(user=user)