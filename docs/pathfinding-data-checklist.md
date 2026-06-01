# Pathfinding Data Checklist

Reference document for completing the data needed to make cross-building routing work.
Fill in coordinates using the **Pick coords** mode on the Alpha map (floor/resolution as noted),
or look up real-world coords in Google Maps.

---

## 1. Real-World Coordinates (rw_lat / rw_lng)

These are needed for **outdoor routing** between buildings.
All values are WGS-84 decimal degrees (Google Maps format: `39.xxxxxx, -86.xxxxxx`).

Enter values in `load_building_exits.py` under the appropriate location.

### ICC — Exits missing rw coords

| Room Name | Floor | rw_lat | rw_lng | Notes |
|---|---|---|---|---|
| ICC Maryland St Entrance (W) | 1 | | | West end of Maryland St face |
| ICC Maryland St Entrance (Hall J) | 1 | | | |
| ICC Maryland St Entrance (Hall I) | 1 | | | |
| ICC Maryland St Entrance (E) | 1 | | | East end of Maryland St face |
| ICC Capitol Ave Entrance (S) | 1 | | | |
| ICC Capitol Ave Entrance (Mid) | 1 | | | |
| ICC Capitol Ave Entrance (N) | 1 | | | |
| ICC Food Truck Entrance | 1 | | | North face, near food trucks |
| ICC Exhibit Hall D Entrance | 1 | | | |
| ICC Exhibit Hall H Entrance | 1 | | | |
| ICC Skywalk to Hyatt / Le Meridien / Omni Severin / Embassy Suites | 2 | | | Skywalk — rw coord = street-level equivalent or leave null |
| ICC Skywalk to Westin | 2 | | | |
| ICC Skywalk to Marriott Downtown | 2 | | | |
| ICC Skywalk to JW Marriott | 2 | | | |
| ICC Basement Tunnel to Lucas Oil Stadium | 0 | | | Underground — rw coord = approximate street-level entry |

> **Note on skywalks:** Skywalks don't have a precise real-world ground coordinate.
> Options: (a) use the nearest street intersection, (b) leave null and rely on indoor
> graph to route within each building, connecting at the shared skywalk node.

### Crowne Plaza

| Room Name | Floor | rw_lat | rw_lng | Notes |
|---|---|---|---|---|
| Crowne Plaza Main Entrance | 1 | | | |
| Crowne Plaza Skywalk to ICC | 2 | | | |
| Crowne Plaza Skywalk to Union Station | 2 | | | |

### Omni

| Room Name | Floor | rw_lat | rw_lng | Notes |
|---|---|---|---|---|
| Omni Severin Entrance (N) | 1 | | | |
| Omni Severin Entrance (S) | 1 | | | |

### JW Marriott

| Room Name | Floor | rw_lat | rw_lng | Notes |
|---|---|---|---|---|
| JW Marriott Entrance (W) | 1 | | | |
| JW Marriott Entrance (E) | 1 | | | |
| JW Marriott Room 104 | 1 | | | Not an exterior door — leave rw null? |

### Lucas Oil Stadium

| Room Name | Floor | rw_lat | rw_lng | Notes |
|---|---|---|---|---|
| Lucas Oil Stadium Main Entrance | 1 | | | |
| Lucas Oil Stadium Field Entrance | 1 | | | |
| Lucas Oil Stadium West Club Lounge | 2 | | | Interior — leave rw null? |
| Lucas Oil Stadium East Club Lounge | 2 | | | Interior — leave rw null? |

---

## 2. Location Name Verification

The `load_building_exits.py` command looks up each location by exact name.
Confirm the names below match your Location table
(`python manage.py shell -c "from app.models.location import Location; print(list(Location.objects.values_list('name', flat=True)))"`)

| Key in load_building_exits.py | Confirmed DB name | Match? |
|---|---|---|
| `ICC` | | |
| `Crowne Plaza` | | (hotel brand is "Crowne" not "Crown") |
| `Omni` | | |
| `JW Marriott` | | |
| `Lucas Oil Stadium` | | |

---

## 3. Floor Level Review

Verify these floor assignments reflect how the Gen Con map labels each space.
Correct in `load_building_exits.py` if wrong.

| Room Name | Current Floor | Correct Floor | Notes |
|---|---|---|---|
| Lucas Oil Stadium West Club Lounge | 2 | | Club level may be labeled differently |
| Lucas Oil Stadium East Club Lounge | 2 | | |
| Lucas Oil Stadium Field Entrance | 1 | | Field level = floor 1? |
| ICC Basement Tunnel to Lucas Oil Stadium | 0 | | Is this shown on basement map? |
| Crowne Plaza Skywalk to ICC | 2 | | Confirm skywalk is on floor 2 |
| Crowne Plaza Skywalk to Union Station | 2 | | |

