import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';

let server: net.Server | null = null;
const isWin = process.platform === 'win32';

function getSocketPath(): string {
  if (isWin) {
    return path.join('\\\\.\\pipe', 'claude-code-pet');
  }
  return path.join(process.env.HOME || '/tmp', '.claude-code-pet.sock');
}

export function startHookServer(onEvent: (state: string) => void) {
  const socketPath = getSocketPath();

  // Clean up old socket on Unix
  if (!isWin && fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }

  server = net.createServer((conn) => {
    let data = '';
    conn.on('data', (chunk) => {
      data += chunk.toString();
    });
    conn.on('end', () => {
      const state = data.trim().toLowerCase();
      const validStates = ['idle', 'working', 'talking', 'walk', 'celebrate', 'error'];
      if (validStates.includes(state)) {
        onEvent(state);
      }
      conn.end();
    });
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      // Pipe in use — another instance running or stale handle.
      // On Windows, try to recreate after brief delay.
      if (isWin) {
        setTimeout(() => {
          server?.close();
          server?.listen(socketPath);
        }, 1000);
      }
      console.log('Hook server: pipe already in use, retrying...');
    } else {
      console.error('Hook server error:', err);
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