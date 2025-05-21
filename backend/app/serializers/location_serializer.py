# serializers/location_serializer.py
from rest_framework import serializers
from app.models.location import Location
from app.serializers.room_serializer import RoomSerializer

class LocationSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Location
        fields = ['id', 'name', 'address', 'rooms']