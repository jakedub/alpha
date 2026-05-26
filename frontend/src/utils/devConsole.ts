let popupConsole: Window | null = null;

// Structured log buffer for Copy to JSON
const logBuffer: Array<{ level: string; message: string; ts: string }> = [];

export function openConsoleWindow() {
  if (popupConsole && !popupConsole.closed) return popupConsole;

  popupConsole = window.open('', 'ConsoleWindow', 'width=560,height=640');
  if (!popupConsole) return null;

  popupConsole.document.write(`
    <html>
    <head>
      <title>Alpha — Dev Console</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #111827; color: #f9fafb; margin: 0; font-family: 'Menlo', 'Consolas', monospace; display: flex; flex-direction: column; height: 100vh; }
        #toolbar {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px;
          background: #1f2937;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        #toolbar span { font-size: 11px; color: #9ca3af; flex: 1; }
        button {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #d1d5db;
          font-family: inherit;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        button:hover { background: rgba(255,255,255,0.08); color: #f9fafb; }
        button.copied { border-color: #f59e0b; color: #f59e0b; }
        #log-wrap { flex: 1; overflow-y: auto; }
        #log {
          font-size: 12px; white-space: pre-wrap; margin: 0;
          padding: 10px 14px; line-height: 1.6;
        }
        .ready { color: #f59e0b; font-weight: bold; }
        .log-line-LOG   { color: #f9fafb; }
        .log-line-WARN  { color: #fbbf24; }
        .log-line-ERROR { color: #f87171; }
      </style>
    </head>
    <body>
      <div id="toolbar">
        <span>Alpha Dev Console</span>
        <button id="btn-clear">Clear</button>
        <button id="btn-copy">Copy JSON</button>
      </div>
      <div id="log-wrap">
        <pre id="log"><span class="ready">▶ Alpha Dev Console ready — logs will appear here.\n</span></pre>
      </div>
      <script>
        document.getElementById('btn-clear').addEventListener('click', () => {
          const pre = document.getElementById('log');
          pre.innerHTML = '<span class="ready">▶ Cleared.\n</span>';
        });
        document.getElementById('btn-copy').addEventListener('click', () => {
          const btn = document.getElementById('btn-copy');
          const buf = window.__logBuffer || [];
          const json = JSON.stringify(buf, null, 2);
          // navigator.clipboard is unreliable in popup windows; use textarea fallback
          try {
            const ta = document.createElement('textarea');
            ta.value = json;
            ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => { btn.textContent = 'Copy JSON'; btn.classList.remove('copied'); }, 1500);
          } catch (e) {
            btn.textContent = 'Failed';
            setTimeout(() => { btn.textContent = 'Copy JSON'; }, 1500);
          }
        });
      </script>
    </body>
    </html>
  `);
  popupConsole.document.close();

  // Expose the buffer so the popup's inline script can read it
  (popupConsole as any).__logBuffer = logBuffer;

  ['log', 'error', 'warn'].forEach((level) => {
    const original = console[level as keyof Console] as (...args: any[]) => void;
    console[level as keyof Console] = (...args: any[]) => {
      original(...args); // still log to browser console

      const output = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // Push to structured buffer
      logBuffer.push({
        level: level.toUpperCase(),
        message: output,
        ts: new Date().toISOString(),
      });

      const pre = popupConsole?.document.getElementById('log');
      if (pre) {
        const line = popupConsole?.document.createElement('span');
        if (line) {
          line.className = `log-line-${level.toUpperCase()}`;
          line.textContent = `[${level.toUpperCase()}] ${output}\n`;
          pre.appendChild(line);
          // Auto-scroll to bottom
          const wrap = popupConsole?.document.getElementById('log-wrap');
          if (wrap) wrap.scrollTop = wrap.scrollHeight;
        }
      }
    };
  });

  return popupConsole;
}
