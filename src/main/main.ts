import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { startHookServer, stopHookServer } from './hook-server';

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
    width: 280,
    height: 240,
    x: px - 50,
    y: py - 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'chat-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Lock size to prevent layout-driven growth
  chatWindow.setMinimumSize(280, 240);
  chatWindow.setMaximumSize(280, 240);

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

// === IPC: Chat Window ===
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
  startHookServer((state: string) => {
    mainWindow?.webContents.send('state:change', state);
  });
  // Start auto-walk timer
  scheduleAutoWalk();
});

app.on('window-all-closed', () => {
  stopHookServer();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
  else mainWindow.show();
});