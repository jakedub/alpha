from rest_framework import viewsets
from app.models.entrance import Entrance
from app.serializers.entrance_serializer import EntranceSerializer

class EntranceViewSet(viewsets.ModelViewSet):
    queryset = Entrance.objects.all()
    serializer_class = EntranceSerializer