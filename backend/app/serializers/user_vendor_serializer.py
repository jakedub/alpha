from rest_framework import serializers
from app.models.user_vendor import UserVendor
from app.models.vendor import Vendor
from app.serializers.vendor_serializer import VendorSerializer

class UserVendorSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        source='vendor', queryset=Vendor.objects.all(), write_only=True
    )

    class Meta:
        model = UserVendor
        fields = ['id', 'user', 'vendor', 'vendor_id', 'added_at']
        read_only_fields = ['user', 'added_at']

    def create(self, validated_data):
        user = self.context['request'].user
        vendor = validated_data['vendor']
        return UserVendor.objects.create(user=user, vendor=vendor)