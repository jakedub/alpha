"""
Scrapes the ticketing method (Paper / Electronic) for events that still have
tickets available, by fetching each event's detail page on gencon.com.

Only events with:
  - tickets_available > 0  (not sold out)
  - event_id IS NOT NULL   (has a numeric GenCon ID to build the URL)
  - ticketing_method is blank (not yet scraped, unless --force is passed)

Usage:
  python manage.py scrape_ticketing_method
  python manage.py scrape_ticketing_method --delay 1.0
  python manage.py scrape_ticketing_method --limit 50        # test run
  python manage.py scrape_ticketing_method --force           # re-scrape already filled
  python manage.py scrape_ticketing_method --dry-run         # print without saving
"""

import re
import time

import requests
from django.core.management.base import BaseCommand

from app.models.event import Event

BASE_URL = "https://www.gencon.com/events/{event_id}"
TICKETING_RE = re.compile(r'Ticketing Method:\s*([A-Za-z]+)', re.IGNORECASE)
# Extracts trailing digits from game_id e.g. "NMN26ND304394" → "304394"
GAME_ID_NUM_RE = re.compile(r'(\d+)$')

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


class Command(BaseCommand):
    help = "Scrape ticketing method (Paper/Electronic) from GenCon event pages"

    def add_arguments(self, parser):
        parser.add_argument(
            "--delay",
            type=float,
            default=0.75,
            help="Seconds to wait between requests (default: 0.75)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Max number of events to process (useful for testing)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Re-scrape events that already have a ticketing_method value",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Fetch and parse pages but do not save to the database",
        )

    def handle(self, *args, **options):
        delay = options["delay"]
        limit = options["limit"]
        force = options["force"]
        dry_run = options["dry_run"]

        # game_id must end in digits so we can build the URL
        qs = Event.objects.filter(
            tickets_available__gt=0,
            game_id__regex=r'\d+$',
        )

        if not force:
            qs = qs.filter(ticketing_method__isnull=True)

        qs = qs.order_by('game_id')

        if limit:
            qs = qs[:limit]

        total = qs.count()
        self.stdout.write(
            f"Found {total} event(s) to scrape"
            + (" [DRY RUN]" if dry_run else "")
            + f" | delay={delay}s | force={force}"
        )

        session = requests.Session()
        session.headers.update(HEADERS)

        updated = 0
        not_found = 0
        errors = 0

        for i, event in enumerate(qs, start=1):
            num_match = GAME_ID_NUM_RE.search(event.game_id or '')
            if not num_match:
                self.stdout.write(self.style.WARNING(f"  [{i}/{total}] {event.game_id} — can't parse numeric ID, skipping"))
                continue
            url = BASE_URL.format(event_id=num_match.group(1))
            try:
                resp = session.get(url, timeout=15)

                if resp.status_code == 404:
                    self.stdout.write(f"  [{i}/{total}] {event.game_id} — 404 not found")
                    not_found += 1
                    time.sleep(delay)
                    continue

                if resp.status_code != 200:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [{i}/{total}] {event.game_id} — HTTP {resp.status_code}"
                        )
                    )
                    errors += 1
                    time.sleep(delay)
                    continue

                match = TICKETING_RE.search(resp.text)
                if match:
                    method = match.group(1).strip().capitalize()
                    self.stdout.write(
                        f"  [{i}/{total}] {event.game_id} → {method}"
                        + (" (not saved)" if dry_run else "")
                    )
                    if not dry_run:
                        event.ticketing_method = method
                        event.save(update_fields=["ticketing_method"])
                    updated += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [{i}/{total}] {event.game_id} — 'Ticketing Method' not found in page"
                        )
                    )
                    errors += 1

            except requests.RequestException as e:
                self.stdout.write(
                    self.style.ERROR(f"  [{i}/{total}] {event.game_id} — request error: {e}")
                )
                errors += 1

            time.sleep(delay)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. updated={updated} | not_found={not_found} | errors={errors}"
            )
        )
