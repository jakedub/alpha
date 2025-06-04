import django_filters
from django.db.models.functions import ExtractWeekDay
from django.db.models import TimeField
from app.models.event import Event
import datetime
from django.db.models.functions import Cast

class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass

class EventFilter(django_filters.FilterSet):
    game_id = django_filters.CharFilter(lookup_expr='exact')
    gaming_group = django_filters.CharFilter(method='filter_gaming_group')
    title = django_filters.CharFilter(lookup_expr='icontains')
    short_description = django_filters.CharFilter(lookup_expr='icontains')
    long_description = django_filters.CharFilter(lookup_expr='icontains')
    event_type = django_filters.CharFilter(field_name='event_type', method='filter_event_type')
    game_system = django_filters.CharFilter(field_name='game_system', method='filter_game_system')
    rules_edition = django_filters.CharFilter(lookup_expr='icontains')
    minimum_players = django_filters.NumberFilter()
    maximum_players = django_filters.NumberFilter()
    minimum_age = django_filters.CharFilter(field_name='minimum_age', method='filter_minimum_age')
    experience_required = django_filters.CharFilter(field_name='experience_required', method='filter_experience_required')
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
    location = django_filters.CharFilter(field_name='location__name', method='filter_location')
    room__room_name = django_filters.CharFilter(lookup_expr='icontains')
    room__floor_level = django_filters.NumberFilter()
    table_number = django_filters.CharFilter(lookup_expr='icontains')
    special_category = django_filters.CharFilter(lookup_expr='icontains')
    tickets_available = django_filters.NumberFilter()
    last_modified = django_filters.DateFromToRangeFilter()
    
    day = django_filters.CharFilter(method='filter_day')
    start_time = django_filters.CharFilter(method='filter_start_time')

    class Meta:
        model = Event
        fields = []

    def filter_day(self, queryset, name, value):
        values = self.data.getlist(name)
        if values:
            weekday_nums = [self._day_to_number(day) for day in values]
            return queryset.annotate(weekday=ExtractWeekDay('start_time')).filter(weekday__in=weekday_nums)
        return queryset

    def filter_start_time(self, queryset, name, value):
        try:
            raw_values = self.data.getlist(name)
            print("Raw start_time values received:", raw_values)
            times = [datetime.datetime.strptime(v.strip(), '%I:%M %p').time() for v in raw_values]
            print("Parsed times for filtering:", times)

            # Cast the start_time datetime to a time-only field
            return queryset.annotate(
                start_time_only=Cast('start_time', output_field=TimeField())
            ).filter(start_time_only__in=times)

        except Exception as e:
            print("Start time filter error:", e)
            return queryset
        
    def _day_to_number(self, day_str):
        days = {
            'Sunday': 1,
            'Monday': 2,
            'Tuesday': 3,
            'Wednesday': 4,
            'Thursday': 5,
            'Friday': 6,
            'Saturday': 7,
        }
        return days.get(day_str, 0)
    def _filter_in(self, queryset, field_name: str, param_name: str):
        values = self.data.getlist(param_name)
        print(f"🔍 Filtered {param_name}: {values}")
        if values:
            return queryset.filter(**{f"{field_name}__in": values})
        return queryset
    
    def filter_location(self, queryset, name, value):
        return self._filter_in(queryset, 'location__name', 'location')

    def filter_event_type(self, queryset, name, value):
        return self._filter_in(queryset, 'event_type', 'event_type')

    def filter_game_system(self, queryset, name, value):
        return self._filter_in(queryset, 'game_system', 'game_system')

    def filter_minimum_age(self, queryset, name, value):
        return self._filter_in(queryset, 'minimum_age', 'minimum_age')

    def filter_experience_required(self, queryset, name, value):
        return self._filter_in(queryset, 'experience_required', 'experience_required')

    def filter_gaming_group(self, queryset, name, value):
        return self._filter_in(queryset, 'gaming_group', 'gaming_group')