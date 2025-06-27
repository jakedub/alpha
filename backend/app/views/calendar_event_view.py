from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from app.models.calendar_event import CalendarEvent
from app.serializers.calendar_event_serializer import CalendarEventSerializer


class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CalendarEvent.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
