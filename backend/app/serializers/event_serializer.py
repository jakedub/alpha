# serializers/event_serializer.py
from rest_framework import serializers
from app.models.event import Event
from .location_serializer import LocationSerializer
from .user_serializer import UserSerializer
from .user_event_serializer import UserEventSerializer
from .room_serializer import RoomSerializer

class EventSerializer(serializers.ModelSerializer):
    location = LocationSerializer()
    room = RoomSerializer()
    attendees = UserSerializer(many=True)
    user_status = UserEventSerializer(source='user_events', many=True)

    class Meta:
        model = Event
        fields = ['game_id', 'gaming_group', 'title', 'short_description', 'long_description',
                  'event_type', 'game_system', 'rules_edition', 'minimum_players', 'maximum_players',
                  'minimum_age', 'experience_required', 'materials_required', 'start_time', 'end_time',
                  'location', 'room', 'attendees', 'cost', 'ticketing_method', 'user_status']