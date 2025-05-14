# serializers/user_event_serializer.py
from rest_framework import serializers
from app.models.user_event import UserEvent

class UserEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserEvent
        fields = ['status']