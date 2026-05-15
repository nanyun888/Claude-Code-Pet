import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { startHookServer, stopHookServer, HookEvent } from './hook-server';

let mainWindow: BrowserWindow | null = null;
let chatWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isDragging = false;

// Auto-walk state
let walkTimer: ReturnType<typeof setTimeout> | null = null;
let walkAnimFrame: ReturnType<typeof setInterval> | null = null;
let walkTarget: { x: number; y: number } | null = null;
let currentState = 'idle';
let walkEnabled = true;

// Config
const configPath = path.join(app.getPath('userData'), 'pet-config.json');
console.log('[Config] Path:', configPath);

function loadConfig(): Record<string, string> {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log('[Config] Loaded:', configPath, JSON.stringify(data));
      return data;
    }
    console.log('[Config] No file at:', configPath);
  } catch (e) {
    console.log('[Config] Load error:', e);
  }
  return {};
}

function saveConfig(cfg: Record<string, string>) {
  const existing = loadConfig();
  const merged = { ...existing, ...cfg };
  // Ensure directory exists
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log('[Config] SAVED to:', configPath);
  console.log('[Config] Content:', JSON.stringify(merged));
}

function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 180,
    height: 220,
    x: screenW - 250,
    y: screenH - 280,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'renderer', 'index.html'));
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setIgnoreMouseEvents(false);

  // Track pet drag → reposition chat window in real-time
  mainWindow.on('move', () => {
    if (!mainWindow || !chatWindow || chatWindow.isDestroyed()) return;
    const [px, py] = mainWindow.getPosition();
    chatWindow.setBounds({ x: px - 50, y: py - 250, width: 280, height: 240 });
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });
}

function positionChatToFollowPet() {
  if (!mainWindow || !chatWindow || chatWindow.isDestroyed()) return;
  const [px, py] = mainWindow.getPosition();
  chatWindow.setBounds({ x: px - 50, y: py - 250, width: 280, height: 240 });
}

function createChatWindow() {
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.show();
    chatWindow.focus();
    positionChatToFollowPet();
    return;
  }

  if (!mainWindow) return;
  const [px, py] = mainWindow.getPosition();

  chatWindow = new BrowserWindow({
    width: 300,
    height: 320,
    x: px - 50,
    y: py - 330,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'chat-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  chatWindow.setMinimumSize(260, 200);
  chatWindow.setMaximumSize(600, 500);

  chatWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'renderer', 'chat.html'));
  chatWindow.setVisibleOnAllWorkspaces(true);

  chatWindow.on('closed', () => { chatWindow = null; });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 520,
    frame: true,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    title: '设置',
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'renderer', 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.ico');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示宠物', click: () => mainWindow?.show() },
    { label: '隐藏宠物', click: () => mainWindow?.hide() },
    { label: '聊天...', click: () => createChatWindow() },
    { label: '设置...', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: '重置位置', click: () => resetPosition() },
    { label: '重新配置 Hooks', click: () => { saveConfig({ hooksConfigured: '' }); autoSetupHooks(); } },
    { type: 'separator' },
    { label: '退出', click: () => { mainWindow?.destroy(); app.quit(); } },
  ]);

  tray.setToolTip('Claude Code 桌面宠物');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow?.show());
}

function resetPosition() {
  if (!mainWindow) return;
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(screenW - 250, screenH - 280);
}

// === IPC: Pet Window ===
ipcMain.on('pet:move', (_, x: number, y: number) => {
  mainWindow?.setPosition(Math.round(x), Math.round(y));
});

ipcMain.on('pet:get-position', (e) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  e.returnValue = { x, y };
});

ipcMain.on('pet:get-screen-size', (e) => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  e.returnValue = { width, height };
});

ipcMain.on('pet:drag-start', () => { isDragging = true; stopAutoWalk(); });
ipcMain.on('pet:drag-end', () => {
  isDragging = false;
  if (currentState === 'idle') scheduleAutoWalk();
});
ipcMain.handle('pet:is-dragging', () => isDragging);

