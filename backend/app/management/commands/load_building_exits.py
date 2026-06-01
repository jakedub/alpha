"""
Management command to load building exit/entrance points for all Gen Con venues.

Gen Con map coordinates (longitude/latitude) were captured using the
coordinate picker on the Alpha map. Real-world coordinates (real_world_latitude/
real_world_longitude) are WGS-84 decimal degrees.

Location names must exactly match rows in the Location table — run
import_locations first. Locations that are not yet in the DB are skipped
with a warning rather than aborting the whole run.

Run:
    python manage.py load_building_exits [--dry-run]
"""
from django.core.management.base import BaseCommand
from app.models.location import Location
from app.models.room import Room

# ── Exit data by location ──────────────────────────────────────────────────────
# gencon_lng / gencon_lat  = Gen Con map coordinates from the coordinate picker
# rw_lat / rw_lng          = real-world WGS-84 (Google Maps) — None if unknown
# floor                    = floor level on the Gen Con map
#                            0 = basement, 1 = ground, 2 = skywalk level, etc.

EXITS_BY_LOCATION = {

    # ── Indiana Convention Center ──────────────────────────────────────────────
    'ICC': [

        # ── Maryland Street exits (north face, real-world) ──────────────────
        # Maryland St runs E-W along the NORTH side of ICC in real life.
        # The Gen Con map is south-up, so this face appears at the bottom of
        # the screen (low Gen Con lat ~-40). E/W labels are correct.
        {
            'name': 'ICC Maryland St Entrance (W)',
            'floor': 1,
            'gencon_lng': -1.625977,  'gencon_lat': -41.608588,
            'rw_lat': 39.765539,      'rw_lng': -86.166501,  # NW corner, West St intersection
        },
        {
            'name': 'ICC Maryland St Entrance (Hall J)',
            'floor': 1,
            'gencon_lng': 14.194336,  'gencon_lat': -39.322451,
            'rw_lat': 39.765686,      'rw_lng': -86.166092,
        },
        {
            'name': 'ICC Maryland St Entrance (Hall I)',
            'floor': 1,
            'gencon_lng': 31.860352,  'gencon_lat': -41.411168,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            'name': 'ICC Maryland St Entrance (E)',
            'floor': 1,
            'gencon_lng': 103.754883, 'gencon_lat': -38.584394,
            'rw_lat': None,           'rw_lng': None,
        },

        # ── Capitol Avenue exits (east face) ────────────────────────────────
        # Capitol Ave runs N-S along the EAST face of ICC. Gen Con map is
        # south-up, so the real-world north end (near Maryland St) appears at
        # the bottom (low Gen Con lat) and the south end appears at the top.
        # Labels reflect real-world direction: (N) = near Maryland St.
        {
            'name': 'ICC Capitol Ave Entrance (N)',
            'floor': 1,
            'gencon_lng': 2.856445,   'gencon_lat': -28.345502,
            'rw_lat': 39.765297,      'rw_lng': -86.162801,
        },
        {
            'name': 'ICC Capitol Ave Entrance (Mid)',
            'floor': 1,
            'gencon_lng': -6.196289,  'gencon_lat': 8.181607,
            'rw_lat': 39.764786,      'rw_lng': -86.162358,
        },
        {
            'name': 'ICC Capitol Ave Entrance (S)',
            'floor': 1,
            'gencon_lng': -5.449219,  'gencon_lat': 58.235276,
            'rw_lat': 39.762898,      'rw_lng': -86.162030,
        },

        # ── Food Truck entrance (south face, real-world) ─────────────────────
        # Appears near the top of the Gen Con map (high lat ~58) = real-world south.
        {
            'name': 'ICC Food Truck Entrance',
            'floor': 1,
            'gencon_lng': -2.065430,  'gencon_lat': 58.188984,
            'rw_lat': 39.761956,      'rw_lng': -86.162740,
        },

        # ── Exhibit Hall exterior doors ───────────────────────────────────────
        # The ICC exhibit halls run roughly N-S. Their exterior entrance doors
        # face the street depending on which hall — verify face (north/south/east)
        # visually on the Alpha map once pins are loaded.
        # Hall letters follow Gen Con's labelling; D and H share map positions
        # with adjacent halls (interior-facing transition points).
        {
            'name': 'ICC Exhibit Hall A Entrance',
            'floor': 1,
            'gencon_lng': 104.062500, 'gencon_lat': -26.037771,
            'rw_lat': 39.765056,      'rw_lng': -86.166444,
        },
        {
            'name': 'ICC Exhibit Hall B Entrance',
            'floor': 1,
            'gencon_lng': 88.813477,  'gencon_lat': -25.958785,
            'rw_lat': 39.765028,      'rw_lng': -86.165806,
        },
        {
            'name': 'ICC Exhibit Hall C Entrance',
            'floor': 1,
            'gencon_lng': 70.356445,  'gencon_lat': -25.800656,
            'rw_lat': 39.764889,      'rw_lng': -86.164972,
        },
        {
            'name': 'ICC Exhibit Hall D Entrance',
            'floor': 1,
            'gencon_lng': 54.008789,  'gencon_lat': -26.077243,
            'rw_lat': 39.764944,      'rw_lng': -86.164361,
        },
        {
            'name': 'ICC Exhibit Hall E Entrance',
            'floor': 1,
            'gencon_lng': 52.866211,  'gencon_lat': -17.003462,
            'rw_lat': 39.764750,      'rw_lng': -86.164278,
        },
        {
            'name': 'ICC Exhibit Hall F Entrance',
            'floor': 1,
            'gencon_lng': 67.126465,  'gencon_lat': 0.372103,
            'rw_lat': 39.764750,      'rw_lng': -86.164278,
        },
        {
            'name': 'ICC Exhibit Hall H Entrance',
            'floor': 1,
            'gencon_lng': 67.126465,  'gencon_lat': 0.372103,
            'rw_lat': 39.763694,      'rw_lng': -86.163889,
        },
        {
            'name': 'ICC Exhibit Hall I Entrance',
            'floor': 1,
            'gencon_lng': 24.938965,  'gencon_lat': 20.414659,
            'rw_lat': 39.763667,      'rw_lng': -86.163250,
        },
        {
            'name': 'ICC Exhibit Hall J Entrance',
            'floor': 1,
            'gencon_lng': 6.459961,   'gencon_lat': 11.003329,
            'rw_lat': 39.763722,      'rw_lng': -86.162528,
        },
        {
            'name': 'ICC Exhibit Hall K Entrance',
            'floor': 1,
            'gencon_lng': 6.448975,   'gencon_lat': 27.076591,
            'rw_lat': 39.763306,      'rw_lng': -86.162611,
        },

        # ── Skywalks (ICC side, floor 2) ─────────────────────────────────────
        # Each entry is the doorway on the ICC end of the elevated walkway.
        # Westin is north of ICC; JW Marriott, Marriott Downtown, and the
        # Hyatt cluster are on various sides — verify visually on the map.
        # The corresponding hotel-side entry lives under that hotel's section.
        {
            'name': 'ICC Skywalk to Hyatt / Le Meridien / Omni Severin / Embassy Suites',
            'floor': 2,
            'gencon_lng': -5.976563,  'gencon_lat': -41.176841,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            'name': 'ICC Skywalk to Westin',
            'floor': 2,
            'gencon_lng': 34.716797,  'gencon_lat': -43.169569,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            'name': 'ICC Skywalk to Marriott Downtown',
            'floor': 2,
            'gencon_lng': 59.150391,  'gencon_lat': -42.486339,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            'name': 'ICC Skywalk to State Parking Garage',
            'floor': 2,
            'gencon_lng': 97.207031,  'gencon_lat': -42.745020,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            # ICC-side door of the skywalk that arrives from the State Parking
            # Garage (which in turn connects to JW Marriott).
            'name': 'ICC Skywalk from State Parking Garage',
            'floor': 2,
            'gencon_lng': 96.943359,  'gencon_lat': -47.685834,
            'rw_lat': 39.765963,      'rw_lng': -86.166093,
        },

        # ── Basement tunnel to Lucas Oil ─────────────────────────────────────
        {
            'name': 'ICC Basement Tunnel to Lucas Oil Stadium',
            'floor': 0,
            'gencon_lng': -2.460938,  'gencon_lat': 59.571316,
            'rw_lat': None,           'rw_lng': None,
        },
    ],

    # ── Crowne Plaza Indianapolis Downtown ────────────────────────────────────
    # Verify exact location name against your Location table (may be "Crowne Plaza").
    'Crowne Plaza': [
        {
            'name': 'Crowne Plaza Main Entrance',
            'floor': 1,
            'gencon_lng': -21.862793, 'gencon_lat': 35.033938,
            'rw_lat': 39.762765,      'rw_lng': -86.161590,
        },
        {
            'name': 'Crowne Plaza Skywalk to ICC',
            'floor': 2,
            'gencon_lng': -38.144531, 'gencon_lat': 34.920251,
            'rw_lat': 39.762748,      'rw_lng': -86.161767,
        },
        {
            'name': 'Crowne Plaza Skywalk to Union Station',
            'floor': 2,
            'gencon_lng': -58.095703, 'gencon_lat': 37.934182,
            'rw_lat': None,           'rw_lng': None,
        },
    ],

    # ── Omni Severin Hotel ────────────────────────────────────────────────────
    'Omni': [
        {
            # Only one confirmed entrance; this entry may be removed
            'name': 'Omni Severin Entrance (N)',
            'floor': 1,
            'gencon_lng': -65.621338, 'gencon_lat': 10.865139,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            'name': 'Omni Severin Entrance (S)',
            'floor': 1,
            'gencon_lng': -58.161621, 'gencon_lat': 6.882835,
            'rw_lat': 39.763948,      'rw_lng': -86.159852,
        },
    ],

    # ── JW Marriott Indianapolis ───────────────────────────────────────────────
    'JW Marriott': [
        {
            'name': 'JW Marriott Entrance (W)',
            'floor': 1,
            'gencon_lng': 132.231445, 'gencon_lat': -56.340889,
            'rw_lat': 39.766786,      'rw_lng': -86.167623,
        },
        {
            'name': 'JW Marriott Entrance (E)',
            'floor': 1,
            'gencon_lng': 147.436523, 'gencon_lat': -47.042246,
            'rw_lat': 39.766746,      'rw_lng': -86.167493,
        },
        {
            'name': 'JW Marriott Room 104',
            'floor': 1,
            'gencon_lng': 145.327148, 'gencon_lat': -52.053430,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            # Skywalk departs JW Marriott and arrives at the Government
            # Parking Building, which has its own skywalk connection to ICC.
            'name': 'JW Marriott Skywalk to State Parking Garage',
            'floor': 2,
            'gencon_lng': 127.792969, 'gencon_lat': -48.634344,
            'rw_lat': 39.766066,      'rw_lng': -86.167380,
        },
    ],

    # ── State Parking Garage ───────────────────────────────────────────
    # Intermediate building connecting JW Marriott to ICC via skywalks.
    # Verify exact location name against your Location table.
    'State Parking Garage': [
        {
            'name': 'State Parking Garage Skywalk to ICC',
            'floor': 2,
            'gencon_lng': 96.943359,  'gencon_lat': -47.685834,
            'rw_lat': 39.765963,      'rw_lng': -86.166093,
        },
        {
            'name': 'State Parking Garage Skywalk to JW Marriott',
            'floor': 2,
            'gencon_lng': 117.333984, 'gencon_lat': -48.576235,
            'rw_lat': 39.766066,      'rw_lng': -86.167380,
        },
    ],

    # ── Lucas Oil Stadium ──────────────────────────────────────────────────────
    'Lucas Oil Stadium': [
        {
            'name': 'Lucas Oil Stadium Main Entrance',
            'floor': 1,
            'gencon_lng': 17.138672,  'gencon_lat': 68.973461,
            'rw_lat': 39.761191,      'rw_lng': -86.162861,
        },
        {
            'name': 'Lucas Oil Stadium Field Entrance',
            'floor': 1,
            'gencon_lng': 20.126953,  'gencon_lat': 75.135404,
            'rw_lat': 39.760423,      'rw_lng': -86.163323,
        },
        {
            'name': 'Lucas Oil Stadium West Club Lounge',
            'floor': 2,
            'gencon_lng': 57.524414,  'gencon_lat': 75.385000,
            'rw_lat': None,           'rw_lng': None,
        },
        {
            'name': 'Lucas Oil Stadium East Club Lounge',
            'floor': 2,
            'gencon_lng': 13.271484,  'gencon_lat': 79.349742,
            'rw_lat': None,           'rw_lng': None,
        },
    ],
}


