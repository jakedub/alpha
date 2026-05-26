import json
import re
from urllib.parse import urlparse, parse_qs

from django.core.management.base import BaseCommand

from app.models.vendor import Vendor
from app.models.tag import Tag


class Command(BaseCommand):
    help = "Attach tags to vendors from exhibitor_profile.json and create missing vendors"

    def handle(self, *args, **kwargs):
        path = "app/assets/exhibitor_profile.json"

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Normalize input shape
        if isinstance(data, dict):
            exhibitors = data.get("exhibitors", [])
        else:
            exhibitors = data

        updated = 0
        created = 0
        unmatched = []

        tag_cache = {}

        for exhibitor in exhibitors:
            locations = exhibitor.get("locations", [])
            tags = exhibitor.get("tags", [])
            exhibitor_type = exhibitor.get("exhibitorType")
            name = exhibitor.get("name")

            gencon_id = None
            map_url = None
            booth_number = None

            # Extract s=XXXXX from navigateTo
            for location in locations:
                navigate_to = location.get("navigateTo", "")
                label = location.get("label", "")

                if navigate_to and not gencon_id:
                    parsed = urlparse(navigate_to)
                    qs = parse_qs(parsed.query)
                    gencon_id = qs.get("s", [None])[0]

                    if gencon_id:
                        map_url = f"https://www.gencon.com{navigate_to}"

                # Extract booth number from label (e.g. "Exhibit Hall : Booth 1637")
                if label and not booth_number:
                    match = re.search(r"Booth\s*([A-Za-z0-9-]+)", label)
                    if match:
                        booth_number = match.group(1)

            if not gencon_id:
                continue

            # Makers Market flag
            is_makers_market = exhibitor_type == "Makers"

            vendor, was_created = Vendor.objects.get_or_create(
                gencon_id=str(gencon_id),
                defaults={
                    "name": name or "Unknown",
                    "booth_number": booth_number,
                    "map_url": map_url,
                    "makers_market": is_makers_market,
                },
            )

            # If vendor already existed, optionally update fields
            if not was_created:
                changed = False

                if is_makers_market and not vendor.makers_market:
                    vendor.makers_market = True
                    changed = True

                if booth_number and not vendor.booth_number:
                    vendor.booth_number = booth_number
                    changed = True

                if map_url and not vendor.map_url:
                    vendor.map_url = map_url
                    changed = True

                if changed:
                    vendor.save()

            # Tag handling
            tag_objects = []

            for tag_name in tags:
                if not tag_name:
                    continue

                tag_name = tag_name.strip()

                if tag_name in tag_cache:
                    tag = tag_cache[tag_name]
                else:
                    tag, _ = Tag.objects.get_or_create(name=tag_name)
                    tag_cache[tag_name] = tag

                tag_objects.append(tag)

            vendor.tags.set(tag_objects)

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created: {created}, Updated: {updated}"
            )
        )

        if unmatched:
            self.stdout.write(
                self.style.WARNING(
                    f"Unmatched: {len(unmatched)}"
                )
            )
            print(unmatched)