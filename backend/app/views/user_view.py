# views/user_view.py

from rest_framework import viewsets
from app.models.user import User
from app.serializers.user_serializer import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer