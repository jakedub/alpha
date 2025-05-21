# serializers/event_serializer.py
import uuid
from rest_framework import serializers
from app.models.event import Event
from .location_serializer import LocationSerializer
from .user_serializer import UserSerializer
from .user_event_serializer import UserEventSerializer
from .room_serializer import RoomSerializer

class EventSerializer(serializers.ModelSerializer):
    location = LocationSerializer()
    room = RoomSerializer()
    user_status = UserEventSerializer(source='user_events', many=True)

    class Meta:
        model = Event
        fields = [
            'game_id', 'gaming_group', 'title', 'short_description', 'long_description',
            'event_type', 'game_system', 'rules_edition', 'minimum_players', 'maximum_players',
            'minimum_age', 'experience_required', 'materials_required', 'materials_required_details',
            'start_time', 'duration_hours', 'end_time', 'gm_names', 'website', 'email', 'tournament',
            'round_number', 'total_rounds', 'minimum_play_time', 'attendee_registration', 'cost',
            'location', 'room', 'table_number', 'special_category', 'tickets_available', 'last_modified',
            'user_status'
        ]

    def create(self, validated_data):
        if not validated_data.get('game_id'):
            validated_data['game_id'] = f"EVT-{uuid.uuid4().hex[:8]}"
        return super().create(validated_data)