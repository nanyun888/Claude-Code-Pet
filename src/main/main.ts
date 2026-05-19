import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { startHookServer, stopHookServer, HookEvent } from './hook-server';

// i18n
const i18nPath = path.join(__dirname, '..', 'renderer', 'i18n.js');
let i18n: { initI18n: (l?: string) => void; t: (k: string) => string; getLang: () => string; setLang: (l: string) => void } | null = null;
try {
  i18n = require(i18nPath);
} catch {}
function t(key: string): string { return i18n?.t(key) || key; }

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
    positionChatToFollowPet();
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });
}

function positionChatToFollowPet() {
  if (!mainWindow || !chatWindow || chatWindow.isDestroyed()) return;
  const [px, py] = mainWindow.getPosition();
  const cfg = loadConfig();
  const cw = parseInt(cfg.chatWidth) || 300;
  const ch = parseInt(cfg.chatHeight) || 320;
  const cx = px - Math.round((cw - 180) / 2);
  const cy = py - ch + 15;
  chatWindow.setPosition(Math.max(0, cx), Math.max(0, cy));
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
  const cfg = loadConfig();
  const chatW = parseInt(cfg.chatWidth) || 300;
  const chatH = parseInt(cfg.chatHeight) || 320;

  // Position just above pet's head
  const cx = px - Math.round((chatW - 180) / 2);
  const cy = py - chatH + 15;

  chatWindow = new BrowserWindow({
    width: chatW,
    height: chatH,
    x: Math.max(0, cx),
    y: Math.max(0, cy),
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

  // Save window size on resize (throttled)
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  chatWindow.on('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (chatWindow && !chatWindow.isDestroyed()) {
        const [w, h] = chatWindow.getSize();
        saveConfig({ chatWidth: String(w), chatHeight: String(h) });
      }
    }, 500);
  });

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
    title: t('settings_title'),
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
    { label: t('tray_show'), click: () => mainWindow?.show() },
    { label: t('tray_hide'), click: () => mainWindow?.hide() },
    { label: t('tray_chat'), click: () => createChatWindow() },
    { label: t('tray_settings'), click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: t('tray_reset'), click: () => resetPosition() },
    { label: t('tray_reconfig'), click: () => { saveConfig({ hooksConfigured: '' }); autoSetupHooks(); } },
    { type: 'separator' },
    { label: t('tray_exit'), click: () => { mainWindow?.destroy(); app.quit(); } },
  ]);

  tray.setToolTip('Claude Code Pet');
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

// === Character System ===
const CHARACTER_IDS = ['fox', 'cat'];
const CHARACTER_NAMES: Record<string, Record<string, string>> = {
  fox: { zh: '小狐狸', en: 'Fox' },
  cat: { zh: '小猫咪', en: 'Cat' },
};

ipcMain.on('pet:get-character-id', (e) => {
  const cfg = loadConfig();
  e.returnValue = cfg.characterId || 'fox';
});

ipcMain.on('pet:switch-character', (_, id: string) => {
  saveConfig({ characterId: id });
  mainWindow?.webContents.send('state:change', 'character:' + id);
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
    { label: t('menu_chat'), click: () => createChatWindow() },
    { label: t('menu_settings'), click: () => createSettingsWindow() },
    { type: 'separator' },
    {
      label: t('menu_switch_state'),
      submenu: [
        { label: t('menu_idle'), click: () => mainWindow?.webContents.send('state:change', 'idle') },
        { label: t('menu_working'), click: () => mainWindow?.webContents.send('state:change', 'working') },
        { label: t('menu_talking'), click: () => mainWindow?.webContents.send('state:change', 'talking') },
        { label: t('menu_celebrate'), click: () => mainWindow?.webContents.send('state:change', 'celebrate') },
        { label: t('menu_error'), click: () => mainWindow?.webContents.send('state:change', 'error') },
      ],
    },
    {
      label: t('menu_walk'),
      submenu: [
        { label: (walkEnabled ? '✓ ' : '  ') + t('menu_on'), click: () => { walkEnabled = true; scheduleAutoWalk(); } },
        { label: (!walkEnabled ? '✓ ' : '  ') + t('menu_off'), click: () => { walkEnabled = false; stopAutoWalk(); } },
      ],
    },
    {
      label: t('menu_switch_char') || '切换形象',
      submenu: CHARACTER_IDS.map(id => {
        const cfg = loadConfig();
        const currentId = cfg.characterId || 'fox';
        const lang = i18n?.getLang() || 'zh';
        return {
          label: (id === currentId ? '✓ ' : '  ') + (CHARACTER_NAMES[id]?.[lang] || id),
          click: () => {
            saveConfig({ characterId: id });
            mainWindow?.webContents.send('state:change', 'character:' + id);
          },
        };
      }),
    },
    { type: 'separator' },
    { label: t('menu_reset_pos'), click: () => resetPosition() },
    { label: t('menu_hide'), click: () => mainWindow?.hide() },
    { label: t('menu_exit'), click: () => { mainWindow?.destroy(); app.quit(); } },
  ]);
  menu.popup({ window: mainWindow });
});

