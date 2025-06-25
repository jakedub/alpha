from playwright.sync_api import sync_playwright
import re
import csv
import os
import pandas as pd

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "assets", "full_vendor_list.csv")
csv_path = os.path.normpath(csv_path)
# Define keyword patterns and tag mappings
keyword_tag_map = {
    r'\bdice\b': ['Dice', 'Dice Trays'],
    r'\bminiature\b': ['Miniatures'],
    r'\bboard game\b': ['Board Games'],
    r'\bcard game\b': ['Card Games'],
    r'\brpg\b|\brole[- ]?playing\b': ['Roleplaying Games'],
    r'\bmap\b|\bgame mat\b': ['Game Mats'],
    r'\bterrain\b': ['Miniatures', 'Wargames'],
    r'\bprint\b': ['Prints'],
    r'\bart\b|\billustration\b': ['Art', 'Original Artwork'],
    r'\b3d printing\b': ['3D Printing'],
    r'\bhandmade\b': ['Handmade Goods'],
    r'\bresin\b': ['Resin Crafts'],
    r'\bleather\b': ['Leather Goods'],
    r'\bworkshop\b': ['Workshops'],
    r'\bdemo\b': ['Demos'],
}

def assign_tags_from_text(text):
    tags = set()
    for pattern, mapped_tags in keyword_tag_map.items():
        if re.search(pattern, text.lower()):
            tags.update(mapped_tags)
    return sorted(tags)

def scrape_and_tag(vendors):
    result = []
    blocked_file = open("blocked_vendors.csv", "a", newline="", encoding="utf-8")
    blocked_writer = csv.writer(blocked_file)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for name, url in vendors:
            if not url or not url.strip():
                print(f"Skipping {name} due to blank URL")  # Optional debug
                continue
            url = url.strip()
            if not url.startswith("http://") and not url.startswith("https://"):
                url = "http://" + url
            try:
                page.goto(url, timeout=10000)
                page.wait_for_timeout(5000)
                body = page.inner_text('body')
                if "meraki.com" in page.url:
                    print(f"Blocked by network for {name}: redirected to {page.url}")
                    blocked_writer.writerow([name, url, page.url])
                    result.append((name, url, []))
                    continue
                tags = assign_tags_from_text(body)
                print(f"Vendor: {name}, Tags: {tags}")  # Debug print
                result.append((name, url, tags))
            except Exception as e:
                print(f"Error scraping {name} ({url}): {e}")  # Debug print
                result.append((name, url, []))
        browser.close()
    blocked_file.close()
    return result

# Example usage
if __name__ == "__main__":
    

    # csv_path is set dynamically based on script location above
    df = pd.read_csv(csv_path)
    vendor_rows = list(df[['Name', 'URL']].drop_duplicates(subset='Name').itertuples(index=False, name=None))

    # vendor_rows = vendors
    chunk_size = 10

    # Read existing vendor names from output CSV
    existing_vendors = set()
    if os.path.exists("vendor_tagged_playwright.csv"):
        existing_df = pd.read_csv("vendor_tagged_playwright.csv")
        existing_vendors = set(existing_df['Name'].dropna().unique())

    # Batch loop
    for i in range(0, len(vendor_rows), chunk_size):
        batch = [v for v in vendor_rows[i:i+chunk_size] if v[0] not in existing_vendors]
        print(f"Processing batch {i // chunk_size + 1}: {len(batch)} vendors")
        if not batch:
            continue
        tagged_vendors = scrape_and_tag(batch)
        mode = 'a' if os.path.exists("vendor_tagged_playwright.csv") else 'w'
        with open("vendor_tagged_playwright.csv", mode, newline="") as f_out:
            writer = csv.writer(f_out)
            if mode == 'w':
                writer.writerow(["Name", "URL", "Tags"])
            for name, url, tags in tagged_vendors:
                writer.writerow([name, url, ", ".join(tags)])