from django.core.management.base import BaseCommand
import re
import json
from pathlib import Path


class Command(BaseCommand):
    help = "Create json file for tile insertion."

    def handle(self, *args, **kwargs):
        BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
        tiles_dir = BASE_DIR / "static" / "tiles"
        tile_pattern = re.compile(r'maps/v7/floor-(\d+)/(\d+)/(\d+)/(\d+)\.png')

        tile_metadata = {}
        valid_txt_files = list(tiles_dir.glob("tile_urls_valid.txt"))

        if not valid_txt_files:
            self.stdout.write(self.style.WARNING("⚠ No tile URL list files found."))
            return

        for txt_file in valid_txt_files:
            self.stdout.write(f"📄 Reading {txt_file.name}")
            with open(txt_file, "r") as f:
                lines = f.read().splitlines()

            for line in lines:
                match = tile_pattern.search(line)
                if match:
                    floor, z, x, y = match.groups()
                    self.stdout.write(f"✔ Match: floor-{floor}, z={z}, x={x}, y={y}")
                    floor_key = f"floor-{floor}"
                    zoom_key = f"z{z}"
                    if floor_key not in tile_metadata:
                        tile_metadata[floor_key] = {}
                    if zoom_key not in tile_metadata[floor_key]:
                        tile_metadata[floor_key][zoom_key] = {
                            "zoom": int(z),
                            "tiles": []
                        }
                    tile_metadata[floor_key][zoom_key]["tiles"].append([int(x), int(y)])

        metadata_file = tiles_dir / "tile_metadata.json"
        with open(metadata_file, "w") as f:
            json.dump(tile_metadata, f, indent=2)
        self.stdout.write(self.style.SUCCESS(f"✅ Total tiles recorded: {sum(len(z['tiles']) for f in tile_metadata.values() for z in f.values())}"))

        self.stdout.write(self.style.SUCCESS(f"🗺 Tile metadata written to {metadata_file.name}"))
        self.stdout.write(self.style.SUCCESS("🎯 Metadata generation complete."))