---

## 4. Gen Con Map Coords Still Missing

These exits are in the DB with `longitude = NULL`. Use the **Pick coords** tool on the
Alpha map to capture them. Note the floor and resolution to use when picking.

| Room Name | Suggested Floor | Suggested Zoom |
|---|---|---|
| ICC Maryland St Entrance (W) | 1 | z5–z6 |
| ICC Maryland St Entrance (Hall J) | 1 | z5–z6 |
| ICC Maryland St Entrance (Hall I) | 1 | z5–z6 |
| ICC Maryland St Entrance (E) | 1 | z5–z6 |
| ICC Capitol Ave Entrance (S) | 1 | z5–z6 |
| Crowne Plaza Main Entrance | 1 | z5 |
| Crowne Plaza Skywalk to ICC | 2 | z5 |
| Crowne Plaza Skywalk to Union Station | 2 | z5 |
| Omni Severin Entrance (N) | 1 | z5 |
| Omni Severin Entrance (S) | 1 | z5 |
| JW Marriott Entrance (W) | 1 | z5 |
| JW Marriott Entrance (E) | 1 | z5 |
| JW Marriott Room 104 | 1 | z5 |

> Note: Maryland St / Capitol Ave entrances are on the floor-1 map.
> Skywalks are on the floor-2 map.

---

## 5. Missing Venues / Hotels

These Gen Con venues may need Location records + exit data added.

| Venue | Status | Notes |
|---|---|---|
| Hyatt Regency | Room spaces extracted (22), exits not added | Add hotel entrances + skywalk ICC side already done |
| Le Meridien | No data | Near Hyatt, shares ICC skywalk |
| Embassy Suites | No data | Near Hyatt, shares ICC skywalk |
| Westin | No data | Has ICC skywalk — exits not added |
| Indianapolis Marriott Downtown | No data | "Skywalk to Marriott Downtown" in ICC |
| Union Station | No data | Crowne Plaza skywalk endpoint |
| Sagamore Ballroom | No data | Check if Gen Con uses this venue |

---

## 6. Pathfinding Dev — Remaining Work

Once data is filled in above, these dev tasks remain.

### 6a. Pathfinding API endpoint

Create `POST /pathfind/` (or `GET /pathfind/?from=room_12&to=vendor_5`):
- Load/rebuild the cached graph
- Call `pathfinder.find_path()`
- Return JSON: `{ path: [...node ids...], segments: [...], total_metres: 412 }`

File to create: `backend/app/views/pathfind_view.py`
Wire into: `backend/app/urls.py`

### 6b. Graph rebuild on data change

Options:
- Celery task: `rebuild_pathfinding_graph` triggered after `load_building_exits` or geo_elements import
- Or: lazy rebuild — check graph cache mtime vs latest Room/Vendor update, rebuild if stale

### 6c. Frontend route display

On the map, given a path response:
- Draw a `Polyline` connecting the sequence of Gen Con map coords
- Color segments by `edge_type`: amber = indoor, red-orange = outdoor
- Show total distance in a banner

### 6d. Indoor graph density

The current graph connects nodes within 20 Gen Con units (~40m). For buildings with
sparse Room data (hotels with few `geo_elements` spaces loaded), the graph will be
disconnected. Fix options:
- Load more spaces from geo_elements for each hotel floor
- Manually add intermediate waypoint nodes (hallways, elevators)
- Increase `INDOOR_THRESHOLD` for hotel buildings that have fewer nodes

### 6e. Multi-floor routing

Currently there are no staircase/elevator edges between floors.
Add `vertical_connector` rooms (stairs, elevators) per building with edges between
the same node at different floor levels, weighted by estimated climb time (~5m/floor).

### 6f. Tuning GENCON_METERS_PER_UNIT

The current value of `2.0` is a rough estimate. To calibrate:
1. Pick two ICC exits with known rw coords (e.g., Hall A and Hall K)
2. Measure their Haversine distance in real metres
3. Measure their Gen Con Euclidean distance
4. `GENCON_METERS_PER_UNIT = haversine / gencon_distance`

---

## 7. Testing Commands

```bash
# Verify all location names match DB
python manage.py shell -c "from app.models.location import Location; print(list(Location.objects.values_list('name', flat=True)))"

# Load / reload exits (dry run first)
python manage.py load_building_exits --dry-run
python manage.py load_building_exits

# Build and inspect the pathfinding graph
python manage.py build_pathfinding_graph --stats
python manage.py build_pathfinding_graph --list-exits

# Test a route (replace IDs with real room IDs from your DB)
python manage.py build_pathfinding_graph --test-route room_<id> room_<id>

# Check which exits have outdoor edges (i.e., have rw coords + cross-building pairs)
python manage.py build_pathfinding_graph --list-exits
```
