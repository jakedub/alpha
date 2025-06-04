from django.core.management.base import BaseCommand
import json
import re
from pathlib import Path

class Command(BaseCommand):
    help = "Extracts tile URLs and coordinates from HAR files"

    def handle(self, *args, **options):
        BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
        STATIC_DIR = BASE_DIR / "static"
        TILES_OUTPUT_DIR = STATIC_DIR / "tiles"
        TILES_OUTPUT_DIR.mkdir(exist_ok=True)

        pattern = re.compile(r"floor-(\d+)/(\d+)/(\d+)/(\d+)\.png")

        for file_path in STATIC_DIR.glob("gencon*.har.json"):
            with open(file_path, "r") as f:
                har = json.load(f)

            tile_urls = []
            tiles = set()

            for entry in har["log"]["entries"]:
                url = entry["request"]["url"]
                if "cloudfront.net/maps" in url:
                    match = pattern.search(url)
                    if match:
                        floor, z, x, y = match.groups()
                        tile_urls.append(url)
                        tiles.add((int(floor), int(z), int(x), int(y)))

            floor = match.group(1) if match else "unknown"
            with open(TILES_OUTPUT_DIR / f"tile_urls_floor-{floor}.txt", "w") as f:
                f.write("\n".join(tile_urls))

            with open(TILES_OUTPUT_DIR / f"tile_coords_floor-{floor}.json", "w") as f:
                json.dump(sorted(list(tiles)), f, indent=2)

        self.stdout.write(self.style.SUCCESS("✅ Map tile extraction complete."))