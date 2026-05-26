# app/management/commands/clear_vendors.py
from django.core.management.base import BaseCommand
from app.models.event import Event
from app.models.location import Location
from app.models.vendor import Vendor

class Command(BaseCommand):
    help = "Deletes all vendors from the database"

    def handle(self, *args, **options):
        count, _ = Vendor.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} watched event(s)"))