# backend/app/management/commands/fetch_vendors.py

from django.core.management.base import BaseCommand
import requests
import json
import os

class Command(BaseCommand):
    help = "Fetches and combines vendor pages from GenCon API and saves to app/assets/exhibitors.json"

    def handle(self, *args, **options):
        self.fetch_and_combine_all_pages()

    def fetch_and_combine_all_pages(self):
        base_url = "https://www.gencon.com/api/v1/exhibitors?page="
        page = 1
        combined_records = []
        meta = None

        while True:
            self.stdout.write(f"Fetching page {page}...")
            response = requests.get(base_url + str(page))
            if response.status_code != 200:
                self.stderr.write(f"Failed to fetch page {page}: Status {response.status_code}")
                break

            page_json = response.json()
            records = page_json.get("records", [])
            if not records:
                self.stdout.write(f"No records on page {page}, stopping.")
                break

            combined_records.extend(records)
            if meta is None:
                meta = {k: v for k, v in page_json.items() if k != "records"}

            page += 1

        self.stdout.write(f"Total records fetched: {len(combined_records)}")

        combined_json = meta or {}
        combined_json["records"] = combined_records

        output_file = os.path.join("app", "assets", "exhibitors.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(combined_json, f, indent=2, ensure_ascii=False)

        self.stdout.write(self.style.SUCCESS(f"Saved combined data to {output_file}"))