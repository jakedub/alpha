from rest_framework import serializers
from app.models.user_event import UserEvent
from app.models.event import Event

class UserEventSerializer(serializers.ModelSerializer):
    event = serializers.SlugRelatedField(
        slug_field='game_id',  # match your incoming ID
        queryset=Event.objects.all()
    )
    event_id = serializers.IntegerField(source='event.id', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_game_id = serializers.CharField(source='event.game_id', read_only=True)
    event_short_description = serializers.CharField(source='event.short_description', read_only=True)
    event_start_time = serializers.DateTimeField(source='event.start_time', read_only=True)
    event_end_time = serializers.DateTimeField(source='event.end_time', read_only=True)

    class Meta:
        model = UserEvent
        fields = [
            'status', 'event',  # <- accepts input like "MHE25ND271394"
            'event_id', 'event_title', 'event_game_id',
            'event_short_description', 'event_start_time', 'event_end_time'
        ]