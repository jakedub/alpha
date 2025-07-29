let popupConsole: Window | null = null;

export function openConsoleWindow() {
  if (popupConsole && !popupConsole.closed) return popupConsole;

  popupConsole = window.open('', 'ConsoleWindow', 'width=500,height=600');
  if (!popupConsole) return null;

  popupConsole.document.write(`
    <html>
    <head><title>Dev Console</title></head>
    <body>
      <pre id="log" style="font-family: monospace; white-space: pre-wrap; margin: 0; padding: 1rem;"></pre>
    </body>
    </html>
  `);

  const pre = popupConsole.document.getElementById('log');

['log', 'error', 'warn'].forEach((level) => {
  const original = console[level as keyof Console] as (...args: any[]) => void;
  console[level as keyof Console] = (...args: any[]) => {
    original(...args); // still log to browser console

    const output = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const pre = popupConsole?.document.getElementById('log');
    if (pre) {
      pre.textContent += `[${level.toUpperCase()}] ${output}\n`;
    }
  };
});

  return popupConsole;
}