from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from app.models.event import Event
from app.serializers.event_serializer import EventSerializer
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class EventSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'q',
                openapi.IN_QUERY,
                description="Search query (minimum 3 characters)",
                type=openapi.TYPE_STRING
            )
        ]
    )
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) < 3:
            return Response([])
        events = Event.objects.filter(
            Q(title__icontains=query) | 
            Q(gaming_group__icontains=query) | 
            Q(game_id__icontains=query) |
            Q(location__name__icontains=query)
        ).order_by('title')[:20]
        data = EventSerializer(events, many=True).data
        return Response(data)