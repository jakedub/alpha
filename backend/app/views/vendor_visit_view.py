from rest_framework import viewsets
from app.models.vendor_visit import VendorVisit
from app.serializers.vendor_visit_serializer import VendorVisitSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class VendorVisitViewSet(viewsets.ModelViewSet):
    queryset = VendorVisit.objects.all()
    serializer_class = VendorVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VendorVisit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("VendorVisit serializer errors:", serializer.errors)  # Log errors to console
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)