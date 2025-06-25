from rest_framework import viewsets, permissions
from app.models.user_vendor import UserVendor
from app.serializers.user_vendor_serializer import UserVendorSerializer


class UserVendorViewSet(viewsets.ModelViewSet):
    queryset = UserVendor.objects.all()  
    serializer_class = UserVendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserVendor.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)