# admin.py
from django.contrib import admin
from .models.event import Event
from .models.location import Location
from .models.route import Route
from .models.user import User
from .models.room import Room
from .models.entrance import Entrance
from .models.user_event import UserEvent
from django import forms

admin.site.register(Event)
admin.site.register(Route)

class UserEventInline(admin.TabularInline):
    model = UserEvent
    extra = 0

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    inlines = [UserEventInline]

class MapPickerMixin(forms.ModelForm):
    latitude_field_name = 'latitude'
    longitude_field_name = 'longitude'

    class Media:
        css = {
            'all': ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'],
        }
        js = [
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
            '/static/map_picker.js',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lat = self.latitude_field_name
        lng = self.longitude_field_name

        if lat in self.fields:
            self.fields[lat].widget.attrs.update({
                'readonly': 'readonly',
                'data-map-lat': 'true',
            })

        if lng in self.fields:
            self.fields[lng].widget.attrs.update({
                'readonly': 'readonly',
                'data-map-lng': 'true',
            })
# Room
class RoomForm(MapPickerMixin):
    latitude_field_name = 'latitude'
    longitude_field_name = 'longitude'

    class Meta:
        model = Room
        fields = '__all__'

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    form = RoomForm

# Location 
class LocationForm(MapPickerMixin):
    latitude_field_name = 'base_latitude'
    longitude_field_name = 'base_longitude'

    class Meta:
        model = Location
        fields = '__all__'

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    form = LocationForm


# Entrance
class EntranceForm(MapPickerMixin):
    latitude_field_name = 'en_latitude'
    longitude_field_name = 'en_longitude'

    class Meta:
        model = Entrance
        fields = '__all__'

@admin.register(Entrance)
class EntranceAdmin(admin.ModelAdmin):
    form = EntranceForm