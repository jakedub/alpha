# serializers/user_serializer.py
from rest_framework import serializers
from app.models.user import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']