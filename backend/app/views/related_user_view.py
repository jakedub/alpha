# from pyexpat import model
from rest_framework import viewsets, permissions
from app.models.related_user import RelatedUser
from app.serializers.related_user_serializer import RelatedUserSerializer
from app.models.related_user import RelatedUser

class RelatedUserViewSet(viewsets.ModelViewSet):
    # Needed for DRF router to generate URLs properly
    queryset = RelatedUser.objects.all()
    serializer_class = RelatedUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict returned objects to only those owned by the current user
        user = self.request.user
        related_users = RelatedUser.objects.filter(user=user)
        print(f"🔐 get_queryset for user: {user} | Authenticated: {user.is_authenticated}")
        # return RelatedUser.objects.filter(model.Q(user=user) | model.Q(related_user__in=related_users))
        return RelatedUser.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        print(f"➕ Creating RelatedUser for user: {user} | Authenticated: {user.is_authenticated}")
        serializer.save(user=user)