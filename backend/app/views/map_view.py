# views.py

import requests
from django.http import HttpResponse, HttpResponseNotFound
from django.views.decorators.cache import cache_page
from pathlib import Path
import logging
import os
logger = logging.getLogger(__name__)

TILE_CACHE_ROOT = Path("/tmp/tile_cache")

VALID_TILE_SET = set()

TILE_FILE_PATH = Path(__file__).resolve().parents[2] / "static" / "tiles" / "tile_urls_valid.txt"
print(f"🛠 TILE_FILE_PATH = {TILE_FILE_PATH}")
if TILE_FILE_PATH.exists():
    with open(TILE_FILE_PATH, "r") as f:
        for line in f:
            url = line.strip()
            if not url or "maps/v7/" not in url or not url.endswith(".png"):
                continue
            try:
                parts = url.split("maps/v7/")[-1].replace(".png", "")
                VALID_TILE_SET.add(parts)
                print(f"✅ Valid tile added: {parts}")
            except Exception as e:
                print(f"⚠️ Error parsing line: {url} -> {e}")
else:
    print(f"❌ TILE_FILE_PATH does not exist: {TILE_FILE_PATH}")

@cache_page(60 * 60 * 24)
def tile_proxy(request, floor, zoom, x, y):
    tile_path = f"{floor}/{zoom}/{x}/{y}"
    if tile_path not in VALID_TILE_SET:
        return HttpResponseNotFound("Tile not in valid set")
    url = f"https://d2lkgynick4c0n.cloudfront.net/maps/v7/{floor}/{zoom}/{x}/{y}.png"
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            response = HttpResponse(r.content, content_type="image/png")
            response["Access-Control-Allow-Origin"] = "*"
            return response
        return HttpResponseNotFound()
    except Exception:
        return HttpResponseNotFound()