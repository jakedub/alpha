import csv
import os
import django

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from app.models import Vendor, Tag

# Path to CSV file
csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vendor_tagged_playwright.csv")

def update_vendor_tags():
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            name = row["Name"].strip()
            tag_string = row["Tags"].strip()
            if not name or not tag_string:
                continue

            try:
                vendor = Vendor.objects.get(name__iexact=name)
            except Vendor.DoesNotExist:
                print(f"Vendor not found: {name}")
                continue

            # Parse and fetch Tag instances
            tag_names = [t.strip() for t in tag_string.split(",") if t.strip()]
            existing_tags = Tag.objects.filter(name__in=tag_names)
            existing_tag_names = set(t.name for t in existing_tags)
            missing_tags = set(tag_names) - existing_tag_names

            if missing_tags:
                print(f"Warning: The following tags for {name} do not exist and were skipped: {', '.join(missing_tags)}")

            if not existing_tags:
                print(f"{name} does not have tags")
                continue

            vendor.tags.set(existing_tags)
            vendor.save()
            print(f"Updated tags for {vendor.name}: {', '.join(t.name for t in existing_tags)}")

if __name__ == "__main__":
    update_vendor_tags()