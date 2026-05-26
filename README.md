# Alpha — Gen Con Planning Tool

Personal convention planning tool for Gen Con. Django 5.2 + DRF backend, React + TypeScript + Vite frontend, Celery + Redis for async tasks, Playwright for authenticated scraping.

---

## Quick Start

Four processes need to be running:

```bash
# 1 — Django dev server
cd backend && python manage.py runserver

# 2 — React frontend
cd frontend && npm run dev

# 3 — Celery worker (required for data sync and map pipeline)
cd backend && celery -A alpha worker --loglevel=info

# 4 — Celery beat (scheduled tasks)
cd backend && celery -A alpha beat --loglevel=info
```

**Prerequisites:** PostgreSQL running, Redis running, `.env` in `backend/` with `DATABASE_URL`, `REDIS_URL`, and `SECRET_KEY`.

---

## Architecture

| Layer | Stack |
|---|---|
| Backend | Django 5.2, Django REST Framework |
| Database | PostgreSQL |
| Async tasks | Celery 5.x + Redis |
| Frontend | React 18, TypeScript, Vite |
| Scraping | Playwright (authenticated) |
| Pathfinding | NetworkX |
| Map | Leaflet (CRS.Simple, pixel-space) |

---

## API Endpoints

### Auth
| Method | URL | Description |
|---|---|---|
| POST | `/api/token/` | Obtain JWT token pair |
| POST | `/api/token/refresh/` | Refresh JWT |

### Data
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/events/` | Event list / create |
| GET/PATCH | `/api/events/<id>/` | Event detail / update |
| GET/POST | `/api/vendors/` | Vendor list / create |
| GET/POST | `/api/locations/` | Location list |
| GET/POST | `/api/rooms/` | Room list |
| GET/POST | `/api/user_events/` | User schedule entries |
| GET/POST | `/api/calendar_events/` | Calendar events |
| GET/POST | `/api/related_users/` | People attending with a user |
| GET/POST | `/api/user-watched-events/` | Watched / waitlisted events |
| GET/POST | `/api/vendor_visits/` | Vendor visit notes |
| GET/POST | `/api/user_vendors/` | User vendor bookmarks |
| GET/POST | `/api/tags/` | Vendor tags |
| GET | `/api/event-search/` | Event full-text search |

### Data Sync (admin only)
| Method | URL | Description |
|---|---|---|
| POST | `/api/data-sync/trigger/` | Start full data sync Celery task |
| GET | `/api/data-sync/status/<task_id>/` | Poll sync task status / progress |
| GET | `/api/worker/status/` | Check Redis + Celery worker health |
| POST | `/api/worker/start/` | Start Celery worker subprocess |

### Map Tile Pipeline (admin only)
| Method | URL | Description |
|---|---|---|
| GET | `/api/map-pipeline/status/` | Check HAR file, metadata, and stitched image presence |
| POST | `/api/map-pipeline/extract/` | Run map_extract + json_map (Step 1) |
| POST | `/api/map-pipeline/stitch/` | Run stitch_images (Step 2, requires metadata) |

### Schedule
| Method | URL | Description |
|---|---|---|
| GET | `/api/fetch-schedule/<gencon_id>/` | Fetch raw Gen Con schedule |
| POST | `/api/schedule/sync/` | Sync authenticated user's Gen Con schedule |

---

## Management Commands

### Data import
```bash
python manage.py download_events      # Download events XLSX → CSV
python manage.py fetch_vendors        # Fetch vendor pages from Gen Con
python manage.py import_locations     # Import locations and rooms
python manage.py import_events        # Import events into DB
python manage.py vendor_extract       # Extract & upsert vendors
python manage.py merge_vendors        # Merge duplicate vendor records
python manage.py fetch_schedule       # Fetch a user's Gen Con schedule
```

### Map tile pipeline
```bash
# Step 0: Place gencon*.har.json in backend/static/ (capture HAR from gencon.com/map)

# Step 1: Extract tile URLs + build metadata
python manage.py map_extract          # Parse HAR → tile_urls_floor-*.txt
python manage.py json_map             # tile_urls_valid.txt → tile_metadata.json

