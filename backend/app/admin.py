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
from .models.vendor_visit import VendorVisit
from .models.calendar_event import CalendarEvent
from django import forms
from django.shortcuts import render, redirect
from django.urls import path
from django.contrib import messages
from django.contrib.admin.helpers import ACTION_CHECKBOX_NAME

admin.site.register(Event)
admin.site.register(Route)
admin.site.register(UserVendor)
admin.site.register(UserWatchedEvent)
admin.site.register(Tag)
admin.site.register(VendorVisit)
admin.site.register(CalendarEvent)

class VendorVisitAdmin(admin.ModelAdmin):
    list_display = ['user', 'vendor', 'note_type']
    list_filter = ['note_type', 'user', 'vendor']

class TagAssignmentForm(forms.Form):
    _selected_action = forms.CharField(widget=forms.MultipleHiddenInput)
    tag = forms.ModelMultipleChoiceField(queryset=Tag.objects.all(), required=True, label="Tags to assign")

class HasTagsFilter(admin.SimpleListFilter):
    title = 'Has Tags'
    parameter_name = 'has_tags'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Has Tags'),
            ('no', 'No Tags'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(tags__isnull=False).distinct()
        if self.value() == 'no':
            return queryset.filter(tags__isnull=True).distinct()
        return queryset

class VendorAdmin(admin.ModelAdmin):
    filter_horizontal = ('tags',)
    list_display = ['name', 'booth_number', 'display_tags']
    list_filter = [HasTagsFilter]  # 👈 Add this line
    actions = ['assign_tag_to_selected']

    def display_tags(self, obj):
        return ", ".join(tag.name for tag in obj.tags.all())
    display_tags.short_description = 'Tags'

    def assign_tag_to_selected(self, request, queryset):
        if request.method == "POST":
            form = TagAssignmentForm(request.POST)
            print(f"Form data: {request.POST}")
            if form.is_valid():
                tags = form.cleaned_data['tag']
                count = 0
                for vendor in queryset:
                    for tag in tags:
                        vendor.tags.add(tag)
                    vendor.save()
                    count += 1
                self.message_user(request, f"Assigned {len(tags)} tags to {count} vendors.")
                return redirect(request.get_full_path())
            else:
                print("Form errors:", form.errors)
        else:
            form = TagAssignmentForm(initial={'_selected_action': request.POST.getlist(ACTION_CHECKBOX_NAME)})
        return render(request, 'assign_tag.html', {
            'vendors': queryset,
            'form': form,
            'title': 'Assign Tag to Selected Vendors',
        })

admin.site.register(Vendor, VendorAdmin)

class CalendarEventInlineForm(forms.ModelForm):
    class Meta:
        model = CalendarEvent
        fields = '__all__'

class CalendarEventInline(admin.StackedInline):
    model = CalendarEvent
    form = CalendarEventInlineForm
    extra = 0

class RelatedUserInLine(admin.TabularInline):
    model = RelatedUser
    extra = 0

class UserEventInline(admin.StackedInline):
    model = UserEvent
    extra = 0
    filter_horizontal = ['related_users']
    
class VendorVisitInline(admin.TabularInline):
    model = VendorVisit
    extra = 0
    fields = ['vendor', 'note_type']

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    inlines = [UserEventInline, RelatedUserInLine, CalendarEventInline, VendorVisitInline]

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
