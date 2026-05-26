import argparse
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
import os

def capture_screenshots(output_dir, lat_start, lng_start, rows, cols, lat_step, lng_step, zoom, floor, convention):
    os.makedirs(output_dir, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 960})
        for row in range(rows):
            for col in range(cols):
                path = os.path.join(output_dir, f"map_r{row}_c{col}.png")
                if os.path.exists(path):
                    print(f"⏭️ Skipping existing {path}")
                    continue
                lat = lat_start + (row * lat_step)
                lng = lng_start + (col * lng_step)
                url = f"https://www.gencon.com/map?lt={lat}&lg={lng}&z={zoom}&f={floor}&c={convention}"
                page.goto(url)
                page.wait_for_timeout(60000)
                page.evaluate("""
  // Remove nav element and hide Leaflet UI controls but keep nav visible
  const nav = document.querySelector('nav');
  if (nav) nav.remove();
  
// Remove element with id="Embed"
const embed = document.getElementById('Embed');
if (embed) embed.remove();

// Hide Leaflet UI controls
const selectors = ['.leaflet-top', '.leaflet-right', '.leaflet-left'];
selectors.forEach(sel => {
  document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
});

// Remove drawer elements
const drawer = document.querySelector('.mm-ocd__content');
if (drawer) drawer.remove();

const drawerContainer = document.querySelector('.mm-ocd.mm-ocd--left');
if (drawerContainer) drawerContainer.remove();

// Remove iframe launcher
const launcherIframe = document.getElementById('launcher');
if (launcherIframe) launcherIframe.remove();

// Remove hideforprint elements
const hider = document.querySelector('.hideforprint');
if (hider) hider.remove();

// Remove next sibling of drawer container if it is a div
const container = document.querySelector('.mm-ocd.mm-ocd--left');
if (container && container.nextElementSibling && container.nextElementSibling.tagName === 'DIV') {
  container.nextElementSibling.remove();
}

// Hide all body children except #page-wrapper, main.one-column, and nav
const pageWrapper = document.getElementById('page-wrapper');
const mainContent = document.querySelector('main.one-column');
Array.from(document.body.children).forEach(child => {
  if (child !== pageWrapper && child !== mainContent) {
    child.style.display = 'none';
  }
});
""")
                page.wait_for_timeout(500)  # wait for removal
                map_element = page.query_selector('#interactive-map')
                map_element.screenshot(path=path)
                print(f"📸 Saved {path}")
        browser.close()

def stitch_images(output_dir, rows, cols, tile_width=1280, tile_height=920):
    # Canvas: cols wide with no horizontal gaps; rows tall with 5px vertical gaps for seams
    stitched_image = Image.new(
        "RGB",
        (cols * tile_width, rows * tile_height + (rows - 1) * 5)
    )
    for row in range(rows):
        for col in range(cols):
            img_path = os.path.join(output_dir, f"map_r{row}_c{col}.png")
            if not os.path.exists(img_path):
                print(f"❌ Missing tile at row {row}, col {col}, skipping.")
                continue
            tile_img = Image.open(img_path)
            width, height = tile_img.size
            # Crop the 40px nav bar from the top; resulting tile is tile_width × tile_height
            tile = tile_img.crop((0, 40, width, height))
            # Row 0 captured at lowest latitude → place at bottom; highest row → top.
            # Formula: last row (highest lat) starts at y=0, each earlier row shifts down.
            vertical_offset = (rows - 1 - row) * (tile_height + 5)
            horizontal_offset = col * tile_width
            stitched_image.paste(tile, (horizontal_offset, vertical_offset))
    stitched_path = os.path.join(output_dir, "stitched_map.png")
    stitched_image.save(stitched_path)
    print(f"🧵 Stitched image saved to {stitched_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Capture and stitch GenCon map screenshots.")
    parser.add_argument("--output_dir", default="gencon_row")
    parser.add_argument("--lat_start", type=float, default=-46.71727259359432)
    parser.add_argument("--lng_start", type=float, default=-1.8731632444280757)
    parser.add_argument("--rows", type=int, default=10)
    parser.add_argument("--cols", type=int, default=10)
    parser.add_argument("--lat_step", type=float, default=6.12)
    parser.add_argument("--lng_step", type=float, default=13.6)
    parser.add_argument("--zoom", type=int, default=7)
    parser.add_argument("--floor", type=int, default=1)
    parser.add_argument("--convention", type=int, default=26)

    args = parser.parse_args()

    capture_screenshots(
        output_dir=args.output_dir,
        lat_start=args.lat_start,
        lng_start=args.lng_start,
        rows=args.rows,
        cols=args.cols,
        lat_step=args.lat_step,
        lng_step=args.lng_step,
        zoom=args.zoom,
        floor=args.floor,
        convention=args.convention
    )

    stitch_images(args.output_dir, args.rows, args.cols)

    print("✅ Single row captured and stitched.")