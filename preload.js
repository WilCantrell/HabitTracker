const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getHabits: () => ipcRenderer.invoke('get-habits'),
  saveHabits: (habits) => ipcRenderer.invoke('save-habits', habits),
  getCompletions: () => ipcRenderer.invoke('get-completions'),
  saveCompletions: (completions) => ipcRenderer.invoke('save-completions', completions)
});
