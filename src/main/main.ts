import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { startHookServer, stopHookServer } from './hook-server';

let mainWindow: BrowserWindow | null = null;
let chatWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isDragging = false;

// Config
const configPath = path.join(app.getPath('userData'), 'pet-config.json');

function loadConfig(): Record<string, string> {
  try {
    if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {}
  return {};
}

function saveConfig(cfg: Record<string, string>) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
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

function createTray() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.ico');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示宠物', click: () => mainWindow?.show() },
    { label: '隐藏宠物', click: () => mainWindow?.hide() },
    { label: '聊天...', click: () => createChatWindow() },
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

ipcMain.on('pet:drag-start', () => { isDragging = true; });
ipcMain.on('pet:drag-end', () => { isDragging = false; });
ipcMain.handle('pet:is-dragging', () => isDragging);

ipcMain.on('pet:open-chat', () => createChatWindow());

ipcMain.on('pet:context-menu', () => {
  if (!mainWindow) return;
  const menu = Menu.buildFromTemplate([
    { label: '聊天', click: () => createChatWindow() },
    { type: 'separator' },
    { label: '切换状态', enabled: false },
    { label: '  待机', click: () => mainWindow?.webContents.send('state:change', 'idle') },
    { label: '  工作中', click: () => mainWindow?.webContents.send('state:change', 'working') },
    { label: '  说话', click: () => mainWindow?.webContents.send('state:change', 'talking') },
    { label: '  庆祝', click: () => mainWindow?.webContents.send('state:change', 'celebrate') },
    { label: '  错误', click: () => mainWindow?.webContents.send('state:change', 'error') },
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
  return { apiKey: cfg.apiKey || '' };
});

ipcMain.on('chat:save-config', (_, cfg: Record<string, string>) => {
  saveConfig(cfg);
});

ipcMain.on('chat:close', () => {
  chatWindow?.close();
});

// === IPC: Hook events ===
ipcMain.on('hook:event', (_, state: string) => {
  mainWindow?.webContents.send('state:change', state);
});

// === App lifecycle ===
app.whenReady().then(() => {
  createWindow();
  createTray();
  startHookServer((state: string) => {
    mainWindow?.webContents.send('state:change', state);
  });
});

app.on('window-all-closed', () => {
  stopHookServer();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
  else mainWindow.show();
});