from rest_framework import serializers
from app.models.vendor import Vendor
from app.serializers.tag_serializer import TagSerializer

class VendorSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    class Meta:
        model = Vendor
        fields = [
            'id', 'gencon_id', 'name', 'booth_number',
            'website_url', 'map_url', 'map_x', 'map_y', 'description', 'tags'
        ]
