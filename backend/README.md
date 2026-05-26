# Alpha — Gen Con Companion App

A full-stack Django + React application for planning and navigating Gen Con. It pulls event and exhibitor data directly from the Gen Con API, lets users build personal schedules, track vendors in the dealer hall, and navigate between rooms across the convention center.

**Stack:** Django 5 / Django REST Framework · React + TypeScript (Vite) · PostgreSQL · Celery + Redis · Playwright

---

## Table of Contents

1. [Local Setup](#local-setup)
2. [Running the App](#running-the-app)
3. [Environment Variables](#environment-variables)
4. [Services](#services)
5. [Management Commands](#management-commands)
6. [API Endpoints](#api-endpoints)
7. [External Gen Con API Endpoints](#external-gen-con-api-endpoints)

---

## Local Setup

**Prerequisites:** Python 3.11+, Node 18+, PostgreSQL, Redis

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install Playwright browser (needed for schedule sync)
playwright install chromium

# Create the database
createdb alpha

# Run migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser
```

### Frontend

```bash
cd frontend
npm install
```

---

## Running the App

Each of these runs in its own terminal tab.

**Django backend** (http://127.0.0.1:8000)
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**React frontend** (http://localhost:5173)
```bash
cd frontend
npm run dev
```

**Celery worker** (required for data sync and schedule tasks)
```bash
cd backend
source venv/bin/activate
celery -A alpha worker -l info
```

**Celery Beat scheduler** (required for watched-event email alerts)
```bash
cd backend
source venv/bin/activate
celery -A alpha beat -l info
```

**Redis** must be running locally on the default port (6379). On macOS with Homebrew:
```bash
brew services start redis
```

### Useful URLs

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000/admin/ | Django admin |
| http://127.0.0.1:8000/api/ | DRF browsable API root |
| http://127.0.0.1:8000/api/docs/ | Swagger / OpenAPI docs |
| http://localhost:5173 | React frontend |

### Common Django Commands

```bash
python manage.py makemigrations   # generate new migrations
python manage.py migrate          # apply migrations
python manage.py shell            # Django shell (ipython)
python manage.py createsuperuser  # create admin user
```

Aliases (add to your shell profile if desired):
```bash
alias djmm="python manage.py makemigrations"
alias djm="python manage.py migrate"
alias djr="python manage.py runserver"
```

---

## Environment Variables

Create `backend/.env` with the following:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here

# PostgreSQL
DATABASE_URL=postgres://youruser:yourpass@localhost:5432/alpha

# Google Maps (used for geocoding room/location coordinates)
GOOGLE_API_KEY=your-google-maps-api-key

# Gen Con account credentials (used by schedule sync via Playwright)
GENCON_EMAIL=your-gencon-email@example.com
GENCON_PASSWORD=your-gencon-password
```

---

## Services

These live in `app/services/` and contain the core business logic.

### `gencon_auth.py` — GenConAuth

Handles authentication against the Gen Con website using Playwright. Launches a headless Chromium browser, fills in the login form at `gencon.com/users/sign_in`, and returns the session cookies as a header string. Required before making any authenticated Gen Con API calls.

```python
auth = GenConAuth(headless=True)
cookie_header = auth.get_cookie_header(email="you@example.com", password="secret")
```

### `gencon_api.py` — GenConAPI

Wraps authenticated requests to the Gen Con API. Takes the cookie header from `GenConAuth` and provides methods for fetching a user's schedule.

- `get_schedule(contact_id)` — hits `GET /api/v2/schedule?contact_id=<id>&page=1` and returns the user's purchased event list.

### `gencon_client.py` — GenConClient

A simpler authenticated client that uses cookie objects (from Playwright) rather than a raw header string. Used for fetching schedule JSON files directly.

- `get_schedule(schedule_id)` — hits `GET /schedules/<id>.json`.

### `schedule.py` — fetch_user_schedule

Orchestrates the full schedule sync flow for a given user: looks up the user's `gencon_id`, authenticates via `GenConAuth`, calls `GenConAPI.get_schedule`, then calls `sync_user_events` to write the results to the database.

### `user_events_sync.py` — sync_user_events

Takes a raw Gen Con schedule payload and upserts `UserEvent` records. Matches each item in the schedule to a local `Event` record by `game_id`, marks matched events as `purchased`, and returns a report of how many were synced vs. unmatched.

### `path_graph.py` — build_venue_graph / compute_shortest_path

Builds a NetworkX weighted graph representing the walkable connections between rooms and floors of the convention center (ICC, JW Marriott, Lucas Oil Stadium). `compute_shortest_path` runs Dijkstra's algorithm between two named nodes and returns the path and total travel time in seconds.

### `geocode.py` — geocode_address

Calls the Google Maps Geocoding API to convert a street address string into (lat, lng) coordinates. Requires `GOOGLE_API_KEY` in the environment.

### `bulk_geocode.py`

Batch geocoding utility for processing multiple addresses in sequence.

### `gencon_playwright.py` — fetch_user_schedule (Playwright version)

An alternative to `schedule.py` that uses a Playwright-authenticated session. Called by the `/api/schedule/sync/` endpoint.

---

## Management Commands

Run these from `backend/` with the virtualenv active: `python manage.py <command>`

| Command | What it does |
|---------|-------------|
| `download_events` | Downloads the official Gen Con events XLSX from `gencon.com/downloads/events.xlsx`, converts it to CSV, and saves to `app/assets/events.csv` |
| `import_events` | Reads `app/assets/events.csv` and upserts all events into the database, linking each to a `Location` and `Room` |
| `import_locations` | Reads the events CSV and creates `Location` and `Room` records; also creates `TravelConnection` links between rooms in the same location |
| `fetch_vendors` | Paginates through `gencon.com/api/v1/exhibitors` and saves the full result to `app/assets/exhibitors.json` |
| `vendor_extract` | Reads `exhibitors.json` and upserts all vendors into the database with name, booth number, map coordinates, and website |
| `merge_vendors` | Finds case-insensitive duplicate vendor names and merges them — combining booth numbers and tags into the primary record |
| `fetch_vendor_profile` | Paginates through `gencon.com/api/v1/exhibitor_profiles` and saves to `app/assets/exhibitor_profile.json` |
| `assign_tags_to_vendors` | Reads `app/assets/vendor_tagged_playwright.csv` and assigns tag objects to matching vendor records |
| `check_watched_events` | Checks all `UserWatchedEvent` records; if ticket availability has changed, updates the record and sends an email notification |
| `fetch_schedule` | Fetches the schedule for a specific Gen Con event ID |
| `extract_vendor_profile` | Extracts and processes vendor profile data |
| `valid_url` | Validates vendor website URLs |
| `stitch_images` | Stitches map tile images together for floor plan rendering |
| `clear_table` | Truncates a specified database table |
| `clear_user_event_table` | Clears the `UserEvent` join table |

### Vendor Data Pipeline (run in order)

```bash
python manage.py fetch_vendors          # 1. Pull raw exhibitor data → exhibitors.json
python manage.py vendor_extract         # 2. Upsert vendors into DB, write vendor.txt
# 3. Manually convert vendor.txt to full_vendor_list.csv and add URL column
python manage.py fetch_vendor_profile   # 4. Pull exhibitor profiles → exhibitor_profile.json
# 5. Run scrape_vendor.py to generate vendor_tagged_playwright.csv (Playwright batch tagging)
python manage.py assign_tags_to_vendors # 6. Apply tags from CSV to vendor records
python manage.py merge_vendors          # 7. Collapse duplicate vendor entries
```

### Event Data Pipeline (run in order)

```bash
python manage.py download_events  # 1. Download XLSX → events.csv
python manage.py import_locations # 2. Create Location + Room records
python manage.py import_events    # 3. Import all events, linked to rooms/locations
```

---

## API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

All endpoints use session-based authentication. Login first via `POST /api/login/`.

### Authentication

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/login/` | Log in with `username` + `password`. Sets session cookie. |
| POST | `/api/logout/` | Clears the session. |
| GET | `/api/me/` | Returns the currently authenticated user. |

### Events

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/events/` | List all events. Supports filtering, search, and ordering. |
| GET | `/api/events/<game_id>/` | Retrieve a single event by its Gen Con game ID (e.g. `BGM25ND272869`). |
| POST | `/api/events/` | Create a new event (auth required). Also auto-creates a `UserEvent` with status `wishlist`. |
| PATCH/PUT | `/api/events/<game_id>/` | Update an event. |
| DELETE | `/api/events/<game_id>/` | Delete an event. |

**Event filter parameters** (append to `?` on the list endpoint):

| Param | Type | Example |
|-------|------|---------|
| `title` | string (contains) | `?title=dragon` |
| `event_type` | string (multi) | `?event_type=BGM&event_type=RPG` |
| `game_system` | string (multi) | `?game_system=D%26D` |
| `gaming_group` | string (multi) | `?gaming_group=Wizards` |
| `location` | string (multi) | `?location=Indiana+Convention+Center` |
| `day` | string (multi) | `?day=Thursday&day=Friday` |
| `start_time` | time string | `?start_time=2:00 PM` |
| `cost` | range | `?cost_min=0&cost_max=5` |
| `tournament` | boolean | `?tournament=true` |
| `tickets_available` | number | `?tickets_available=1` |
| `search` | full-text | `?search=lightning+train` |
| `ordering` | field name | `?ordering=start_time` or `?ordering=-title` |

### User Events (Personal Schedule)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/user_events/` | List the current user's event entries. |
| POST | `/api/user_events/` | Add an event to the user's schedule with a status (`wishlist`, `purchased`, etc.). |
| PATCH | `/api/user_events/<id>/` | Update status of a user event. |
| DELETE | `/api/user_events/<id>/` | Remove from schedule. |

### Watched Events (Ticket Alerts)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/user-watched-events/` | List events the user is watching for ticket availability. |
| POST | `/api/user-watched-events/` | Watch an event. Will trigger email when tickets open up. |
| DELETE | `/api/user-watched-events/<id>/` | Stop watching an event. |

### Vendors

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/vendors/` | List all vendors. Public, no auth required. |
| GET | `/api/vendors/<gencon_id>/` | Retrieve a single vendor by their Gen Con numeric ID. |

### User Vendors (Dealer Hall Tracker)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/user_vendors/` | List vendors the user has saved. |
| POST | `/api/user_vendors/` | Save a vendor to the user's list. |
| DELETE | `/api/user_vendors/<id>/` | Remove a vendor from the user's list. |

### Vendor Visits

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/vendor_visits/` | List all vendor visit records. |
| POST | `/api/vendor_visits/` | Log a visit to a vendor booth. |

### Tags

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/tags/` | List all vendor tags. |
| POST | `/api/tags/` | Create a new tag. |

### Calendar Events

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/calendar_events/` | List calendar events (personal scheduling layer). |
| POST | `/api/calendar_events/` | Create a calendar entry. |
| PATCH | `/api/calendar_events/<id>/` | Update a calendar entry. |
| DELETE | `/api/calendar_events/<id>/` | Delete a calendar entry. |

### Locations, Rooms, Entrances

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/locations/` | List all convention center locations (ICC, JW Marriott, Lucas Oil). |
| GET | `/api/rooms/` | List all rooms, linked to their parent location. |
| GET | `/api/entrance/` | List building entrances (used for navigation). |

### Users & Related Users

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/users/` | List users. |
| GET | `/api/users/<id>/` | Retrieve a user profile. |
| GET | `/api/related_users/` | List users linked to the current account (e.g. group members). |

### Search

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/event-search/?q=<query>` | Full-text search of local events by title, group, game ID, or location. Minimum 3 characters. Returns up to 20 results. |
| GET | `/api/gencon-event-search/?search=<query>` | Proxies a search query directly to the live Gen Con event search API. Returns live results. |

### Data Sync

These are admin-only endpoints that trigger Celery tasks.

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/data-sync/trigger/` | Starts the full data sync pipeline as a background task (admin only). Returns a `task_id`. |
| GET | `/api/data-sync/status/<task_id>/` | Polls the status of a running sync task. Returns state (`PENDING`, `PROGRESS`, `SUCCESS`, `FAILURE`) and step-by-step progress. |
| POST | `/api/schedule/sync/` | Authenticates with Gen Con via Playwright and syncs the current user's purchased events into their local schedule. |

### Schedule

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/fetch-schedule/<gencon_id>/` | Fetches and returns the schedule for a given Gen Con contact ID (auth required). |

### Map Tile Proxy

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/proxy/tiles/<floor>/<zoom>/<x>/<y>.png` | Proxies and caches map tiles from the Gen Con CDN. Tiles are validated against an allowlist before fetching. Cached for 24 hours. |

### Other

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/upload/` | Upload a CSV file for bulk data import. |
| GET | `/api/docs/` | Swagger/OpenAPI interactive documentation. |

---

## External Gen Con API Endpoints

These are the public/semi-public Gen Con endpoints the app hits directly.

---

### `GET https://www.gencon.com/api/v1/exhibitors?page=<n>`

Paginated list of all exhibitors (dealer hall vendors) for the current convention year. Used by `fetch_vendors`.

**Response shape:**
```json
{
  "total_count": 741,
  "convention_id": 27,
  "has_more": true,
  "next_path": "/api/v1/exhibitors?page=2",
  "records": [
    {
      "_id": "17585",
      "_source": {
        "id": 17585,
        "name": "1985 Games",
        "state": "active",
        "geometry": "Polygon",
        "floor_level": 1,
        "convention_id": 27,
        "searchable_name": "1985 Games, booth #1637",
        "searchable_category": "Exhibitors",
        "booth_num": "1637",
        "map_location": "/map?c=27&f=1&lg=38.73779296875001&lt=19.228176737766262&s=17585&z=4",
        "latlng": [
          [38.73779296875001, "19.228176737766262"],
          [38.73779296875001, 20.05593126519445],
          [40.49560546875001, 20.05593126519445],
          [40.49560546875001, "19.228176737766262"]
        ],
        "map_feature": {
          "type": "Feature",
          "properties": {
            "name": "1985 Games",
            "number": "1637",
            "names": [
              { "name": "1985 Games", "website": "https://obojima.com" }
            ],
            "category": "Booth",
            "contactid": 438196,
            "icon": "shopping-cart",
            "markerColor": "darkred"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[38.737, "19.228"], [38.737, 20.055], [40.495, 20.055], [40.495, "19.228"]]]
          }
        }
      }
    }
  ]
}
```

Key fields extracted by `vendor_extract`:
- `_source.name` — vendor name
- `_source.booth_num` — booth number
- `_source.latlng` — polygon coordinates used to calculate map pin (averaged to center point)
- `_source.map_location` — relative URL to the vendor's map position
- `_source.map_feature.properties.names[0].website` — vendor website

---

### `GET https://www.gencon.com/api/v1/exhibitor_profiles?c=27&page=<n>&per_page=25`

Returns richer exhibitor profile data including tags, avatar, and location label. Used by `fetch_vendor_profile`. The `c=27` parameter is the convention ID for Gen Con 2025.

**Response shape:**
```json
[
  {
    "id": 11403,
    "name": "1985 Games",
    "title": null,
    "avatarUrl": "https://d2lkgynick4c0n.cloudfront.net/avatars/17379/large.png",
    "exhibitorType": "Exhibitors",
    "locations": [
      {
        "navigateTo": "/map?c=27&f=1&lg=38.73779296875001&lt=19.228176737766262&s=17585&z=4",
        "label": "Exhibit Hall : Booth 1637"
      }
    ],
    "tags": [
      "Game Accessories",
      "Role-Playing Games"
    ],
    "contactId": 438196,
    "profileId": 20939,
    "isSponsor": false
  }
]
```

Key fields:
- `tags` — used for the vendor tagging pipeline
- `avatarUrl` — exhibitor logo image
- `locations[].label` — human-readable booth location string
- `isSponsor` — whether this exhibitor is a convention sponsor

---

### `GET https://www.gencon.com/api/event_search?search=<query>`

Live event search on the Gen Con website. Proxied by the local `/api/gencon-event-search/` endpoint. Accepts either a game ID (e.g. `BGM25ND272869`) or a title string.

**Example:** `https://www.gencon.com/api/event_search?search=BGM25ND272869`

**Response shape:**
```json
[
  {
    "id": "BGM25ND272869",
    "title": "Lightning Train - Gen Con Premiere!",
    "event_type": "BGM",
    "start_datetime": "2025-08-14T10:00:00",
    "end_datetime": "2025-08-14T14:00:00",
    "location": "Indiana Convention Center",
    "room": "Hall E",
    "tickets_available": 0,
    "cost": 4.00,
    "game_system": "Custom",
    "gm": "John Smith"
  }
]
```

---

### `GET https://www.gencon.com/downloads/events.xlsx`

The official event catalog for the current Gen Con year as an Excel file. Downloaded by `download_events`, converted to CSV, and used as the source of truth for all event imports.

Columns used during import:
`Game ID`, `Group`, `Title`, `Short Description`, `Long Description`, `Event Type`, `Game System`, `Rules Edition`, `Minimum Players`, `Maximum Players`, `Age Required`, `Experience Required`, `Materials Required`, `Start Date & Time`, `End Date & Time`, `Duration`, `GM Names`, `Website`, `Email`, `Tournament?`, `Round Number`, `Total Rounds`, `Attendee Registration?`, `Cost $`, `Location`, `Room Name`, `Table Number`, `Special Category`, `Tickets Available`, `Last Modified`

---

### `GET https://www.gencon.com/api/v2/schedule?contact_id=<id>&page=1`

Returns the list of events purchased by a specific Gen Con user. Requires an authenticated session cookie (obtained via `GenConAuth`). Used by the schedule sync flow.

**Response shape:**
```json
{
  "data": [
    {
      "event_id": "272869",
      "title": "Lightning Train - Gen Con Premiere!",
      "start_datetime": "2025-08-14T10:00:00",
      "status": "purchased"
    }
  ]
}
```

The `event_id` value is matched against the trailing digits of local `game_id` values (e.g. `BGM25ND272869`) to link purchased events to local records.

---

### `GET https://d2lkgynick4c0n.cloudfront.net/maps/v7/<floor>/<zoom>/<x>/<y>.png`

Gen Con's CloudFront CDN serving map tile images for the convention center floor plans. Proxied and cached locally by the `/proxy/tiles/` endpoint. Tiles are validated against a pre-built allowlist (`static/tiles/tile_urls_valid.txt`) before being fetched.

---

*For interactive API documentation, visit http://127.0.0.1:8000/api/docs/ while the backend is running.*
