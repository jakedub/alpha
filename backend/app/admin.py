# admin.py
from datetime import timedelta
from django.utils import timezone
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
from django.http import HttpResponse
import csv

admin.site.register(Route)
admin.site.register(UserVendor)
admin.site.register(Tag)
admin.site.register(VendorVisit)
admin.site.register(CalendarEvent)

class ExportFieldSelectionForm(forms.Form):
    _selected_action = forms.CharField(widget=forms.MultipleHiddenInput)
    fields = forms.MultipleChoiceField(
        label="Fields to include in CSV",
        widget=forms.CheckboxSelectMultiple
    )

    def __init__(self, *args, **kwargs):
        model = kwargs.pop("model")
        super().__init__(*args, **kwargs)
        self.fields["fields"].choices = [
            (f.name, f.verbose_name) for f in model._meta.fields
        ] + [
            (f.name, f.verbose_name) for f in model._meta.many_to_many
        ]
class ExportAsCSVActionMixin:
    def export_as_csv(self, request, queryset):
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        # Handle M2M separately (like tags)
        m2m_field_names = [field.name for field in meta.many_to_many]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{meta.verbose_name_plural}.csv"'
        writer = csv.writer(response)
        writer.writerow(field_names + m2m_field_names)  # include M2M fields in header

        for obj in queryset:
            row = [getattr(obj, field) for field in field_names]
            # Add M2M field values (e.g., tag names)
            for field in m2m_field_names:
                related_objects = getattr(obj, field).all()
                value = ", ".join(str(item) for item in related_objects)
                row.append(value)
            writer.writerow(row)

        return response

    export_as_csv.short_description = "Export Selected"

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

class VendorAdmin(ExportAsCSVActionMixin, admin.ModelAdmin):
    filter_horizontal = ('tags',)
    list_display = ['name', 'booth_number', 'display_tags', 'id', 'gencon_id', 'is_guest_exhibitor', 'makers_market']
    list_filter = [HasTagsFilter, 'is_guest_exhibitor', 'makers_market']  # 👈 Add this line
    actions = ['export_as_csv', 'assign_tag_to_selected', 'merge_selected_vendors']
    search_fields = ['name']

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

    def merge_selected_vendors(self, request, queryset):
        if queryset.count() < 2:
            self.message_user(request, "Please select at least two vendors to merge.", level=messages.WARNING)
            return

        primary = queryset.order_by('id').first()
        duplicates = queryset.exclude(id=primary.id)

        booth_set = set()
        if primary.booth_number:
            booth_set.update([b.strip() for b in primary.booth_number.split(',') if b.strip()])

        for vendor in duplicates:
            if vendor.booth_number:
                booth_set.update([b.strip() for b in vendor.booth_number.split(',') if b.strip()])
            for tag in vendor.tags.all():
                primary.tags.add(tag)
            vendor.delete()

        primary.booth_number = ', '.join(sorted(booth_set, key=str))
        primary.save()

        self.message_user(request, f"Merged {duplicates.count()} vendors into '{primary.name}'.")
    merge_selected_vendors.short_description = "Merge selected vendors"

admin.site.register(Vendor, VendorAdmin)

# ── Inlines ───────────────────────────────────────────────────────────────────

class UserEventInline(admin.TabularInline):
    """
    Compact table view.  filter_horizontal removed — it pre-loads every
    RelatedUser into a widget on each row, which is the main perf killer.
    Related users are shown read-only; use the change-link to edit them.
    """
    model = UserEvent
    extra = 0
    show_change_link = True
    fields = ['event', 'status', 'self_assigned', 'related_users_display']
    readonly_fields = ['related_users_display']
    autocomplete_fields = ['event']   # EventAdmin already has search_fields

    def related_users_display(self, obj):
        if not obj.pk:
            return '—'
        names = [ru.name for ru in obj.related_users.all()]
        return ', '.join(names) if names else '—'
    related_users_display.short_description = 'Related Users'

    def get_queryset(self, request):
        return (
            super().get_queryset(request)
            .select_related('event', 'event__location', 'event__room')
            .prefetch_related('related_users')
        )


class RelatedUserInLine(admin.TabularInline):
    model = RelatedUser
    extra = 0
    fields = ['name', 'relationship', 'color_code']

    def get_queryset(self, request):
        return super().get_queryset(request).only(
            'id', 'user_id', 'name', 'relationship', 'color_code'
        )


