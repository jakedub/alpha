
import os
from app.models import Base

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # Set in your environment

def geocode_address(address: str):
    """Call Google Maps Geocoding API."""
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": GOOGLE_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] == "OK":
        location = data["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]
    else:
        raise Exception(f"Failed to geocode: {data['status']} - {address}")

def bulk_geocode_rooms():
    """Geocode all rooms missing lat/lng."""
    db: Session = SessionLocal()
    try:
        rooms = db.query(Room).filter(Room.address != None).all()

        updated = 0
        for room in rooms:
            if room.lat is not None and room.lng is not None:
                print(f"[✓] Skipping cached: {room.name}")
                continue

            if not room.address:
                print(f"[!] Missing address for {room.name}")
                continue

            try:
                lat, lng = geocode_address(room.address)
                room.lat = lat
                room.lng = lng
                updated += 1
                print(f"[+] Geocoded {room.name}: {lat}, {lng}")
            except Exception as e:
                print(f"[X] Error geocoding {room.name}: {e}")

        db.commit()
        print(f"✅ Geocoding complete. Updated {updated} room(s).")

    finally:
        db.close()

if __name__ == "__main__":
    bulk_geocode_rooms()