ipcMain.on('pet:open-chat', () => createChatWindow());

ipcMain.on('pet:context-menu', () => {
  if (!mainWindow) return;
  const menu = Menu.buildFromTemplate([
    { label: '聊天', click: () => createChatWindow() },
    { label: '设置...', click: () => createSettingsWindow() },
    { type: 'separator' },
    {
      label: '切换状态',
      submenu: [
        { label: '待机', click: () => mainWindow?.webContents.send('state:change', 'idle') },
        { label: '工作中', click: () => mainWindow?.webContents.send('state:change', 'working') },
        { label: '说话', click: () => mainWindow?.webContents.send('state:change', 'talking') },
        { label: '庆祝', click: () => mainWindow?.webContents.send('state:change', 'celebrate') },
        { label: '错误', click: () => mainWindow?.webContents.send('state:change', 'error') },
      ],
    },
    {
      label: '漫步',
      submenu: [
        { label: walkEnabled ? '✓ 开启' : '  开启', click: () => { walkEnabled = true; scheduleAutoWalk(); } },
        { label: !walkEnabled ? '✓ 关闭' : '  关闭', click: () => { walkEnabled = false; stopAutoWalk(); } },
      ],
    },
    { type: 'separator' },
    { label: '重置位置', click: () => resetPosition() },
    { label: '隐藏宠物', click: () => mainWindow?.hide() },
    { label: '退出', click: () => { mainWindow?.destroy(); app.quit(); } },
  ]);
  menu.popup({ window: mainWindow });
});

// === Session Discovery ===
interface SessionInfo {
  id: string;
  project: string;
  projectPath: string;
  lastModified: string;
  size: number;
}

function discoverSessions(): SessionInfo[] {
  const claudeDir = path.join(app.getPath('home'), '.claude', 'projects');
  if (!fs.existsSync(claudeDir)) return [];

  const sessions: SessionInfo[] = [];
  try {
    const projects = fs.readdirSync(claudeDir);
    for (const project of projects) {
      const projectDir = path.join(claudeDir, project);
      if (!fs.statSync(projectDir).isDirectory()) continue;

      const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
      for (const file of files) {
        const filePath = path.join(projectDir, file);
        try {
          const stat = fs.statSync(filePath);
          const sessionId = file.replace('.jsonl', '');
          // Convert project dir name back to path: E--claude-Code-per → E:/claude-Code/per
          const projectPath = project.replace(/^([A-Z])--/, '$1:/').replace(/-/g, '/');
          sessions.push({
            id: sessionId,
            project: project,
            projectPath: projectPath,
            lastModified: stat.mtime.toISOString(),
            size: stat.size,
          });
        } catch {}
      }
    }
  } catch {}

  // Sort by last modified, most recent first
  sessions.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  return sessions;
}

function findActiveSessionId(): string | null {
  const claudeDir = path.join(app.getPath('home'), '.claude', 'projects');
  try {
    const projects = fs.readdirSync(claudeDir);
    let newest: { id: string; mtime: number } | null = null;
    const now = Date.now();
    for (const project of projects) {
      const projectDir = path.join(claudeDir, project);
      if (!fs.statSync(projectDir).isDirectory()) continue;
      const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
      for (const file of files) {
        const filePath = path.join(projectDir, file);
        try {
          const stat = fs.statSync(filePath);
          // Active session: modified within last 5 minutes
          if (now - stat.mtime.getTime() < 5 * 60 * 1000) {
            if (!newest || stat.mtime.getTime() > newest.mtime) {
              newest = { id: file.replace('.jsonl', ''), mtime: stat.mtime.getTime() };
            }
          }
        } catch {}
      }
    }
    return newest?.id || null;
  } catch {}
  return null;
}

