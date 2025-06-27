from rest_framework import viewsets
from app.models.vendor_visit import VendorVisit
from app.serializers.vendor_visit_serializer import VendorVisitSerializer
from rest_framework.permissions import IsAuthenticated

class VendorVisitViewSet(viewsets.ModelViewSet):
    queryset = VendorVisit.objects.all()
    serializer_class = VendorVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VendorVisit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)