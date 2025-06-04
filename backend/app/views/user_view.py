# views/user_view.py

from rest_framework import viewsets
from app.models.user import User
from app.models.user_event import UserEvent
from app.serializers.user_serializer import UserSerializer
from django.db.models import Prefetch

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related(
        Prefetch('user_events', queryset=UserEvent.objects.select_related('event'))
    )
    serializer_class = UserSerializer