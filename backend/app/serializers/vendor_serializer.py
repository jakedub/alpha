from rest_framework import serializers
from app.models.vendor import Vendor

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id', 'gencon_id', 'name', 'booth_number',
            'website_url', 'map_url', 'map_x', 'map_y', 'description'
        ]
