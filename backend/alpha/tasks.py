from celery import shared_task
from io import StringIO
from pathlib import Path
from django.core.management import call_command

STEPS = [
    ('download_events',   'Download Events XLSX → CSV'),
    ('fetch_vendors',     'Fetch Vendor Pages from Gen Con'),
    ('import_locations',  'Import Locations & Rooms'),
    ('import_events',     'Import Events'),
    ('vendor_extract',    'Extract & Upsert Vendors'),
    ('merge_vendors',     'Merge Duplicate Vendors'),
]

@shared_task(bind=True)
def run_data_sync(self):
    output = ""
    errors = ""
    report = []

    for idx, (command, label) in enumerate(STEPS):

        stdout = StringIO()
        stderr = StringIO()

        self.update_state(
            state="PROGRESS",
            meta={
                "current_step": label,
                "step_index": idx + 1,
                "total_steps": len(STEPS),
                "percent": int(((idx + 1) / len(STEPS)) * 100),
                "last_output": output,
                "last_error": errors,
            }
        )

        try:
            call_command(command, stdout=stdout, stderr=stderr)

            output = stdout.getvalue().strip()
            errors = stderr.getvalue().strip()

            report.append({
                "step": label,
                "status": "error" if errors else "success",
                "output": output,
                "error": errors or None,
            })

            if errors:
                return report

        except Exception as e:
            report.append({
                "step": label,
                "status": "error",
                "output": stdout.getvalue().strip(),
                "error": str(e),
            })
            return report

    return report


# ── Map tile pipeline ──────────────────────────────────────────────────────────

MAP_EXTRACT_STEPS = [
    ('map_extract', 'Extract tile URLs from HAR files'),
    ('json_map',    'Build tile_metadata.json'),
]

@shared_task(bind=True)
def run_map_extract(self):
    """
    Step 1 of the map tile pipeline.
    Reads gencon*.har.json files from static/, extracts CloudFront tile URLs,
    then produces static/tiles/tile_metadata.json.
    """
    report = []

    for idx, (command, label) in enumerate(MAP_EXTRACT_STEPS):
        stdout = StringIO()
        stderr = StringIO()

        self.update_state(
            state="PROGRESS",
            meta={
                "current_step": label,
                "step_index": idx + 1,
                "total_steps": len(MAP_EXTRACT_STEPS),
                "percent": int(((idx + 1) / len(MAP_EXTRACT_STEPS)) * 100),
            }
        )

        try:
            call_command(command, stdout=stdout, stderr=stderr)
            output = stdout.getvalue().strip()
            errors = stderr.getvalue().strip()

            report.append({
                "step": label,
                "status": "error" if errors else "success",
                "output": output,
                "error": errors or None,
            })

            if errors:
                return report

        except Exception as e:
            report.append({
                "step": label,
                "status": "error",
                "output": stdout.getvalue().strip(),
                "error": str(e),
            })
            return report

    return report


