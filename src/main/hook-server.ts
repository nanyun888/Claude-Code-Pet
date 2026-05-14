import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';

let server: net.Server | null = null;
const isWin = process.platform === 'win32';

interface TaskInfo {
  tool?: string;
  description?: string;
  command?: string;
  filePath?: string;
  query?: string;
  prompt?: string;
}

export interface HookEvent {
  state: string;
  task: TaskInfo;
}

function getSocketPath(): string {
  if (isWin) {
    return path.join('\\\\.\\pipe', 'claude-code-pet');
  }
  return path.join(process.env.HOME || '/tmp', '.claude-code-pet.sock');
}

export function startHookServer(onEvent: (event: HookEvent) => void) {
  const socketPath = getSocketPath();

  if (!isWin && fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }

  server = net.createServer((conn) => {
    let data = '';
    conn.on('data', (chunk) => { data += chunk.toString(); });
    conn.on('end', () => {
      try {
        const parsed = JSON.parse(data.trim());
        const state = (parsed.state || 'idle').toLowerCase();
        const validStates = ['idle', 'working', 'talking', 'walk', 'celebrate', 'error'];
        if (validStates.includes(state)) {
          onEvent({ state, task: parsed.task || {} });
        }
      } catch {
        // Fallback: treat as plain state string
        const state = data.trim().toLowerCase();
        const validStates = ['idle', 'working', 'talking', 'walk', 'celebrate', 'error'];
        if (validStates.includes(state)) {
          onEvent({ state, task: {} });
        }
      }
      conn.end();
    });
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      if (isWin) {
        setTimeout(() => {
          server?.close();
          server?.listen(socketPath);
        }, 1000);
      }
    }
  });

  server.listen(socketPath, () => {
    console.log(`Hook server listening on ${socketPath}`);
  });
}

export function stopHookServer() {
  if (server) {
    server.close();
    server = null;
  }
  const socketPath = getSocketPath();
  if (!isWin && fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }
}