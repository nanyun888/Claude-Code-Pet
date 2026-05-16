import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('chatBridge', {
  getConfig: () => ipcRenderer.invoke('chat:get-config'),
  saveConfig: (cfg: Record<string, string>) => ipcRenderer.send('chat:save-config', cfg),
  close: () => ipcRenderer.send('chat:close'),
  getSessions: () => ipcRenderer.invoke('chat:get-sessions'),
  send: (text: string, sessionId?: string) => ipcRenderer.invoke('chat:send', { text, sessionId }),
  onStream: (callback: (text: string) => void) => {
    ipcRenderer.on('chat:stream', (_, text) => callback(text));
  },
});