// === Session Discovery ===
interface SessionInfo {
  id: string;
  project: string;
  cwd: string;
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
          // Extract cwd from session JSONL
          let cwd = '';
          const fd = fs.openSync(filePath, 'r');
          const buf = Buffer.alloc(2000);
          const bytesRead = fs.readSync(fd, buf, 0, 2000, 0);
          fs.closeSync(fd);
          const head = buf.slice(0, bytesRead).toString('utf-8');
          const cwdMatch = head.match(/"cwd":"([^"]+)"/);
          if (cwdMatch) cwd = cwdMatch[1].replace(/\\\\/g, '\\');

          sessions.push({ id: sessionId, project, cwd, lastModified: stat.mtime.toISOString(), size: stat.size });
        } catch {}
      }
    }
  } catch {}

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
  const sessions = discoverSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session?.cwd && fs.existsSync(session.cwd)) return session.cwd;
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

// === Chat via Claude Code CLI (streaming) ===
ipcMain.handle('chat:send', async (_: any, { text, sessionId }: { text: string; sessionId?: string }) => {
  console.log('[Chat] Send:', text.slice(0, 80), 'session:', sessionId || 'default');
  return new Promise((resolve) => {
    try {
      const args = ['--print', '--output-format', 'stream-json', '--verbose'];
      let projectDir = process.cwd();

      if (sessionId) {
        projectDir = getProjectDirForSession(sessionId);
        args.push('--resume', sessionId);
      } else {
        const sessions = discoverSessions();
        const activeId = findActiveSessionId();
        const recent = sessions.find(s => s.id !== activeId);
        if (recent) {
          projectDir = recent.cwd || projectDir;
          args.push('--resume', recent.id);
          console.log('[Chat] Auto-selected session:', recent.id);
        } else {
          args.push('--continue');
        }
      }

      console.log('[Chat] CWD:', projectDir, 'args:', args.join(' '));

      const proc = spawn('claude', args, { cwd: projectDir, shell: true, timeout: 120000 });
      let buf = '';
      let settled = false;

      proc.stdout.on('data', (data: Buffer) => {
        buf += data.toString();
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);

            // Stream text chunks to renderer
            if (obj.type === 'assistant' && obj.message?.content) {
              const textParts = obj.message.content
                .filter((c: any) => c.type === 'text')
                .map((c: any) => c.text)
                .join('');
              if (textParts) {
                chatWindow?.webContents.send('chat:stream', textParts);
              }
            }

            // Final result
            if (obj.type === 'result' && !settled) {
              settled = true;
              if (obj.is_error) {
                resolve({ error: obj.result || 'Claude Code error' });
              } else {
                resolve({ reply: obj.result || '' });
              }
            }
          } catch {}
        }
      });

      let stderr = '';
      proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        console.log('[Chat] Exit code:', code);
        if (!settled) {
          settled = true;
          if (stderr.trim()) {
            resolve({ error: stderr.trim().slice(0, 300) });
          } else {
            resolve({ error: 'Claude Code 没有返回回复' });
          }
        }
      });

      proc.on('error', (err) => {
        if (!settled) {
          settled = true;
          resolve({ error: t('chat_cli_error') + err.message });
        }
      });

      proc.stdin.write(text);
      proc.stdin.end();
    } catch (err: any) {
      resolve({ error: t('chat_generic_error') + err.message });
    }
  });
});

ipcMain.on('chat:close', () => {
  chatWindow?.close();
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
  // Update language if changed
  if (cfg.lang) {
    i18n?.setLang(cfg.lang as any);
    console.log('[i18n] Language changed to:', cfg.lang);
    // Notify pet window
    mainWindow?.webContents.send('state:change', 'lang:' + cfg.lang);
    // Recreate tray with new language
    if (tray) { tray.destroy(); tray = null; }
    createTray();
  }
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
  if (state === 'walk') return; // Don't stop walk animation
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

  // Tell renderer to show walk animation and send target
  mainWindow.webContents.send('state:change', 'walk');
  mainWindow.webContents.send('walk:target', walkTarget.x, walkTarget.y);
}

// === App lifecycle ===
app.whenReady().then(() => {
  // Initialize i18n with saved language
  const cfg = loadConfig();
  i18n?.initI18n(cfg.lang);
  console.log('[i18n] Language:', i18n?.getLang() || 'zh');

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