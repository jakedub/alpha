# serializers/entrance_serializer.py
from rest_framework import serializers
from app.models.entrance import Entrance
from .location_serializer import LocationSerializer

class EntranceSerializer(serializers.ModelSerializer):
    rooms = LocationSerializer(many=True, read_only=True)

    class Meta:
        model = Entrance
        fields = ['name', 'location', 'en_latitude', 'en_longitude']