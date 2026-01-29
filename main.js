const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile('index.html');
}

// IPC handlers for data persistence
ipcMain.handle('get-habits', () => {
  return store.get('habits', []);
});

ipcMain.handle('save-habits', (event, habits) => {
  store.set('habits', habits);
  return true;
});

ipcMain.handle('get-completions', () => {
  return store.get('completions', {});
});

ipcMain.handle('save-completions', (event, completions) => {
  store.set('completions', completions);
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