class Command(BaseCommand):
    help = 'Load building exit/entrance points for all Gen Con venues into the Room table.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        total_created = total_updated = 0

        for location_name, exits in EXITS_BY_LOCATION.items():

            # Look up the location — warn and skip rather than abort.
            try:
                location = Location.objects.get(name=location_name)
            except Location.DoesNotExist:
                self.stderr.write(self.style.WARNING(
                    f'Location "{location_name}" not found — skipping '
                    f'({len(exits)} exit(s)). Check the name matches your Location table.'
                ))
                continue

            created = updated = 0
            self.stdout.write(f'\n{location_name} ({len(exits)} exit(s))')

            for exit_data in exits:
                name = exit_data['name']
                defaults = {
                    'floor_level':          exit_data['floor'],
                    'room_type':            'building_exit',
                    'longitude':            exit_data['gencon_lng'],
                    'latitude':             exit_data['gencon_lat'],
                    'real_world_latitude':  exit_data['rw_lat'],
                    'real_world_longitude': exit_data['rw_lng'],
                }

                if dry_run:
                    self.stdout.write(
                        f'  [dry-run] {name}  '
                        f'gencon=({exit_data["gencon_lng"]}, {exit_data["gencon_lat"]})  '
                        f'rw=({exit_data["rw_lat"]}, {exit_data["rw_lng"]})'
                    )
                    created += 1
                    continue

                _, was_created = Room.objects.update_or_create(
                    location=location,
                    room_name=name,
                    defaults=defaults,
                )
                created += was_created
                updated += not was_created

            label = 'Would create' if dry_run else 'Created'
            self.stdout.write(self.style.SUCCESS(
                f'  {label} {created}, updated {updated}.'
            ))
            total_created += created
            total_updated += updated

        self.stdout.write('')
        label = 'Would create' if dry_run else 'Created'
        self.stdout.write(self.style.SUCCESS(
            f'Total: {label} {total_created} exit(s), updated {total_updated}.'
        ))
