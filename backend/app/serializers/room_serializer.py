# app/serializers/room_serializer.py
from rest_framework import serializers
from app.models.room import Room

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'room_name', 'floor_level', 'location']