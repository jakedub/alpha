# utils/geocoding.py
import requests

def geocode_venue(venue_name):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": venue_name,
        "key": "YOUR_GOOGLE_API_KEY"
    }
    response = requests.get(url, params=params).json()
    if response['results']:
        location = response['results'][0]['geometry']['location']
        return location['lat'], location['lng']
    return None, None