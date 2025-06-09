import json
import requests
from io import BytesIO
import argparse
from PIL import Image
import os
import re
from pathlib import Path
from collections import defaultdict
from django.core.management.base import BaseCommand
import json
import requests
from io import BytesIO

def stitch_tiles_from_metadata(metadata_path: Path, output_dir: Path, tile_size: int = 256):
    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    output_dir.mkdir(parents=True, exist_ok=True)

    for floor, zoom_levels in metadata.items():
        for zoom_key, data in zoom_levels.items():
            zoom = data["zoom"]
            tiles = data["tiles"]

            if not tiles:
                continue

            xs = [x for x, _ in tiles]
            ys = [y for _, y in tiles]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)

            width = (max_x - min_x + 1) * tile_size
            height = (max_y - min_y + 1) * tile_size
            stitched_image = Image.new("RGBA", (width, height))

            for x, y in tiles:
                url = f"https://d2lkgynick4c0n.cloudfront.net/maps/v7/{floor}/{zoom}/{x}/{y}.png"
                try:
                    r = requests.get(url, timeout=10)
                    if r.status_code == 200:
                        tile_img = Image.open(BytesIO(r.content))
                        pos_x = (x - min_x) * tile_size
                        pos_y = (y - min_y) * tile_size
                        stitched_image.paste(tile_img, (pos_x, pos_y))
                    else:
                        print(f"⚠️ Missing tile {url} (status {r.status_code})")
                except Exception as e:
                    print(f"❌ Error fetching tile {url}: {e}")

            out_name = f"{floor}_{zoom_key}.png"
            out_path = output_dir / out_name
            stitched_image.save(out_path)
            print(f"✅ Saved {out_path} ({width}x{height})")

class Command(BaseCommand):
    help = "Stitch GenCon remote tiles into single images using tile_metadata.json"

    def add_arguments(self, parser):
        parser.add_argument("--metadata_path", type=str, required=True, help="Path to tile_metadata.json file.")
        parser.add_argument("--output_dir", type=str, required=True, help="Directory to save stitched images.")
        parser.add_argument("--tile_size", type=int, default=256, help="Tile size in pixels (default: 256)")

    def handle(self, *args, **options):
        metadata_path = Path(options["metadata_path"])
        output_dir = Path(options["output_dir"])
        tile_size = options["tile_size"]
        stitch_tiles_from_metadata(metadata_path, output_dir, tile_size)
def stitch_tiles_from_metadata(metadata_path: Path, output_dir: Path, tile_size: int = 256):
    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = output_dir / "cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    for floor, zoom_levels in metadata.items():
        for zoom_key, data in zoom_levels.items():
            # Only process floor-1 and zoom key z3. Floor 0 is done. Floor 1 and Floor 2.
            if floor != "floor-4" or zoom_key != "z3":
                continue

            zoom = data["zoom"]
            tiles = data["tiles"]

            if not tiles:
                continue

            xs = [x for x, _ in tiles]
            ys = [y for _, y in tiles]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)

            width = (max_x - min_x + 1) * tile_size
            height = (max_y - min_y + 1) * tile_size
            stitched_image = Image.new("RGBA", (width, height))

            for x, y in tiles:
                cache_path = cache_dir / f"{floor}_{zoom}_{x}_{y}.png"
                if cache_path.exists():
                    tile_img = Image.open(cache_path)
                else:
                    url = f"https://d2lkgynick4c0n.cloudfront.net/maps/v7/{floor}/{zoom}/{x}/{y}.png"
                    try:
                        r = requests.get(url, timeout=10)
                        if r.status_code == 200:
                            tile_img = Image.open(BytesIO(r.content))
                            tile_img.save(cache_path)
                        else:
                            print(f"⚠️ Missing tile {url} (status {r.status_code})")
                            continue
                    except Exception as e:
                        print(f"❌ Error fetching tile {url}: {e}")
                        continue

                pos_x = (x - min_x) * tile_size
                pos_y = (y - min_y) * tile_size
                stitched_image.paste(tile_img, (pos_x, pos_y))

            out_name = f"{floor}_{zoom_key}.png"
            out_path = output_dir / out_name
            stitched_image.save(out_path)
            print(f"✅ Saved {out_path} ({width}x{height})")