from rest_framework import serializers
from app.models.calendar_event import CalendarEvent
from .vendor_visit_serializer import VendorVisitSerializer


class CalendarEventSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    effective_start_time = serializers.SerializerMethodField()
    effective_end_time = serializers.SerializerMethodField()
    vendor_visit = VendorVisitSerializer(read_only=True)

    class Meta:
        model = CalendarEvent
        fields = [
            'id',
            'user',
            'event_type',
            'gencon_event',
            'vendor_visit',
            'title_override',
            'start_time',
            'end_time',
            'title',
            'effective_start_time',
            'effective_end_time'
        ]

    def get_title(self, obj):
        if obj.title_override:
            return obj.title_override
        if obj.event_type == 'gencon_event' and obj.gencon_event:
            return obj.gencon_event.title
        if obj.event_type == 'vendor_visit' and obj.vendor_visit:
            return f"Visit {obj.vendor_visit.vendor.name}"
        return "Untitled"

    def get_effective_start_time(self, obj):
        if obj.event_type == 'gencon_event' and obj.gencon_event:
            return obj.gencon_event.start_time
        return obj.start_time

    def get_effective_end_time(self, obj):
        if obj.event_type == 'gencon_event' and obj.gencon_event:
            return obj.gencon_event.end_time
        return obj.end_time
