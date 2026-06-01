from django.core.management.base import BaseCommand
import re
import json
from pathlib import Path

ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / 'assets'
from app.models.vendor import Vendor # Assuming Vendor is the model name

class Command(BaseCommand):
    help = 'Insert vendors from JSON file into the database'

    def handle(self, *args, **kwargs):
        # Read the JSON file
        json_file_path = ASSETS_DIR / 'exhibitors.json'
        with open(json_file_path, 'r') as json_file:
            data = json.load(json_file)
            vendors_data = data.get('records', [])

        inserted_vendor_names = []

        created_count = 0
        updated_count = 0

        for vendor in vendors_data:
            source = vendor.get('_source', {})
            is_guest = source.get('is_guest_exhibitor', False)
            # Determine gencon_id as a string
            if is_guest:
                gencon_id = f"guest_{vendor.get('_id')}"
            else:
                gencon_id = str(source.get('id')) if source.get('id') is not None else None
            if not gencon_id:
                continue

            map_feature = source.get('map_feature', {}).get('properties', {})
            geometry = source.get('map_feature', {}).get('geometry', {})
            coordinates = geometry.get('coordinates', [[]])[0]

            name = source.get('name') or map_feature.get('name')
            description = source.get('searchable_name', '')
            booth_number = source.get('booth_num', '')
            website_url = ''
            map_url = source.get('map_location', '')

            # Try to pull website URL from first names item
            if isinstance(map_feature.get('names'), list) and len(map_feature['names']) > 0:
                website_url = map_feature['names'][0].get('website', '')

            # Calculate average X and Y from latlng for pin placement
            # Calculate centroid X and Y from latlng polygon for pin placement
            latlng = source.get('latlng', [])
            map_floor = source.get('floor_level')
            if latlng:
                try:
                    map_x = sum([float(p[0]) for p in latlng]) / len(latlng)
                    map_y = sum([float(p[1]) for p in latlng]) / len(latlng)
                except Exception:
                    map_x, map_y = None, None
            else:
                map_x, map_y = None, None

            vendor_obj, created = Vendor.objects.update_or_create(
                gencon_id=gencon_id,
                defaults={
                    'name': name,
                    'description': description,
                    'website_url': website_url,
                    'map_url': map_url,
                    'map_x': map_x,
                    'map_y': map_y,
                    'map_floor': map_floor,
                    'map_polygon': [[float(p[0]), float(p[1])] for p in latlng] if latlng else None,
                    'is_guest_exhibitor': is_guest,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

            # Handle booth_number appending logic
            existing_booths = vendor_obj.booth_number.split(',') if vendor_obj.booth_number else []
            existing_booths = [str(b).strip() for b in existing_booths if str(b).strip()]
            if booth_number and booth_number not in existing_booths:
                existing_booths.append(booth_number)
                # Remove duplicates and join
                unique_booths = sorted(set(existing_booths), key=existing_booths.index)
                vendor_obj.booth_number = ', '.join(str(b) for b in unique_booths)
                vendor_obj.save()

            if name not in [n for n, _ in inserted_vendor_names]:
                inserted_vendor_names.append((name, website_url))

        vendor_txt_path = Path(json_file_path).parent / 'vendor.txt'
        with open(vendor_txt_path, 'w') as vendor_file:
            for name, website in inserted_vendor_names:
                vendor_file.write(f"{name} - {website}\n")

        self.stdout.write(f"Vendors created: {created_count}, updated: {updated_count}")