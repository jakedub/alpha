from django.core.management.base import BaseCommand
import requests
import pandas as pd
import os
import openpyxl

class Command(BaseCommand):
    help = "Fetches and downloads events from the GenCon API and saves to app/assets/events.json"

    def handle(self, *args, **kwargs):
        xlsx_url = "https://www.gencon.com/downloads/events.xlsx"
        xlsx_path = "app/assets/events.xlsx"
        csv_path = "app/assets/events.csv"

        try:
            self.stdout.write("Downloading GenCon events XLSX file...")
            response = requests.get(xlsx_url)
            response.raise_for_status()

            with open(xlsx_path, "wb") as f:
                f.write(response.content)

            self.stdout.write("Successfully downloaded XLSX file.")
            df = pd.read_excel(xlsx_path, engine='openpyxl')
            df.to_csv(csv_path, index=False)
            os.remove(xlsx_path)  # Clean up XLSX file after conversion
            self.stdout.write(self.style.SUCCESS(f"Converted XLSX to CSV and saved to {csv_path}"))

        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Error fetching or processing GenCon Data: {e}"))