from rest_framework import viewsets, permissions
from app.models.vendor import Vendor
from app.serializers.vendor_serializer import VendorSerializer

class VendorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]  # public read access
    lookup_field = 'gencon_id'  # Use gencon_id as the lookup field
    lookup_value_regex = '[0-9]+'  # Ensure gencon_id is numeric

