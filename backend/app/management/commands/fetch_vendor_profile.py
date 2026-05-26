import json
import requests

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Fetch exhibitor profiles from Gen Con"

    BASE_URL = "https://www.gencon.com/api/v1/exhibitor_profiles"

    def handle(self, *args, **options):
        page = 1
        per_page = 25

        all_exhibitors = []

        headers = {
            "accept": "application/json, text/plain, */*",
            "user-agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        }

        while True:
            response = requests.get(
                self.BASE_URL,
                params={
                    "c": 27,
                    "page": page,
                    "per_page": per_page,
                },
                headers=headers,
            )

            print("URL:", response.url)
            print("STATUS:", response.status_code)

            if response.status_code != 200:
                print(f"Failed to fetch page {page}")
                break

            payload = response.json()

            exhibitors = payload.get("exhibitors", [])

            if not exhibitors:
                print("No more records found. Stopping.")
                break

            print(f"Fetched {len(exhibitors)} exhibitors from page {page}")

            all_exhibitors.extend(exhibitors)

            page += 1

        print(f"Total records fetched: {len(all_exhibitors)}")

        output_path = "app/assets/exhibitor_profile.json"

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_exhibitors, f, indent=2)

        print(f"Saved combined data to {output_path}")