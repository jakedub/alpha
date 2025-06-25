import requests
import json

def fetch_and_combine_all_pages(output_file="exhibitors.json"):
    base_url = "https://www.gencon.com/api/v1/exhibitors?page="
    page = 1
    combined_records = []
    meta = None  # To store metadata from first page, if any

    while True:
        print(f"Fetching page {page}...")
        response = requests.get(base_url + str(page))
        if response.status_code != 200:
            print(f"Failed to fetch page {page}: Status {response.status_code}")
            break

        page_json = response.json()

        # Extract "records" list
        records = page_json.get("records", [])
        if not records:
            print(f"No records on page {page}, stopping.")
            break

        combined_records.extend(records)

        # Save metadata (if exists) from first page
        if meta is None:
            meta = {k: v for k, v in page_json.items() if k != "records"}

        page += 1

    print(f"Total records fetched: {len(combined_records)}")

    # Construct combined JSON with metadata + combined records
    combined_json = {}
    if meta:
        combined_json.update(meta)
    combined_json["records"] = combined_records

    # Save to output file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(combined_json, f, indent=2, ensure_ascii=False)

    print(f"Saved combined data to {output_file}")

if __name__ == "__main__":
    fetch_and_combine_all_pages()