# Step 2: Download + stitch
python manage.py stitch_images \
  --metadata_path backend/static/tiles/tile_metadata.json \
  --output_dir backend/static/stitched/
# Optional flags: --floors floor-1 floor-2  --zoom_keys z5 z7  --no_cache
```

These three steps can also be triggered from the **Data Sync page** in the UI (admin only).

### Utilities
```bash
python manage.py assign_tags_to_vendors
python manage.py merge_rooms
python manage.py clear_table <model>
python manage.py clear_user_event_table
python manage.py check_watched_events
```

---

## Data Pipelines

### Full data sync (Celery)

Triggered via the Data Sync page or `POST /api/data-sync/trigger/`. Runs sequentially:

1. `download_events` — Downloads the Gen Con events spreadsheet
2. `fetch_vendors` — Scrapes vendor/exhibitor pages
3. `import_locations` — Upserts locations and rooms
4. `import_events` — Imports event records
5. `vendor_extract` — Extracts and upserts vendor records
6. `merge_vendors` — Deduplicates vendors by name

### Map tile pipeline (Celery)

Triggered from the **Map Tile Pipeline** section of the Data Sync page.

**Step 1 — Extract** (`POST /api/map-pipeline/extract/`)
1. `map_extract` — Reads `gencon*.har.json` from `backend/static/`, parses CloudFront tile URLs, writes `static/tiles/tile_urls_floor-*.txt`
2. `json_map` — Reads `tile_urls_valid.txt`, builds `static/tiles/tile_metadata.json`

**Step 2 — Stitch** (`POST /api/map-pipeline/stitch/`)  
Reads `tile_metadata.json`, downloads each tile from `d2lkgynick4c0n.cloudfront.net/maps/v7/`, and stitches them into `static/stitched/floor-{n}_z{zoom}.png`. Tiles are cached locally to avoid re-downloading.

#### Capturing a new HAR file
1. Open gencon.com/map in Chrome
2. Open DevTools → Network tab
3. Pan and zoom through all floors at all resolutions to trigger tile loads
4. Export HAR → save as `backend/static/gencon-<year>.har.json`
5. Run Step 1 and Step 2 from the Data Sync page

---

## Map Coordinate System

The map uses Leaflet with `CRS.Simple` (no geographic projection). All coordinates are pixel-space.

| Zoom | Image size | Tiles |
|---|---|---|
| z3 | 2048 × 2048 | 8 × 8 |
| z4 | 4096 × 4096 | 16 × 16 |
| z5 | 8192 × 8192 | 32 × 32 |
| z6 | 16384 × 13056 | 64 × 51 |
| z7 | 32768 × 16640 | 128 × 65 |

**Vendor coordinates** (`map_x`, `map_y`) are stored as z7 tile coordinates from the Gen Con exhibitors API (`latlng` field — average of polygon corners). The formula to render them is `pixel = tile_coord × 256`. `GenConMap.tsx` achieves this by dividing against the z7 tile counts `BASE_DIMS = [128, 65]` rather than pixel dimensions, so `scaleX = imgW / 128 = 256` at z7 and scales correctly at every other zoom level. Y-axis is flipped for Leaflet CRS.Simple: `lat = -(mapY * scaleY)`, `lng = mapX * scaleX`.

**Location coordinates** (`base_latitude`, `base_longitude`) are set via the Django admin map picker and stored as pixel coordinates in z7-space.

---

## Color Palette

User and RelatedUser color options:

| Name | Hex |
|---|---|
| Amber | `#f59e0b` (default) |
| Orange | `#fb923c` |
| Rose | `#f87171` |
| Indigo | `#818cf8` |
| Violet | `#a78bfa` |
| Emerald | `#34d399` |
| Sky | `#38bdf8` |

Calendar event type colors: Gen Con events use the user's chosen color, vendor visits use Teal (`#0f766e`), custom events use Violet (`#a78bfa`). Legacy DB values (neon palette from early development) are remapped client-side via `resolveColor()` in `UserDetail.tsx`.

