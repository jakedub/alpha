# serializers/user_serializer.py
from rest_framework import serializers
from app.models.user import User
from app.serializers.user_event_serializer import UserEventSerializer 
class UserSerializer(serializers.ModelSerializer):
    user_events = UserEventSerializer(many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'mobility_aid', 'stair_preference', 'user_events', 'color_code']