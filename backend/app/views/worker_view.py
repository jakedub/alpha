"""
Worker management endpoints.

POST /api/worker/start/   — ensure a Celery worker is running; spawn one if not
GET  /api/worker/status/  — returns {running, redis_ok, log_tail}
GET  /api/worker/logs/    — returns last N lines of the worker log file
"""
import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from alpha.celery import app as celery_app

# ── Paths ─────────────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
VENV_CELERY = BACKEND_DIR / 'venv' / 'bin' / 'celery'
WORKER_LOG = BACKEND_DIR / 'celery_worker.log'

# ── Module-level worker handle ────────────────────────────────────────────────
_worker_process: Optional[subprocess.Popen] = None
_worker_lock = threading.Lock()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _redis_ok() -> bool:
    """Try a raw socket connect to Redis (doesn't need redis-py)."""
    import socket
    from django.conf import settings
    url = getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0')
    # parse host/port from redis://host:port/db
    try:
        parts = url.replace('redis://', '').split('/')[0].split(':')
        host = parts[0] or 'localhost'
        port = int(parts[1]) if len(parts) > 1 else 6379
        with socket.create_connection((host, port), timeout=1):
            return True
    except Exception:
        return False


def _inspect_ping(timeout: float = 1.5) -> bool:
    try:
        from celery.app.control import Control
        pong = Control(celery_app).inspect(timeout=timeout).ping()
        return bool(pong)
    except Exception:
        return False


def _process_running() -> bool:
    global _worker_process
    with _worker_lock:
        if _worker_process is None:
            return False
        if _worker_process.poll() is None:
            return True
        _worker_process = None
        return False


def _worker_alive() -> bool:
    return _process_running() or _inspect_ping(timeout=1.0)


def _tail_log(lines: int = 60) -> list:
    if not WORKER_LOG.exists():
        return []
    with open(WORKER_LOG, 'r', errors='replace') as f:
        return f.readlines()[-lines:]


def _spawn_worker():
    global _worker_process
    env = os.environ.copy()
    env.setdefault('DJANGO_SETTINGS_MODULE', 'alpha.settings')

    # Use the venv celery binary directly; fall back to whatever 'celery' is on PATH
    celery_bin = str(VENV_CELERY) if VENV_CELERY.exists() else 'celery'

    log_file = open(WORKER_LOG, 'w')
    with _worker_lock:
        proc = subprocess.Popen(
            [celery_bin, '-A', 'alpha', 'worker', '--loglevel=info'],
            cwd=str(BACKEND_DIR),
            env=env,
            stdout=log_file,
            stderr=subprocess.STDOUT,   # merge stderr → stdout → log file
        )
        _worker_process = proc


# ── Views ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def worker_status(request):
    redis = _redis_ok()
    running = _worker_alive() if redis else False
    log_tail = _tail_log(30)
    return Response({
        'running': running,
        'redis_ok': redis,
        'log_tail': ''.join(log_tail),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def worker_logs(request):
    n = int(request.query_params.get('lines', 100))
    return Response({'log': ''.join(_tail_log(n))})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def worker_start(request):
    if not _redis_ok():
        return Response(
            {'started': False, 'message': 'Redis is not reachable. Start Redis first (e.g. `redis-server`).'},
            status=503,
        )

    if _worker_alive():
        return Response({'started': True, 'already_running': True, 'message': 'Worker already running.'})

    _spawn_worker()

    # Poll up to 10 s for the worker to respond to a ping
    for _ in range(20):
        time.sleep(0.5)
        if _inspect_ping(timeout=0.5):
            return Response({'started': True, 'message': 'Worker started and connected.'})

    # Check if process crashed immediately
    if not _process_running():
        log = ''.join(_tail_log(20))
        return Response(
            {'started': False, 'message': 'Worker process exited. Check logs.', 'log': log},
            status=500,
        )

    return Response({'started': True, 'message': 'Worker process launched (ping timeout — may still be starting).'})
