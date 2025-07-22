import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def gencon_event_search(request):
    query = request.GET.get('search', '')
    if not query:
        return Response([])

    external_url = f"https://www.gencon.com/api/event_search?search={query}"
    resp = requests.get(external_url)
    if resp.status_code == 200:
        return Response(resp.json())
    else:
        return Response({"error": "Failed to fetch"}, status=resp.status_code)