function getProjectDirForSession(sessionId: string): string {
  // Try to find the real project path by scanning session JSONL for cwd info
  const claudeDir = path.join(app.getPath('home'), '.claude', 'projects');
  try {
    const projects = fs.readdirSync(claudeDir);
    for (const project of projects) {
      const sessionFile = path.join(claudeDir, project, sessionId + '.jsonl');
      if (fs.existsSync(sessionFile)) {
        // Read first few lines to find project path
        const content = fs.readFileSync(sessionFile, 'utf-8');
        const lines = content.split('\n').slice(0, 5);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.cwd && fs.existsSync(obj.cwd)) return obj.cwd;
            if (obj.projectPath && fs.existsSync(obj.projectPath)) return obj.projectPath;
          } catch {}
        }
        // Fallback: use process.cwd() (pet's own project directory)
        return process.cwd();
      }
    }
  } catch {}
  return process.cwd();
}

// === IPC: Chat Window ===
ipcMain.handle('chat:get-sessions', () => {
  return discoverSessions();
});

ipcMain.handle('chat:get-config', () => {
  const cfg = loadConfig();
  return { apiKey: cfg.apiKey || '', model: cfg.model || 'claude', baseUrl: cfg.baseUrl || '' };
});

ipcMain.on('chat:save-config', (_, cfg: Record<string, string>) => {
  saveConfig(cfg);
});

ipcMain.on('chat:close', () => {
  chatWindow?.close();
});

// === Chat via Claude Code CLI ===
ipcMain.handle('chat:send', async (_: any, { text, sessionId }: { text: string; sessionId?: string }) => {
  console.log('[Chat] Sending to Claude CLI, session:', sessionId || 'default', 'text:', text.slice(0, 80));
  return new Promise((resolve) => {
    try {
      const args = ['--print', '--output-format', 'text'];
      const projectDir = process.cwd(); // pet's own project directory

      if (sessionId) {
        // Check if this is the currently active session (can't resume active sessions)
        const activeSessionId = findActiveSessionId();
        if (sessionId === activeSessionId) {
          console.log('[Chat] Session is active, using --continue instead');
          args.push('--continue');
        } else {
          args.push('--resume', sessionId);
        }
      } else {
        args.push('--continue');
      }

      console.log('[Chat] CWD:', projectDir, 'args:', args.join(' '));

      const proc = spawn('claude', args, {
        cwd: projectDir,
        shell: true,
        timeout: 120000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        console.log('[Chat] CLI exit code:', code, 'output length:', stdout.length);
        if (code === 0 && stdout.trim()) {
          resolve({ reply: stdout.trim() });
        } else if (stderr.trim()) {
          resolve({ error: stderr.trim().slice(0, 300) });
        } else {
          resolve({ error: 'Claude Code 没有返回回复' });
        }
      });

      proc.on('error', (err) => {
        console.log('[Chat] CLI error:', err.message);
        resolve({ error: '无法启动 Claude Code CLI: ' + err.message });
      });

      proc.stdin.write(text);
      proc.stdin.end();
    } catch (err: any) {
      resolve({ error: '聊天出错: ' + err.message });
    }
  });
});

// === IPC: Settings Window ===
const notifyScriptPath = path.resolve(__dirname, '..', '..', 'src', 'hooks', 'notify.js').replace(/\\/g, '/');

ipcMain.handle('settings:get-config', () => {
  const cfg = loadConfig();
  return {
    apiKey: cfg.apiKey || '',
    model: cfg.model || 'claude',
    baseUrl: cfg.baseUrl || '',
    hookPath: notifyScriptPath,
  };
});

ipcMain.on('settings:save-config', (_, cfg: Record<string, string>) => {
  console.log('[Settings] save-config received:', JSON.stringify(cfg));
  saveConfig(cfg);
});

ipcMain.on('settings:close', () => {
  settingsWindow?.close();
});

// === IPC: Hook events ===
ipcMain.on('hook:event', (_, state: string) => {
  mainWindow?.webContents.send('state:change', state);
});