---

## Frontend Components

| Component | Location | Notes |
|---|---|---|
| Dashboard | `User/UserDetail.tsx` | Calendar + schedule overview |
| Dashboard Calendar | `User/Calendar.tsx` | react-big-calendar, agenda/week/day views, click-to-modal |
| Schedule | `Calendars/CombinedCalendar.tsx` + `Calendar2.tsx` | FullCalendar, multi-user color-coded |
| Map | `Map/GenConMap.tsx` | Leaflet CRS.Simple, floor/zoom selector, vendor pins |
| Event Modal | `Shared/Modal.tsx` | MUI Dialog, status chip, location/room/attendees |
| Data Sync | `Shared/DataSyncPage.tsx` | Data sync + map tile pipeline with live terminal output |
| Vendor List | `Vendors/VendorList.tsx` | Browsable vendor catalog |

---

## Django Admin

### Performance notes

`UserAdmin` uses `TabularInline` (not `StackedInline`) for all sub-records to reduce HTML volume. `filter_horizontal` is removed from `UserEventInline`; related users are shown read-only with a change link instead. All inlines implement `get_queryset()` with `select_related`/`prefetch_related` to avoid N+1 queries. The parent `UserAdmin.get_queryset()` prefetches all inline data in a single pass.

### Map picker

`LocationAdmin`, `RoomAdmin`, and `EntranceAdmin` use `MapPickerMixin` which injects Leaflet into the change form so you can click to set coordinates.

---

## Gen Con External API Examples

```
# Events list
https://www.gencon.com/api/events?convention=26&page_size=100

# Exhibitors
https://www.gencon.com/api/convention_exhibitors?convention=26&page_size=100

# Map tiles (CloudFront CDN)
https://d2lkgynick4c0n.cloudfront.net/maps/v7/floor-1/7/64/32.png
# Pattern: /maps/v7/{floor}/{zoom}/{x}/{y}.png

# Convention IDs: 26 = Gen Con 2025, 27 = Gen Con 2026 (expected)
```

---

## Pending Map Work

### Part 2 — Populate Location coordinates

1. Obtain the new stitched map images (run the map tile pipeline above for the 2026 convention).
2. Open Django admin → Locations.
3. For each Location (Indiana Convention Center, JW Marriott, Hyatt Regency, etc.):
   - Open the change form.
   - Use the map picker to click the building's position on the floor plan.
   - Save. This sets `base_latitude` and `base_longitude` in z7 pixel-space.
4. Verify that the coordinates display correctly in `GenConMap.tsx` (if building overlays are added later).

### Part 3 — Vendor booth pins on the map

The vendor coordinate transformation needs calibration before pins will render in the correct positions.

1. **Calibrate the coordinate transform.** Pick 3–4 vendors with clearly identifiable booth numbers visible on the stitched map image. Open `backend/static/stitched/floor-1_z7.png` in an image viewer, note the pixel X/Y for each booth. Compare against the `map_x`/`map_y` values stored in the DB (`SELECT name, booth_number, map_x, map_y FROM app_vendor LIMIT 20;`). Derive the scale constants (likely `pixel = tile_coord * 256` or a linear transform from the API's latlng range to z7 pixel range).

2. **Write a management command** `transform_vendor_coords` that applies the calibrated formula to all vendor records and updates `map_x`/`map_y` to z7 pixel-space. Run it once after calibration. When 2026 vendor data is re-synced, apply the same transform in `vendor_extract`.

3. **Add vendor sidebar to `GenConMap.tsx`.** The map already renders clickable pins with tooltips. Replace the `Tooltip` with an `onClick` handler that sets `selectedVendor` state. Add a `VendorSidebar` component (MUI `Drawer` anchored right, or a fixed panel) showing: vendor name, booth number, tags, description, website link, and a "View Details" link to the vendor detail page.

4. **Re-sync 2026 vendor data.** Once Gen Con publishes 2026 exhibitor data, run `python manage.py fetch_vendors` followed by `python manage.py vendor_extract` to pull fresh coordinates.
