from rest_framework import serializers
from app.models.related_user import RelatedUser

class RelatedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelatedUser
        fields = ['id', 'name', 'user', 'relationship', 'color_code']