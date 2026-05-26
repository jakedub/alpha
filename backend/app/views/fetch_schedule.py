from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from app.services.schedule import fetch_user_schedule

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_schedule(request, gencon_id):
    data = fetch_user_schedule(gencon_id)
    return Response(data)