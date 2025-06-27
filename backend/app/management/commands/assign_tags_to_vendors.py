import csv
import logging
from app.models.vendor import Vendor
from app.models.tag import Tag
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to your vendor/tag CSV
csv_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "assets",
    "vendor_tagged_playwright.csv"
)


# Normalize label: lowercase and spaces to underscores
DISPLAY_TO_VALUE = {
    label.lower().replace(' ', '_'): value for value, label in Tag.TAG_CHOICES
}

with open(csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if not row:
            continue

        vendor_name = row[0].strip()
        tags_str = row[1].strip() if len(row) > 1 else ''

        if not tags_str:
            logger.info(f"Skipping vendor '{vendor_name}' because no tags provided.")
            continue

        try:
            vendor = Vendor.objects.get(name__iexact=vendor_name)
        except Vendor.DoesNotExist:
            logger.info(f"Vendor '{vendor_name}' not found in database. Skipping.")
            continue

        tags_in_file = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        existing_tags = set(t.name for t in vendor.tags.all())
        tags_to_add = []

        for tag_label in tags_in_file:
            tag_label = tag_label.strip()
            if tag_label.startswith('http://') or tag_label.startswith('https://'):
                logger.warning(f"Skipping URL-like tag '{tag_label}'.")
                continue

            key = tag_label.lower().replace(' ', '_')
            tag_value = DISPLAY_TO_VALUE.get(key)

            if not tag_value:
                logger.warning(f"Tag label '{tag_label}' is not a valid choice. Skipping.")
                continue

            if tag_value in existing_tags:
                logger.info(f"Vendor '{vendor_name}' already has tag '{tag_value}'. Skipping tag.")
                continue

            tag_obj, _ = Tag.objects.get_or_create(name=tag_value)
            tags_to_add.append(tag_obj)

        if tags_to_add:
            vendor.tags.add(*tags_to_add)
            logger.info(f"Added tags {', '.join(t.name for t in tags_to_add)} to vendor '{vendor_name}'.")
        else:
            logger.info(f"No new tags to add for vendor '{vendor_name}'.")