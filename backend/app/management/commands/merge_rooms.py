from django.core.management.base import BaseCommand
from django.db.models import Count
from django.db.models.functions import Lower
from app.models.room import Room
from app.models.event import Event  # Adjust this to your actual related models

class Command(BaseCommand):
    help = "Merge duplicate Rooms by location and name"

    def handle(self, *args, **options):
        duplicates = (
            Room.objects
            .annotate(name_lower=Lower('room_name'))
            .values('location', 'name_lower')
            .annotate(count=Count('id'))
            .filter(count__gt=1)
        )

        total_merged = 0

        for dup in duplicates:
            location_id = dup['location']
            name_lower = dup['name_lower']

            rooms_qs = Room.objects.filter(location=location_id, room_name__iexact=name_lower).order_by('id')
            primary = rooms_qs.first()
            duplicate_rooms = rooms_qs.exclude(id=primary.id)

            # Merge fields if primary missing data
            if primary.floor_level is None:
                primary.floor_level = duplicate_rooms.first().floor_level if duplicate_rooms.exists() else None
            if primary.room_type is None:
                primary.room_type = duplicate_rooms.first().room_type if duplicate_rooms.exists() else None
            if primary.longitude is None:
                primary.longitude = duplicate_rooms.first().longitude if duplicate_rooms.exists() else None
            if primary.latitude is None:
                primary.latitude = duplicate_rooms.first().latitude if duplicate_rooms.exists() else None

            # Overwrite with any non-null data from duplicates (last one wins)
            for room in duplicate_rooms:
                if room.floor_level is not None:
                    primary.floor_level = room.floor_level
                if room.room_type is not None:
                    primary.room_type = room.room_type
                if room.longitude is not None:
                    primary.longitude = room.longitude
                if room.latitude is not None:
                    primary.latitude = room.latitude

            primary.save()

            # Reassign related objects from duplicates to primary
            for dup_room in duplicate_rooms:
                # Update Events or any related models referencing Room FK here
                Event.objects.filter(room=dup_room).update(room=primary)

            count_deleted = duplicate_rooms.count()
            duplicate_rooms.delete()

            self.stdout.write(
                f"Merged {count_deleted} duplicate rooms into '{primary.room_name}' (ID: {primary.id}) "
                f"with floor level: {primary.floor_level}, type: {primary.room_type}, "
                f"coordinates: ({primary.longitude}, {primary.latitude})"
            )
            total_merged += count_deleted

        self.stdout.write(self.style.SUCCESS(f"Total merged rooms: {total_merged}"))