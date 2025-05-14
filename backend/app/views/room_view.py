from rest_framework import viewsets
from app.models.room import Room
from app.serializers.room_serializer import RoomSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer