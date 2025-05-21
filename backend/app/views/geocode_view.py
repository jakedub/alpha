# views.py
from django.http import JsonResponse

from utils.room_coordinates import get_room_coordinates

def get_route(request):
    source = request.GET.get("source")  # e.g., "Lucas Oil Stadium West Concourse HQ"
    dest = request.GET.get("dest")      # e.g., "JW Marriott room 757"

    source_coords = get_room_coordinates("Lucas Oil Stadium", "West Concourse HQ")
    dest_coords = get_room_coordinates("JW Marriott", "room 757")

    return JsonResponse({
        "source": source_coords,
        "destination": dest_coords
    })