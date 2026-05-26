#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — start all Alpha services from the project root
#
#   ./dev.sh           Django + Vite + Celery worker + Celery beat
#   ./dev.sh --no-beat skip Celery beat
#
# Ctrl+C kills all child processes cleanly.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
VENV="$BACKEND/venv"

# ── Sanity checks ─────────────────────────────────────────────────────────────
if [[ ! -d "$VENV" ]]; then
  echo "[alpha] ERROR: venv not found at $VENV"
  echo "[alpha] Run: cd backend && python3 -m venv venv && pip install -r requirements.txt"
  exit 1
fi

if [[ ! -d "$FRONTEND/node_modules" ]]; then
  echo "[alpha] node_modules missing — running npm install…"
  (cd "$FRONTEND" && npm install)
fi

# ── Activate venv for this process and all children ───────────────────────────
# Equivalent to `source venv/bin/activate` but works in all subshells/pipes.
export VIRTUAL_ENV="$VENV"
export PATH="$VENV/bin:$PATH"
unset PYTHONHOME 2>/dev/null || true
export DJANGO_SETTINGS_MODULE=alpha.settings

# ── Parse flags ───────────────────────────────────────────────────────────────
START_BEAT=true
for arg in "$@"; do
  [[ "$arg" == "--no-beat" ]] && START_BEAT=false
done

# ── Colour helpers ────────────────────────────────────────────────────────────
RESET='\033[0m'
BOLD='\033[1m'
C_DJANGO='\033[36m'
C_VITE='\033[35m'
C_WORKER='\033[33m'
C_BEAT='\033[32m'
C_SYS='\033[90m'

log()           { echo -e "${C_SYS}[alpha]${RESET} $*"; }
prefix_output() {
  local label="$1" color="$2"
  while IFS= read -r line; do
    echo -e "${color}${BOLD}[${label}]${RESET} ${line}"
  done
}

# ── Process cleanup on exit ───────────────────────────────────────────────────
PIDS=()
cleanup() {
  echo ""
  log "Shutting down…"
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
  log "Done."
}
trap cleanup EXIT INT TERM

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  ╔══════════════════════════════╗"
echo -e "  ║   Alpha — Dev Server         ║"
echo -e "  ╚══════════════════════════════╝${RESET}"
echo ""

# ── Django ────────────────────────────────────────────────────────────────────
(cd "$BACKEND" && python manage.py runserver 2>&1 | prefix_output "django" "$C_DJANGO") &
PIDS+=($!)
log "Started ${BOLD}django${RESET}  (pid $!)"

# ── Vite ──────────────────────────────────────────────────────────────────────
(npm --prefix "$FRONTEND" run dev 2>&1 | prefix_output "vite  " "$C_VITE") &
PIDS+=($!)
log "Started ${BOLD}vite${RESET}    (pid $!)"

# ── Celery worker ─────────────────────────────────────────────────────────────
(cd "$BACKEND" && celery -A alpha worker --loglevel=info 2>&1 | prefix_output "worker" "$C_WORKER") &
PIDS+=($!)
log "Started ${BOLD}worker${RESET}  (pid $!)"

# ── Celery beat ───────────────────────────────────────────────────────────────
if $START_BEAT; then
  (cd "$BACKEND" && celery -A alpha beat --loglevel=info 2>&1 | prefix_output "beat  " "$C_BEAT") &
  PIDS+=($!)
  log "Started ${BOLD}beat${RESET}    (pid $!)"
fi

echo ""
log "All services running. ${BOLD}Ctrl+C${RESET} to stop."
echo ""

# If any service crashes, the trap fires and takes everything else down
wait -n 2>/dev/null || wait