// === IPC: State tracking ===
ipcMain.on('pet:state-changed', (_, state: string) => {
  currentState = state;
  if (state !== 'idle') {
    stopAutoWalk();
  } else {
    scheduleAutoWalk();
  }
});

// === Auto-Walk ===
const PET_W = 180;
const PET_H = 220;
const MARGIN = 30;

function scheduleAutoWalk() {
  stopAutoWalk();
  if (!walkEnabled) return;
  const delay = 15000 + Math.random() * 25000; // 15-40s
  walkTimer = setTimeout(startAutoWalk, delay);
}

function stopAutoWalk() {
  if (walkTimer) { clearTimeout(walkTimer); walkTimer = null; }
  if (walkAnimFrame) { clearInterval(walkAnimFrame); walkAnimFrame = null; }
  walkTarget = null;
}

function startAutoWalk() {
  if (!mainWindow || isDragging || currentState !== 'idle') return;

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const [cx, cy] = mainWindow.getPosition();

  // Pick random target near bottom of screen
  let tx = MARGIN + Math.random() * (screenW - PET_W - MARGIN * 2);
  let ty = screenH - PET_H - MARGIN + (Math.random() * 40 - 20);

  // Don't walk to same spot — ensure at least 150px distance
  if (Math.abs(tx - cx) < 150) {
    tx = cx > screenW / 2 ? MARGIN + Math.random() * 200 : screenW - PET_W - MARGIN - Math.random() * 200;
  }

  walkTarget = { x: tx, y: ty };
  console.log('[Walk] Start: from', cx, cy, 'to', tx, ty, 'screen', screenW, screenH);

  // Tell renderer to show walk animation and send target
  mainWindow.webContents.send('state:change', 'walk');
  mainWindow.webContents.send('walk:target', walkTarget.x, walkTarget.y);
}

// === App lifecycle ===
app.whenReady().then(() => {
  createWindow();
  createTray();
  startHookServer((event: HookEvent) => {
    mainWindow?.webContents.send('state:change', event.state);
    if (event.task && event.task.tool) {
      mainWindow?.webContents.send('task:update', event.task);
    }
  });
  scheduleAutoWalk();
  autoSetupHooks();
});

// === Hook Auto-Setup ===
function autoSetupHooks() {
  const settingsPath = path.join(app.getPath('home'), '.claude', 'settings.json');
  const notifyPath = path.resolve(__dirname, '..', '..', 'src', 'hooks', 'notify.js').replace(/\\/g, '/');

  try {
    let settings: Record<string, any> = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }

    if (!settings.hooks) settings.hooks = {};

    const hookEntries: Record<string, any[]> = {
      PreToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: `node "${notifyPath}" working` }] }],
      PostToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: `node "${notifyPath}" working` }] }],
      Stop: [{ hooks: [{ type: 'command', command: `node "${notifyPath}" celebrate` }] }],
    };

    let changed = false;
    for (const [hookType, entries] of Object.entries(hookEntries)) {
      if (!settings.hooks[hookType]) settings.hooks[hookType] = [];
      const hasPetHook = settings.hooks[hookType].some((e: any) => {
        if (e.command && e.command.includes('notify.js')) return true;
        if (e.hooks && e.hooks.some((h: any) => h.command && h.command.includes('notify.js'))) return true;
        return false;
      });
      if (!hasPetHook) {
        settings.hooks[hookType].push(...entries);
        changed = true;
        console.log(`[Hooks] Added ${hookType}`);
      }
    }

    if (changed) {
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      console.log('[Hooks] Auto-configured:', settingsPath);
    } else {
      console.log('[Hooks] Already configured');
    }
  } catch (e) {
    console.log('[Hooks] Auto-setup error:', e);
  }
}

app.on('window-all-closed', () => {
  stopHookServer();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
  else mainWindow.show();
});