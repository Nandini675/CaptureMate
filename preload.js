const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startCapturing: (settings) => ipcRenderer.invoke('start-capturing', settings),
  stopCapturing: () => ipcRenderer.invoke('stop-capturing'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  setFolder: (folderPath) => ipcRenderer.send('set-folder', folderPath),

  checkPassword: (pw) => ipcRenderer.invoke('check-password', pw),
  onScreenshotTaken: (callback) => ipcRenderer.on('screenshot-taken', (event, filename) => callback(filename)),
  openFile: (filePath) => ipcRenderer.send('open-file', filePath)
});

