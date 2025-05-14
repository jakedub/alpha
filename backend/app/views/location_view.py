from rest_framework import viewsets
from app.models.location import Location
from app.serializers.location_serializer import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer