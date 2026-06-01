from rest_framework import viewsets
from app.models.room import Room
from app.serializers.room_serializer import RoomSerializer


class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    queryset = Room.objects.all()  # required by DRF router for basename inference

    def get_queryset(self):
        qs = Room.objects.select_related('location').all()
        floor_level = self.request.query_params.get('floor_level')
        room_type = self.request.query_params.get('room_type')
        location = self.request.query_params.get('location')
        if floor_level is not None:
            qs = qs.filter(floor_level=floor_level)
        if room_type is not None:
            qs = qs.filter(room_type=room_type)
        if location is not None:
            qs = qs.filter(location__name__iexact=location)
        return qs