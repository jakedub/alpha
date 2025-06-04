from django.core.management.base import BaseCommand
import os
import requests
from pathlib import Path
import json
tiles_dir = Path("/Users/jacob.moore/Documents/alpha/backend/static/tiles")

INPUT_DIR = tiles_dir

from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Validate and combine tile URLs from floor files."

    def handle(self, *args, **options):
        floors = ["floor-0", "floor-1", "floor-2", "floor-3", "floor-4"]
        zoom_levels = [3, 4, 5, 6, 7]
        zoom_bounds = {
            3: (50, 20),
            4: (70, 30),
            5: (100, 40),
            6: (130, 50),
            7: (160, 64),
        }

        valid_urls = []

        for floor in floors:
            for zoom in zoom_levels:
                max_x, max_y = zoom_bounds.get(zoom, (127, 32))
                print(f"🔍 Scanning {floor} at zoom={zoom} up to x={max_x}, y={max_y}")
                for x in range(0, max_x + 1):
                    for y in range(0, max_y + 1):
                        url = f"https://d2lkgynick4c0n.cloudfront.net/maps/v7/{floor}/{zoom}/{x}/{y}.png"
                        try:
                            r = requests.head(url, timeout=5)
                            if r.status_code == 200:
                                print(f"✅ {url}")
                                valid_urls.append(url)
                        except Exception:
                            continue

        out_path = INPUT_DIR / "tile_urls_valid.txt"
        with open(out_path, "w") as f:
            f.write("\n".join(valid_urls))

        print(f"📁 Wrote {len(valid_urls)} valid URLs to {out_path}")