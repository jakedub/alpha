from rest_framework import serializers
from app.models.user_watched_event import UserWatchedEvent
from app.serializers.event_serializer import EventSerializer

class UserWatchedEventSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    class Meta:
        model = UserWatchedEvent
        fields = ['id', 'last_known_status', 'last_checked', 'event', 'gencon_event_id']
        read_only_fields = ['user', 'last_checked']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data.pop('user', None)

        gencon_event_id = validated_data.pop('gencon_event_id', None)
        event = None
        if gencon_event_id:
            # Assuming Event model has a field 'game_id' matching gencon_event_id
            from app.models.event import Event
            try:
                event = Event.objects.get(game_id=gencon_event_id)
            except Event.DoesNotExist:
                raise serializers.ValidationError(f"Event with game_id={gencon_event_id} does not exist.")

        instance = UserWatchedEvent.objects.create(user=user, event=event, **validated_data)
        print(f"[DEBUG] Created UserWatchedEvent instance: {instance}")
        return instance