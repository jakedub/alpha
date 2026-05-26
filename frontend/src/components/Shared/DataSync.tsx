import { useState, useEffect, useRef } from 'react';

type Props = {
  taskId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
};

// Poll every second while actively progressing; back off to 5 s if the
// step hasn't changed for 10 consecutive polls (stitch tiles are slow).
const FAST_INTERVAL = 1000;
const SLOW_INTERVAL = 5000;
const BACKOFF_AFTER  = 10;

const DataSync = ({ taskId, onComplete, onDismiss }: Props) => {
  const [status, setStatus]   = useState<string>('PENDING');
  const [result, setResult]   = useState<any>(null);
  const [logs, setLogs]       = useState<string[]>([]);
  const [done, setDone]       = useState(false);

  const logEndRef     = useRef<HTMLDivElement | null>(null);
  const sameStepCount = useRef(0);
  const lastStep      = useRef<string | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch(`/api/data-sync/status/${taskId}/`);
        const data = await res.json();

        setStatus(data.state);
        setResult(data.result ?? null);

        if (data.progress?.current_step) {
          const step = data.progress.current_step;
          setLogs(prev => {
            if (prev[prev.length - 1] === step) return prev;
            return [...prev, step];
          });

          // Backoff logic
          if (step === lastStep.current) {
            sameStepCount.current += 1;
          } else {
            sameStepCount.current = 0;
            lastStep.current = step;
          }

          // Switch to slow polling once step has been unchanged for a while
          if (sameStepCount.current === BACKOFF_AFTER && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(poll, SLOW_INTERVAL);
          }
        }

        if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDone(true);
          if (onComplete) onComplete();
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    intervalRef.current = setInterval(poll, FAST_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [taskId, onComplete]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const statusColor =
    status === 'SUCCESS' ? '#00FF81' :
    status === 'FAILURE' ? '#f87171' :
    status === 'STARTED' || status === 'PROGRESS' ? '#f59e0b' :
    '#9ca3af';

  return (
    <div style={{ padding: '12px 14px' }}>
      {/* Status row */}
      <div style={{
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#9ca3af',
      }}>
        <span>
          status:{' '}
          <span style={{ color: statusColor, fontWeight: 600 }}>{status}</span>
        </span>

        {/* Dismiss button — always visible so stale terminals can be cleared */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            title="Dismiss"
            style={{
              background: 'none',
              border: '1px solid #374151',
              borderRadius: 4,
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: 11,
              padding: '1px 8px',
              lineHeight: '18px',
            }}
          >
            {done ? 'clear' : 'dismiss'}
          </button>
        )}
      </div>

      {/* Log stream */}
      <div
        style={{
          background: '#000',
          color: '#e5e7eb',
          padding: '10px 12px',
          minHeight: 80,
          maxHeight: 320,
          overflowY: 'auto',
          fontFamily: "'Menlo', 'Consolas', monospace",
          fontSize: 12,
          lineHeight: 1.7,
          borderRadius: 4,
        }}
      >
        {logs.length === 0 && (
          <span style={{ color: '#4b5563' }}>Waiting for output…</span>
        )}
        {logs.map((log, idx) => (
          <div key={idx} style={{ color: '#a3e635' }}>{log}</div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Final result summary */}
      {result && Array.isArray(result) && (
        <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 11 }}>
          {result.map((r: any, i: number) => (
            <div key={i} style={{ color: r.status === 'error' ? '#f87171' : '#00FF81', lineHeight: 1.6 }}>
              {r.status === 'error' ? '✖' : '✔'} {r.step}{r.error ? ` — ${r.error}` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataSync;
