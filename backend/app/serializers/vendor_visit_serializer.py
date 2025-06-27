from rest_framework import serializers
from app.models.vendor_visit import VendorVisit
from app.serializers.user_serializer import UserSerializer
from app.serializers.vendor_serializer import VendorSerializer

class VendorVisitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    vendor = VendorSerializer(read_only=True)

    class Meta:
        model = VendorVisit
        fields = ['id', 'user', 'vendor', 'note', 'note_type', 'scheduled_event']

    def create(self, validated_data):
        # Remove vendor from validated_data to use vendor_id correctly
        vendor = validated_data.pop('vendor')
        user = self.context['request'].user
        return VendorVisit.objects.create(user=user, vendor=vendor, **validated_data)