@shared_task(bind=True)
def run_map_stitch(self):
    """
    Step 2 of the map tile pipeline.
    Drives TileStitcher directly (bypassing call_command) so we can emit
    per-floor/zoom progress updates to the Celery result backend.

    Ordering: floor-by-floor, zoom levels ascending within each floor (z3→z7).
    This lets lower-res images finish quickly and gives visible progress before
    the expensive z7 runs.
    """
    import json as _json
    from app.management.commands.stitch_images import TileStitcher

    BASE_DIR   = Path(__file__).resolve().parent.parent
    STATIC_DIR = BASE_DIR / "static"
    metadata   = STATIC_DIR / "tiles" / "tile_metadata.json"
    output_dir = STATIC_DIR / "stitched"
    cache_dir  = output_dir / "cache"
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)

    if not metadata.exists():
        return [{"step": "Pre-flight", "status": "error",
                 "output": "",
                 "error": "tile_metadata.json not found — run Extract first."}]

    with open(metadata) as f:
        tile_data = _json.load(f)

    # Order: floor ascending, then zoom level ascending (z3 before z7)
    floors_sorted = sorted(tile_data.keys())
    combos = [
        (floor, zoom_key)
        for floor in floors_sorted
        for zoom_key in sorted(tile_data[floor].keys(), key=lambda z: int(z[1:]))
    ]
    total  = len(combos)
    report = []

    # Shorter tile timeout — fail fast on missing/expired tiles instead of
    # hanging for 10 s each.
    stitcher = TileStitcher(tile_size=256, cache_enabled=True, tile_timeout=4)

    current_floor = None

    for idx, (floor, zoom_key) in enumerate(combos):
        # Announce floor start
        if floor != current_floor:
            current_floor = floor
            self.update_state(
                state="PROGRESS",
                meta={
                    "current_step": f"── Starting {floor} ──",
                    "step_index": idx + 1,
                    "total_steps": total,
                    "percent": int((idx / total) * 100),
                }
            )

        tile_count = len(tile_data[floor][zoom_key].get("tiles", []))
        self.update_state(
            state="PROGRESS",
            meta={
                "current_step": f"  {floor} {zoom_key}  ({tile_count} tiles)…",
                "step_index": idx + 1,
                "total_steps": total,
                "percent": int((idx / total) * 100),
            }
        )

        try:
            stitcher._process_floor_zoom(
                floor, zoom_key,
                tile_data[floor][zoom_key],
                output_dir,
                cache_dir,
            )
            report.append({"step": f"{floor} {zoom_key}", "status": "success",
                            "output": f"{tile_count} tiles", "error": None})
        except Exception as e:
            report.append({"step": f"{floor} {zoom_key}", "status": "error",
                            "output": "", "error": str(e)})

        # Emit a floor-complete marker after the last zoom level for this floor
        next_floor = combos[idx + 1][0] if idx + 1 < len(combos) else None
        if next_floor != floor:
            zoom_done = sum(1 for r in report if r["step"].startswith(floor))
            errors    = sum(1 for r in report if r["step"].startswith(floor) and r["status"] == "error")
            self.update_state(
                state="PROGRESS",
                meta={
                    "current_step": (
                        f"✔ {floor} complete — {zoom_done} zoom levels"
                        + (f", {errors} errors" if errors else "")
                    ),
                    "step_index": idx + 1,
                    "total_steps": total,
                    "percent": int(((idx + 1) / total) * 100),
                }
            )

    return report


@shared_task(bind=True)
def check_watched_events(self):
    """
    Check all watched events for ticket availability changes.
    Creates in-app Notifications and sends emails when tickets open up.
    """
    from django.core.mail import send_mail
    from django.conf import settings as django_settings
    from app.models.user_watched_event import UserWatchedEvent
    from app.models.notification import Notification

    watched = (
        UserWatchedEvent.objects
        .select_related('user', 'event')
        .filter(event__isnull=False)
    )

    notified = 0
    total = 0
    for watch in watched:
        event = watch.event
        if event is None:
            continue
        total += 1
        tickets_now = (event.tickets_available or 0) > 0

        if tickets_now and not watch.last_known_status:
            message = (
                f'Tickets are now available for "{event.title}" '
                f'(ID: {event.game_id}). '
                f'Tickets available: {event.tickets_available}.'
            )
            Notification.objects.create(user=watch.user, event=event, message=message)

            email = getattr(watch.user, 'email', None)
            if email:
                try:
                    send_mail(
                        subject=f'[Alpha] Tickets available: {event.title}',
                        message=message,
                        from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'alpha@localhost'),
                        recipient_list=[email],
                        fail_silently=True,
                    )
                except Exception:
                    pass

            watch.last_known_status = True
            watch.save(update_fields=['last_known_status', 'last_checked'])
            notified += 1

        elif not tickets_now and watch.last_known_status:
            watch.last_known_status = False
            watch.save(update_fields=['last_known_status', 'last_checked'])

    return {'notified': notified, 'checked': total}