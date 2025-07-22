from rest_framework import serializers
from app.models.vendor_visit import VendorVisit
from app.models.vendor import Vendor
from app.serializers.user_serializer import UserSerializer
from app.serializers.vendor_serializer import VendorSerializer

class VendorVisitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(), source='vendor', write_only=True
    )

    class Meta:
        model = VendorVisit
        fields = ['id', 'user', 'vendor', 'vendor_id', 'note', 'note_type']