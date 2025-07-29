from django.core.management.base import BaseCommand
from django.db.models import Count
from django.db.models.functions import Lower
from app.models.vendor import Vendor

class Command(BaseCommand):
    help = "Merge duplicate Vendors by name, combining booth numbers and tags"

    def handle(self, *args, **options):
        duplicates = (
            Vendor.objects
            .annotate(name_lower=Lower('name'))
            .values('name_lower')
            .annotate(count=Count('id'))
            .filter(count__gt=1)
        )

        total_merged = 0

        for dup in duplicates:
            name_lower = dup['name_lower']
            vendors = Vendor.objects.filter(name__iexact=name_lower).order_by('id')

            primary = vendors.first()
            duplicates = vendors.exclude(id=primary.id)

            booth_numbers = set()
            if primary.booth_number:
                booth_numbers.update([b.strip() for b in primary.booth_number.split(',') if b.strip()])

            for vendor in duplicates:
                if vendor.booth_number:
                    booth_numbers.update([b.strip() for b in vendor.booth_number.split(',') if b.strip()])

            primary.booth_number = ', '.join(sorted(booth_numbers))
            primary.save()

            for vendor in duplicates:
                for tag in vendor.tags.all():
                    primary.tags.add(tag)

            count_deleted = duplicates.count()
            duplicates.delete()

            self.stdout.write(
                f"Merged {count_deleted} vendors into '{primary.name}' (ID: {primary.id}) with booths: {primary.booth_number}"
            )
            total_merged += count_deleted

        self.stdout.write(self.style.SUCCESS(f"Total merged vendors: {total_merged}"))