from rest_framework import serializers
from app.models.user_event import UserEvent
from app.models.event import Event
from app.serializers.related_user_serializer import RelatedUserSerializer

class UserEventSerializer(serializers.ModelSerializer):
    classNames = serializers.SerializerMethodField()
    related_users = RelatedUserSerializer(many=True, read_only=True)
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
    event_location = serializers.CharField(source='event.location.name', read_only=True)

    def get_classNames(self, obj):
        if obj.self_assigned and obj.related_users.exists():
            # Assigned to both user and others
            color = "#00F0FF"
        elif not obj.self_assigned and obj.related_users.count() > 1:
            # Shared among multiple related users
            color = "#00F0FF"
        elif obj.self_assigned:
            color = obj.user.color_code
        elif obj.related_users.exists():
            color = obj.related_users.first().color_code
        else:
            color = "#ccc"  # fallback color for unassigned or invalid cases

        return [f"user-color-{color.strip('#')}"]
    class Meta:
        model = UserEvent
        fields = [
           'id', 'status', 'event',  # <- accepts input like "MHE25ND271394"
            'event_id', 'event_title', 'event_game_id',
            'event_short_description', 'event_start_time', 'event_end_time', 'self_assigned', 'related_users', 'classNames', 'event_location'
        ]