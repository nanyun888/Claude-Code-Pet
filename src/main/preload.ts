import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('petBridge', {
  // Position
  move: (x: number, y: number) => ipcRenderer.send('pet:move', x, y),
  getPosition: () => ipcRenderer.sendSync('pet:get-position'),
  getScreenSize: () => ipcRenderer.sendSync('pet:get-screen-size'),

  // Drag
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  isDragging: () => ipcRenderer.invoke('pet:is-dragging'),

  // State
  onStateChange: (callback: (state: string) => void) => {
    ipcRenderer.on('state:change', (_, state) => callback(state));
  },

  // Chat
  openChat: () => ipcRenderer.send('pet:open-chat'),

  // Context menu
  showContextMenu: () => ipcRenderer.send('pet:context-menu'),

  // State change notification
  stateChanged: (state: string) => ipcRenderer.send('pet:state-changed', state),

  // Task update from hooks
  onTaskUpdate: (callback: (task: any) => void) => {
    ipcRenderer.on('task:update', (_, task) => callback(task));
  },

  // Walk target handler (main → renderer)
  onWalkTarget: (callback: (x: number, y: number) => void) => {
    ipcRenderer.on('walk:target', (_, x, y) => callback(x, y));
  },

  // Hook event from main
  sendHookEvent: (state: string) => ipcRenderer.send('hook:event', state),
});