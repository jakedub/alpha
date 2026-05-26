import json
import requests
from io import BytesIO
from pathlib import Path
from PIL import Image
from django.core.management.base import BaseCommand
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class TileStitcher:
    def __init__(self, tile_size: int = 256, cache_enabled: bool = True, tile_timeout: int = 10):
        self.tile_size    = tile_size
        self.cache_enabled = cache_enabled
        self.tile_timeout  = tile_timeout
    
    def stitch_tiles_from_metadata(
        self, 
        metadata_path: Path, 
        output_dir: Path, 
        floors: List[str] = None,
        zoom_keys: List[str] = None
    ):
        """Stitch map tiles into complete floor images."""
        try:
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.error(f"Failed to load metadata: {e}")
            return
        
        output_dir.mkdir(parents=True, exist_ok=True)
        cache_dir = output_dir / "cache" if self.cache_enabled else None
        
        if cache_dir:
            cache_dir.mkdir(parents=True, exist_ok=True)
        
        for floor, zoom_levels in metadata.items():
            if floors and floor not in floors:
                continue
                
            for zoom_key, data in zoom_levels.items():
                if zoom_keys and zoom_key not in zoom_keys:
                    continue
                    
                self._process_floor_zoom(floor, zoom_key, data, output_dir, cache_dir)
    
    def _process_floor_zoom(
        self, 
        floor: str, 
        zoom_key: str, 
        data: Dict, 
        output_dir: Path, 
        cache_dir: Path
    ):
        """Process a single floor/zoom combination."""
        zoom = data["zoom"]
        tiles = data["tiles"]
        
        if not tiles:
            logger.warning(f"No tiles found for {floor} {zoom_key}")
            return
        
        # Calculate bounds
        xs, ys = zip(*tiles)
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        width = (max_x - min_x + 1) * self.tile_size
        height = (max_y - min_y + 1) * self.tile_size
        stitched_image = Image.new("RGBA", (width, height))
        
        successful_tiles = 0
        
        for x, y in tiles:
            tile_img = self._get_tile(floor, zoom, x, y, cache_dir)
            if tile_img:
                pos_x = (x - min_x) * self.tile_size
                pos_y = (y - min_y) * self.tile_size
                stitched_image.paste(tile_img, (pos_x, pos_y))
                successful_tiles += 1
        
        if successful_tiles > 0:
            out_path = output_dir / f"{floor}_{zoom_key}.png"
            stitched_image.save(out_path)
            logger.info(f"✅ Saved {out_path} ({width}x{height}) - {successful_tiles}/{len(tiles)} tiles")
        else:
            logger.warning(f"No tiles retrieved for {floor} {zoom_key}")
    
    def _get_tile(self, floor: str, zoom: int, x: int, y: int, cache_dir: Path) -> Image.Image:
        """Get a single tile, using cache if available."""
        if cache_dir:
            cache_path = cache_dir / f"{floor}_{zoom}_{x}_{y}.png"
            if cache_path.exists():
                try:
                    return Image.open(cache_path)
                except Exception as e:
                    logger.warning(f"Failed to load cached tile {cache_path}: {e}")
        
        # Fetch from remote
        url = f"https://d2lkgynick4c0n.cloudfront.net/maps/v7/{floor}/{zoom}/{x}/{y}.png"
        try:
            r = requests.get(url, timeout=self.tile_timeout)
            if r.status_code == 200:
                tile_img = Image.open(BytesIO(r.content))
                
                # Cache if enabled
                if cache_dir:
                    tile_img.save(cache_path)
                
                return tile_img
            else:
                logger.warning(f"Missing tile {url} (status {r.status_code})")
        except Exception as e:
            logger.error(f"Error fetching tile {url}: {e}")
        
        return None

class Command(BaseCommand):
    help = "Stitch GenCon remote tiles into single images using tile_metadata.json"
    
    def add_arguments(self, parser):
        parser.add_argument("--metadata_path", type=str, required=True, 
                          help="Path to tile_metadata.json file.")
        parser.add_argument("--output_dir", type=str, required=True, 
                          help="Directory to save stitched images.")
        parser.add_argument("--tile_size", type=int, default=256, 
                          help="Tile size in pixels (default: 256)")
        parser.add_argument("--floors", nargs='*', 
                          help="Specific floors to process (e.g., floor-1 floor0)")
        parser.add_argument("--zoom_keys", nargs='*', 
                          help="Specific zoom keys to process (e.g., z7)")
        parser.add_argument("--no_cache", action='store_true', 
                          help="Disable tile caching")
    
    def handle(self, *args, **options):
        stitcher = TileStitcher(
            tile_size=options["tile_size"],
            cache_enabled=not options["no_cache"]
        )
        
        stitcher.stitch_tiles_from_metadata(
            metadata_path=Path(options["metadata_path"]),
            output_dir=Path(options["output_dir"]),
            floors=options.get("floors"),
            zoom_keys=options.get("zoom_keys")
        )