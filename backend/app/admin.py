# admin.py
from django.contrib import admin
from .models.event import Event
from .models.location import Location
from .models.route import Route
from .models.user import User
from .models.room import Room
from .models.entrance import Entrance
from .models.user_event import UserEvent
from .models.related_user import RelatedUser
from .models.vendor import Vendor
from .models.user_vendor import UserVendor
from .models.user_watched_event import UserWatchedEvent
from .models.tag import Tag
from django import forms

admin.site.register(Event)
admin.site.register(Route)
admin.site.register(UserVendor)
admin.site.register(UserWatchedEvent)
admin.site.register(Tag)

class VendorAdmin(admin.ModelAdmin):
    filter_horizontal = ('tags',)  # Adds a multi-select widget for tags
    list_display = ['name', 'booth_number', 'tags']  # Optional: add fields to show in list view

admin.site.register(Vendor, VendorAdmin)

class RelatedUserInLine(admin.TabularInline):
    model = RelatedUser
    extra = 0

class UserEventInline(admin.TabularInline):
    model = UserEvent
    extra = 0
    filter_horizontal = ['related_users']

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    inlines = [UserEventInline, RelatedUserInLine]

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
    list_display = ['name', 'base_latitude', 'base_longitude']


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

class UserEventForRelatedUserInline(admin.TabularInline):
    model = UserEvent.related_users.through  
    extra = 0
    fields = ['userevent', 'relateduser']  

    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self.parent_object and hasattr(self.parent_object, 'user'):
            return qs.filter(relateduser=self.parent_object)
        return qs.none()

    def get_formset(self, request, obj=None, **kwargs):
        self.parent_object = obj
        return super().get_formset(request, obj, **kwargs)

@admin.register(RelatedUser)
class RelatedUserAdmin(admin.ModelAdmin):
    inlines = [UserEventForRelatedUserInline]
    class Meta:
        model = RelatedUser
        fields = '__all__'
