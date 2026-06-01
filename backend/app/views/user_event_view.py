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
        qs = UserEvent.objects.filter(user=user)
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.validated_data.get("event")

        existing = UserEvent.objects.filter(user=user, event=event).first()
        if existing:
            print(f"⚠️ UserEvent already exists for user {user} and event {event}")
            # Update related_users / self_assigned if provided
            related_users = serializer.validated_data.get("related_users", None)
            self_assigned = serializer.validated_data.get("self_assigned", None)
            if related_users is not None:
                existing.related_users.set(related_users)
            if self_assigned is not None:
                existing.self_assigned = self_assigned
                existing.save(update_fields=["self_assigned"])
            serializer.instance = existing
            return

        print(f"➕ Creating UserEvent for user: {user} | Authenticated: {user.is_authenticated}")
        serializer.save(user=user)