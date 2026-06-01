# app/serializers/user_event_serializer.py

from rest_framework import serializers
from app.models.user_event import UserEvent
from app.models.event import Event
from app.models.related_user import RelatedUser
from app.serializers.related_user_serializer import RelatedUserSerializer

class UserEventSerializer(serializers.ModelSerializer):
    classNames = serializers.SerializerMethodField()
    related_users = RelatedUserSerializer(many=True, read_only=True)
    related_user_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=RelatedUser.objects.all(),
        write_only=True,
        required=False,
        source='related_users',
    )
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
    event_room = serializers.CharField(source='event.room.room_name', read_only=True, allow_null=True, default=None)
    event_latitude = serializers.FloatField(source='event.location.base_latitude', read_only=True)
    event_longitude = serializers.FloatField(source='event.location.base_longitude', read_only=True)
    # Room-level Gen Con map coords (Web Mercator) — null when room has no map pin
    room_map_lng = serializers.FloatField(source='event.room.longitude', read_only=True, allow_null=True, default=None)
    room_map_lat = serializers.FloatField(source='event.room.latitude', read_only=True, allow_null=True, default=None)
    room_map_floor = serializers.IntegerField(source='event.room.floor_level', read_only=True, allow_null=True, default=None)
    

    def get_classNames(self, obj):
        if obj.self_assigned and obj.related_users.exists():
            # Assigned to both user and others — use indigo as a "shared" indicator
            color = "#818cf8"
        elif not obj.self_assigned and obj.related_users.count() > 1:
            # Shared among multiple related users
            color = "#818cf8"
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
            'event_short_description', 'event_start_time', 'event_end_time', 'self_assigned', 'related_users',
            'related_user_ids', 'classNames', 'event_location', 'event_room', 'event_latitude', 'event_longitude',
            'room_map_lng', 'room_map_lat', 'room_map_floor'
        ]

    def create(self, validated_data):
        related_users = validated_data.pop('related_users', [])
        instance = super().create(validated_data)
        if related_users:
            instance.related_users.set(related_users)
        return instance

    def update(self, instance, validated_data):
        related_users = validated_data.pop('related_users', None)
        instance = super().update(instance, validated_data)
        if related_users is not None:
            instance.related_users.set(related_users)
        return instance