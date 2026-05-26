import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';
import api from '../../api/api';
import DataSync from './DataSync';

// ── Status chip ───────────────────────────────────────────────────────────────

type StatusDot = 'ok' | 'warn' | 'error' | 'idle';

function StatusChip({ dot, label }: { dot: StatusDot; label: string }) {
  const colors: Record<StatusDot, string> = {
    ok:    '#00FF81',
    warn:  '#f59e0b',
    error: '#f87171',
    idle:  '#6b7280',
  };
  const c = colors[dot];
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        bgcolor: `${c}18`,
        color: c,
        border: '1px solid',
        borderColor: `${c}55`,
      }}
    />
  );
}

// ── Terminal box ──────────────────────────────────────────────────────────────

function Terminal({ title, running, children }: {
  title: string;
  running?: boolean;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ bgcolor: '#000', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, overflow: 'hidden', mt: 2 }}>
      <Box sx={{
        px: 1.5, py: 0.75, bgcolor: '#1f2937',
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: running ? '#f59e0b' : '#4b5563' }} />
        <Typography variant="caption" sx={{ color: '#9ca3af', fontFamily: 'monospace', flexGrow: 1 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

function TerminalText({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, [text]);
  return (
    <Box
      ref={ref}
      sx={{
        p: '10px 14px',
        minHeight: 80,
        maxHeight: 280,
        overflowY: 'auto',
        fontFamily: "'Menlo','Consolas',monospace",
        fontSize: 11,
        lineHeight: 1.65,
        color: '#a3e635',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text || <span style={{ color: '#4b5563' }}>No output yet.</span>}
    </Box>
  );
}

// ── Map pipeline status badge ─────────────────────────────────────────────────

interface MapStatus {
  har_files: string[];
  has_har: boolean;
  has_metadata: boolean;
  has_stitched: boolean;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DataSyncPage() {
  // ── Data sync state ────────────────────────────────────────────────────────
  const [taskId, setTaskId]           = useState<string | null>(null);
  const [syncRunning, setSyncRunning] = useState(false);
  const [syncError, setSyncError]     = useState<string | null>(null);

  // Worker / Redis status
  const [redisOk, setRedisOk]       = useState<boolean | null>(null);
  const [workerUp, setWorkerUp]     = useState<boolean | null>(null);
  const [workerLog, setWorkerLog]   = useState('');
  const [starting, setStarting]     = useState(false);

  // ── Map pipeline state ─────────────────────────────────────────────────────
  const [mapStatus, setMapStatus]         = useState<MapStatus | null>(null);
  const [extractTaskId, setExtractTaskId] = useState<string | null>(null);
  const [stitchTaskId, setStitchTaskId]   = useState<string | null>(null);
  const [extractRunning, setExtractRunning] = useState(false);
  const [stitchRunning, setStitchRunning]   = useState(false);
  const [mapError, setMapError]           = useState<string | null>(null);

  // ── Poll worker status every 4 s while on this page ───────────────────────
  useEffect(() => {
    fetchStatus();
    fetchMapStatus();
    const id = setInterval(() => { fetchStatus(); fetchMapStatus(); }, 4000);
    return () => clearInterval(id);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/worker/status/');
      setRedisOk(res.data.redis_ok);
      setWorkerUp(res.data.running);
      if (res.data.log_tail) setWorkerLog(res.data.log_tail);
    } catch {
      // silently ignore — status is best-effort
    }
  };

  const fetchMapStatus = async () => {
    try {
      const res = await api.get('/map-pipeline/status/');
      setMapStatus(res.data);
    } catch {
      // silently ignore
    }
  };

  // ── Ensure Celery worker is running ───────────────────────────────────────
  const ensureWorker = async (): Promise<boolean> => {
    if (workerUp) return true;
    setStarting(true);
    try {
      const res = await api.post('/worker/start/');
      if (!res.data.started) {
        setMapError(res.data.message ?? 'Failed to start worker.');
        setStarting(false);
        await fetchStatus();
        return false;
      }
      await fetchStatus();
    } catch (err: any) {
      setMapError(err?.response?.data?.message ?? 'Failed to start worker.');
      setStarting(false);
      return false;
    }
    setStarting(false);
    return true;
  };

  // ── Start worker + trigger data sync ──────────────────────────────────────
  const handleTrigger = async () => {
    if (syncRunning || starting) return;
    setSyncError(null);
    setTaskId(null);

    if (!await ensureWorker()) return;

    setSyncRunning(true);
    try {
      const res = await api.post('/data-sync/trigger/');
      setTaskId(res.data.task_id);
    } catch (err: any) {
      setSyncError(err?.response?.data?.detail ?? 'Failed to trigger sync. Are you an admin?');
      setSyncRunning(false);
    }
  };

  // ── Map pipeline handlers ─────────────────────────────────────────────────
  const handleExtract = async () => {
    if (extractRunning || stitchRunning || starting) return;
    setMapError(null);
    setExtractTaskId(null);

    if (!await ensureWorker()) return;

    setExtractRunning(true);
    try {
      const res = await api.post('/map-pipeline/extract/');
      setExtractTaskId(res.data.task_id);
    } catch (err: any) {
      setMapError(err?.response?.data?.detail ?? 'Failed to start extraction.');
      setExtractRunning(false);
    }
  };

  const handleStitch = async () => {
    if (stitchRunning || extractRunning || starting) return;
    setMapError(null);
    setStitchTaskId(null);

    if (!await ensureWorker()) return;

    setStitchRunning(true);
    try {
      const res = await api.post('/map-pipeline/stitch/');
      setStitchTaskId(res.data.task_id);
    } catch (err: any) {
      setMapError(err?.response?.data?.detail ?? 'Failed to start stitching.');
      setStitchRunning(false);
    }
  };

  // ── Derived UI state ──────────────────────────────────────────────────────
  const redisDot: StatusDot = redisOk === null ? 'idle' : redisOk ? 'ok' : 'error';
  const workerDot: StatusDot =
    starting ? 'warn' :
    workerUp === null ? 'idle' :
    workerUp ? 'ok' : 'error';

  const syncBusy = syncRunning || starting;
  const mapBusy  = extractRunning || stitchRunning || starting;

  const syncButtonLabel =
    starting ? 'Starting worker…' :
    syncRunning ? 'Sync running…' :
    !redisOk ? 'Redis offline' :
    'Run data sync';

  const canStitch = mapStatus?.has_metadata ?? false;

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', px: 2, py: 4 }}>

      {/* ── Data Sync ──────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Data Sync</Typography>
        <Typography variant="body2" color="text.secondary">
          Pulls the latest events, vendors, and schedules from Gen Con. Admin access required.
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={syncBusy
            ? <CircularProgress size={14} color="inherit" />
            : <SyncIcon />}
          onClick={handleTrigger}
          disabled={syncBusy || redisOk === false}
        >
          {syncButtonLabel}
        </Button>

        <StatusChip dot={redisDot} label={
          redisOk === null ? 'Redis checking…' :
          redisOk ? 'Redis connected' : 'Redis offline'
        } />

        <StatusChip dot={workerDot} label={
          starting ? 'Worker starting…' :
          workerUp === null ? 'Worker unknown' :
          workerUp ? 'Worker running' : 'Worker stopped'
        } />

        {taskId && (
          <Chip
            label={`Task: ${taskId}`}
            size="small"
            sx={{
              fontFamily: 'monospace', fontSize: '0.7rem',
              bgcolor: 'rgba(245,158,11,0.1)', color: 'primary.main',
              border: '1px solid', borderColor: 'primary.main',
            }}
          />
        )}
      </Box>

      {syncError && (
        <Typography variant="body2" color="error" sx={{ mb: 2, fontFamily: 'monospace', fontSize: 12 }}>
          ✖ {syncError}
        </Typography>
      )}

      {taskId && (
        <Terminal title={`sync output — ${taskId}`} running={syncRunning}>
          <DataSync
            taskId={taskId}
            onComplete={() => { setSyncRunning(false); fetchStatus(); }}
            onDismiss={() => { setTaskId(null); setSyncRunning(false); }}
          />
        </Terminal>
      )}

      {workerLog && (
        <Terminal title="celery_worker.log" running={starting}>
          <TerminalText text={workerLog} />
        </Terminal>
      )}

      {/* ── Map Tile Pipeline ──────────────────────────────────────────────── */}
      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Map Tile Pipeline</Typography>
        <Typography variant="body2" color="text.secondary">
          Rebuild the convention floor maps from a new HAR capture. Place your
          {' '}<code>gencon*.har.json</code> file in <code>backend/static/</code> before running.
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Status row */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        <StatusChip
          dot={mapStatus?.has_har ? 'ok' : 'error'}
          label={
            mapStatus === null ? 'HAR: checking…' :
            mapStatus.has_har
              ? `HAR: ${mapStatus.har_files[0]}`
              : 'HAR: not found'
          }
        />
        <StatusChip
          dot={mapStatus?.has_metadata ? 'ok' : 'idle'}
          label={mapStatus?.has_metadata ? 'tile_metadata.json: ready' : 'tile_metadata.json: missing'}
        />
        <StatusChip
          dot={mapStatus?.has_stitched ? 'ok' : 'idle'}
          label={mapStatus?.has_stitched ? 'Stitched images: present' : 'Stitched images: none'}
        />
      </Box>

      {/* Step 1: Extract */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
          Step 1 — Extract Tiles
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
          Reads the HAR file and builds <code>tile_metadata.json</code>.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={extractRunning
              ? <CircularProgress size={14} color="inherit" />
              : <MapIcon />}
            onClick={handleExtract}
            disabled={mapBusy || !mapStatus?.has_har || redisOk === false}
          >
            {extractRunning ? 'Extracting…' : 'Extract Tiles'}
          </Button>
          {extractTaskId && (
            <Chip
              label={`Task: ${extractTaskId}`}
              size="small"
              sx={{
                fontFamily: 'monospace', fontSize: '0.7rem',
                bgcolor: 'rgba(245,158,11,0.1)', color: 'primary.main',
                border: '1px solid', borderColor: 'primary.main',
              }}
            />
          )}
        </Box>
        {extractTaskId && (
          <Terminal title={`extract — ${extractTaskId}`} running={extractRunning}>
            <DataSync
              taskId={extractTaskId}
              onComplete={() => { setExtractRunning(false); fetchMapStatus(); }}
              onDismiss={() => { setExtractTaskId(null); setExtractRunning(false); }}
            />
          </Terminal>
        )}
      </Box>

      {/* Step 2: Stitch */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
          Step 2 — Stitch Images
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
          Downloads tiles from CloudFront and stitches them into floor PNG files.
          This can take several minutes. Requires Step 1 to have completed.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={stitchRunning
              ? <CircularProgress size={14} color="inherit" />
              : <LayersIcon />}
            onClick={handleStitch}
            disabled={mapBusy || !canStitch || redisOk === false}
          >
            {stitchRunning ? 'Stitching…' : 'Stitch Images'}
          </Button>
          {!canStitch && !stitchRunning && (
            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
              Run Step 1 first
            </Typography>
          )}
          {stitchTaskId && (
            <Chip
              label={`Task: ${stitchTaskId}`}
              size="small"
              sx={{
                fontFamily: 'monospace', fontSize: '0.7rem',
                bgcolor: 'rgba(245,158,11,0.1)', color: 'primary.main',
                border: '1px solid', borderColor: 'primary.main',
              }}
            />
          )}
        </Box>
        {stitchTaskId && (
          <Terminal title={`stitch — ${stitchTaskId}`} running={stitchRunning}>
            <DataSync
              taskId={stitchTaskId}
              onComplete={() => { setStitchRunning(false); fetchMapStatus(); }}
              onDismiss={() => { setStitchTaskId(null); setStitchRunning(false); }}
            />
          </Terminal>
        )}
      </Box>

      {mapError && (
        <Typography variant="body2" color="error" sx={{ mt: 1, fontFamily: 'monospace', fontSize: 12 }}>
          ✖ {mapError}
        </Typography>
      )}

    </Box>
  );
}
