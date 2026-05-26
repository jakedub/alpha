from celery.result import AsyncResult
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from alpha.tasks import run_data_sync, run_map_extract, run_map_stitch
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from pathlib import Path
import json
import time

from app.services.gencon_playwright import fetch_user_schedule

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_STATIC_DIR  = _BACKEND_DIR / "static"


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def trigger_data_sync(request):
    task = run_data_sync.delay()
    return Response({'task_id': task.id})

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def data_sync_status(request, task_id):
    result = AsyncResult(task_id)

    response = {
        "task_id": str(task_id),
        "state": result.state,
        "result": None,
        "progress": None,
    }

    # IMPORTANT: progress lives in result.info during PROGRESS
    if result.state == "PROGRESS":
        response["progress"] = result.info

    # final result
    if result.state == "SUCCESS":
        response["result"] = result.result

    if result.state == "FAILURE":
        response["error"] = str(result.result)

    return Response(response)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def map_pipeline_status(request):
    """Return whether the prerequisite files for each pipeline stage exist."""
    har_files   = list(_STATIC_DIR.glob("gencon*.har.json"))
    metadata    = _STATIC_DIR / "tiles" / "tile_metadata.json"
    stitched_ok = any((_STATIC_DIR / "stitched").glob("floor-*_z*.png"))

    return Response({
        "har_files":       [f.name for f in har_files],
        "has_har":         bool(har_files),
        "has_metadata":    metadata.exists(),
        "has_stitched":    stitched_ok,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def trigger_map_extract(request):
    """Trigger the map_extract + json_map Celery task."""
    task = run_map_extract.delay()
    return Response({'task_id': task.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def trigger_map_stitch(request):
    """Trigger the stitch_images Celery task."""
    task = run_map_stitch.delay()
    return Response({'task_id': task.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_schedule(request):
    try:
        report = fetch_user_schedule(request.user.id)
        return Response(report)
    except Exception as e:
        return Response({'error': str(e)}, status=500)