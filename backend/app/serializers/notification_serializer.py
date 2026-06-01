from rest_framework import serializers
from app.models.notification import Notification

class NotificationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True, default=None)
    event_game_id = serializers.CharField(source='event.game_id', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = ['id', 'event_game_id', 'event_title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'event_game_id', 'event_title', 'message', 'created_at']
