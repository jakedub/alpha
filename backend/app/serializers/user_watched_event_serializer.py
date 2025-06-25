from rest_framework import serializers
from app.models.user_watched_event import UserWatchedEvent

class UserWatchedEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWatchedEvent
        fields = ['id', 'user', 'gencon_event_id', 'last_known_status', 'last_checked']
        read_only_fields = ['user', 'last_checked']

    def create(self, validated_data):
        user = self.context['request'].user
        return UserWatchedEvent.objects.create(user=user, **validated_data)
        fields = ['id','gencon_event_id', 'last_known_status', 'last_checked']

    def create(self, validated_data):
        user = self.context['request'].user
        return UserWatchedEvent.objects.create(user=user, **validated_data)