class CalendarEventInline(admin.TabularInline):
    """
    GenCon-event CalendarEvents are auto-created by UserEvent.save(),
    so show them read-only.  Custom/vendor events can still be added.
    """
    model = CalendarEvent
    extra = 0
    show_change_link = True
    fields = ['event_type', 'title_display', 'start_time', 'end_time']
    readonly_fields = ['event_type', 'title_display', 'start_time', 'end_time']

    def title_display(self, obj):
        return str(obj)
    title_display.short_description = 'Title'

    def get_queryset(self, request):
        return (
            super().get_queryset(request)
            .select_related('gencon_event', 'vendor_visit__vendor')
        )


class VendorVisitInline(admin.TabularInline):
    model = VendorVisit
    extra = 0
    fields = ['vendor', 'note_type']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('vendor')


# ── UserAdmin ─────────────────────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    inlines = [UserEventInline, RelatedUserInLine, CalendarEventInline, VendorVisitInline]
    fields = ['username', 'gencon_id', 'color_code']

    def get_queryset(self, request):
        """
        Pre-fetch all inline data in a handful of queries instead of N+1.
        Each inline's own get_queryset still fires for its sub-selects,
        but the parent objects are already warm in Django's identity map.
        """
        return (
            super().get_queryset(request)
            .prefetch_related(
                'user_events__event__location',
                'user_events__event__room',
                'user_events__related_users',
                'related_users',
                'calendar_events__gencon_event',
                'calendar_events__vendor_visit__vendor',
                'vendor_visits__vendor',
            )
        )

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
    list_display = ['name', 'address', 'base_latitude', 'base_longitude']
    fields = ['name', 'address', 'base_latitude', 'base_longitude']
    actions = ['merge_selected_locations']
    search_fields = ['name']

    def merge_selected_locations(self, request, queryset):
        from app.models.room import Room
        from django.db import transaction

        if queryset.count() < 2:
            self.message_user(request, "Select at least two locations to merge.", level=messages.WARNING)
            return

        # Keep the record with the lowest ID as the canonical one
        primary = queryset.order_by('id').first()
        duplicates = list(queryset.exclude(id=primary.id))
        dup_count = len(duplicates)

        from app.models.event import Event
        from app.models.travel_connection import TravelConnection
        from django.db import connection

        # Check once whether the TravelConnection table actually exists in the DB.
        # If not, we must bypass the ORM cascade when deleting rooms (otherwise
        # Django's pre-delete collector tries to DELETE from the missing table).
        tc_exists = 'app_travelconnection' in connection.introspection.table_names()

        with transaction.atomic():
            for loc in duplicates:
                # ── Rooms: merge carefully to avoid unique_together violations ──
                for dup_room in list(loc.rooms.all()):
                    try:
                        # Does an identical room already exist at the primary?
                        primary_room = Room.objects.get(location=primary, room_name=dup_room.room_name)
                    except Room.DoesNotExist:
                        # Safe to reassign — no conflict
                        dup_room.location = primary
                        dup_room.save()
                    else:
                        # Duplicate room — repoint all FK refs then delete it
                        Event.objects.filter(room=dup_room).update(room=primary_room)
                        if tc_exists:
                            TravelConnection.objects.filter(from_room=dup_room).update(from_room=primary_room)
                            TravelConnection.objects.filter(to_room=dup_room).update(to_room=primary_room)
                            dup_room.delete()
                        else:
                            # Skip ORM cascade — raw DELETE avoids touching the
                            # missing app_travelconnection table
                            with connection.cursor() as cur:
                                cur.execute("DELETE FROM app_room WHERE id = %s", [dup_room.pk])

                # ── Everything else is safe to bulk-update ────────────────────
                loc.events.update(location=primary)
                loc.entrances.update(location=primary)
                loc.start_routes.update(start_location=primary)
                loc.end_routes.update(end_location=primary)
                loc.delete()

        self.message_user(
            request,
            f"Merged {dup_count} location(s) into '{primary.name}' (id={primary.id}). "
            f"Rename it if needed."
        )

    merge_selected_locations.short_description = "Merge selected locations into the oldest record"


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
    search_fields = ['name']   # required for autocomplete_fields in UserEventInline
    list_display = ['name', 'relationship', 'user', 'color_code']
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'start_time', 'end_time', 'location', 'game_id', 'event_id']
    search_fields = ['title', 'short_description', 'long_description', 'game_id']
    list_filter = ['location', 'game_system', 'event_type']
    date_hierarchy = 'start_time'
    ordering = ['start_time']

@admin.register(UserWatchedEvent)
class UserWatchedEventAdmin(admin.ModelAdmin):
    list_display = ['user', 'event']
    search_fields = ['event__title']
    autocomplete_fields = ['event']