from django.core.management.base import BaseCommand
from app.models.user_event import UserEvent

class Command(BaseCommand):
    help = "Deletes all UserEvent records with NULL event"

    def handle(self, *args, **options):
        null_events = UserEvent.objects.filter(event__isnull=True)
        count = null_events.count()
        null_events.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} UserEvent(s) with null event"))