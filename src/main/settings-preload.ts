import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('settingsBridge', {
  getConfig: () => ipcRenderer.invoke('settings:get-config'),
  saveConfig: (cfg: Record<string, string>) => {
    console.log('[SettingsPreload] saveConfig called with:', JSON.stringify(cfg));
    ipcRenderer.send('settings:save-config', cfg);
  },
  close: () => ipcRenderer.send('settings:close'),
});