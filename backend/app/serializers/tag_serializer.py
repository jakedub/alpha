from rest_framework import serializers
from app.models.tag import Tag  # Adjust the import path to your project structure

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']