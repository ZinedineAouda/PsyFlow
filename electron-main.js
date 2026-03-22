const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

// Start Express server
// Ensure server.js doesn't try to use things like process.env.PORT incorrectly in production
require('./server.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minHeight: 600,
    minWidth: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: "PsyFlow - Patient Management & Genogram Maker",
    autoHideMenuBar: !isDev,
    backgroundColor: '#f8fafc',
    icon: path.join(__dirname, 'public', 'icon.png')
  });

  // Load the Express server
  // Small delay to ensure server has started
  const targetUrl = 'http://localhost:5000';
  
  if (isDev) {
    mainWindow.loadURL(targetUrl);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(targetUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure only one instance runs
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', createWindow);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
