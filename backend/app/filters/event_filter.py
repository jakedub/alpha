# app/filters/event_filter.py
import django_filters
from app.models.event import Event

class EventFilter(django_filters.FilterSet):
    game_id = django_filters.CharFilter(lookup_expr='exact')
    gaming_group = django_filters.CharFilter(lookup_expr='icontains')
    title = django_filters.CharFilter(lookup_expr='icontains')
    short_description = django_filters.CharFilter(lookup_expr='icontains')
    long_description = django_filters.CharFilter(lookup_expr='icontains')
    event_type = django_filters.CharFilter(lookup_expr='icontains')
    game_system = django_filters.CharFilter(lookup_expr='icontains')
    rules_edition = django_filters.CharFilter(lookup_expr='icontains')
    minimum_players = django_filters.NumberFilter()
    maximum_players = django_filters.NumberFilter()
    minimum_age = django_filters.CharFilter(lookup_expr='icontains')
    experience_required = django_filters.CharFilter(lookup_expr='icontains')
    materials_required = django_filters.BooleanFilter()
    materials_required_details = django_filters.CharFilter(lookup_expr='icontains')
    start_time = django_filters.DateTimeFromToRangeFilter()
    duration_hours = django_filters.NumberFilter()
    end_time = django_filters.DateTimeFromToRangeFilter()
    gm_names = django_filters.CharFilter(lookup_expr='icontains')
    website = django_filters.CharFilter(lookup_expr='icontains')
    email = django_filters.CharFilter(lookup_expr='icontains')
    tournament = django_filters.BooleanFilter()
    round_number = django_filters.NumberFilter()
    total_rounds = django_filters.NumberFilter()
    minimum_play_time = django_filters.NumberFilter()
    attendee_registration = django_filters.CharFilter(lookup_expr='icontains')
    cost = django_filters.RangeFilter()
    location__name = django_filters.CharFilter(lookup_expr='icontains')
    room__room_name = django_filters.CharFilter(lookup_expr='icontains')
    room__floor_level = django_filters.NumberFilter()
    table_number = django_filters.CharFilter(lookup_expr='icontains')
    special_category = django_filters.CharFilter(lookup_expr='icontains')
    tickets_available = django_filters.NumberFilter()
    last_modified = django_filters.DateFromToRangeFilter()

    class Meta:
        model = Event
        fields = []