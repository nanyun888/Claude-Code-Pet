import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } from 'electron';
import * as path from 'path';
import { startHookServer, stopHookServer } from './hook-server';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isDragging = false;

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

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setIgnoreMouseEvents(false);

  // Prevent window from being closed
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });
}

function createTray() {
  // Create a simple 16x16 icon
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Pet', click: () => mainWindow?.show() },
    { label: 'Hide Pet', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Reset Position', click: () => resetPosition() },
    { type: 'separator' },
    { label: 'Quit', click: () => { mainWindow?.destroy(); app.quit(); } },
  ]);

  tray.setToolTip('Claude Code Pet');
  tray.setContextMenu(contextMenu);
}

function resetPosition() {
  if (!mainWindow) return;
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(screenW - 250, screenH - 280);
}

// IPC handlers
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

// Hook event handler
ipcMain.on('hook:event', (_, state: string) => {
  mainWindow?.webContents.send('state:change', state);
});

// App lifecycle
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