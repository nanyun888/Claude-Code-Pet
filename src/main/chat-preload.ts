import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('chatBridge', {
  getConfig: () => ipcRenderer.invoke('chat:get-config'),
  saveConfig: (cfg: Record<string, string>) => ipcRenderer.send('chat:save-config', cfg),
  close: () => ipcRenderer.send('chat:close'),
});