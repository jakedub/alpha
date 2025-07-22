from rest_framework import serializers
from app.models.user_watched_event import UserWatchedEvent
from app.serializers.event_serializer import EventSerializer

class UserWatchedEventSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    class Meta:
        model = UserWatchedEvent
        fields = ['id', 'user', 'last_known_status', 'last_checked', 'event', 'gencon_event_id']
        read_only_fields = ['user', 'last_checked']

    def create(self, validated_data):
        user = self.context['request'].user
        return UserWatchedEvent.objects.create(user=user, **validated_data)
        fields = ['id', 'event', 'last_known_status', 'last_checked']

    def create(self, validated_data):
        user = self.context['request'].user
        return UserWatchedEvent.objects.create(user=user, **validated_data)