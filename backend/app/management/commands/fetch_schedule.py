from django.core.management.base import BaseCommand
from app.services.schedule import fetch_user_schedule

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--gencon_id', type=str, required=True)

    def handle(self, *args, **options):
        data = fetch_user_schedule(options["gencon_id"])
        self.stdout.write(str(data))