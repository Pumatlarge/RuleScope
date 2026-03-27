const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// Global error handler
process.on('uncaughtException', (error) => {
    dialog.showErrorBox('Initialization Error', error.stack || error.message);
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

let mainWindow;
let serverProcess;
let serverReady = false;

function createWindow() {
  if (mainWindow) return;
  
  try {
    mainWindow = new BrowserWindow({
      width: 1300,
      height: 900,
      title: "文件分析与检索系统 - 启动中...",
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    mainWindow.setMenuBarVisibility(false);
    
    const loadApp = () => {
      if (serverReady) {
        mainWindow.loadURL('http://localhost:3001').catch((err) => {
            console.error('App load failed, retrying...', err);
            setTimeout(loadApp, 500);
        });
      } else {
        mainWindow.loadFile(path.join(__dirname, 'loading.html'));
      }
    };

    loadApp();
    
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.setTitle("文件分析与检索系统");
    });

    mainWindow.on('closed', function () {
      mainWindow = null;
    });
  } catch (e) {
    dialog.showErrorBox('Window Creation Error', e.message);
  }
}

function startServer() {
  const isProd = app.isPackaged;
  const serverPath = path.join(__dirname, 'server-filemanager.js');
  // For portable app, appRoot should be the dir where the original portable exe is located
  // PORTABLE_EXECUTABLE_DIR is set by electron-builder's portable target
  const appRoot = isProd ? (process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath)) : __dirname;

  console.log('Starting backend server...', serverPath);
  console.log('App Root:', appRoot);

  try {
    serverProcess = fork(serverPath, [], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production', 
        PORT: 3001,
        APP_ROOT: appRoot
      },
      stdio: 'inherit',
      cwd: isProd ? path.dirname(process.execPath) : __dirname
    });

    serverProcess.on('message', (m) => {
      if (m === 'server-ready') {
        serverReady = true;
        if (mainWindow) {
          mainWindow.loadURL('http://localhost:3001');
        } else {
          createWindow();
        }
      }
    });

    serverProcess.on('error', (err) => {
      dialog.showErrorBox('Server Process Error', `Failed to start backend server:\n${err.message}`);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!serverReady) {
        dialog.showErrorBox('Server Crash', `Backend server exited prematurely with code ${code}.\nThis usually means the port 3001 is being used or dependencies are missing.`);
      }
    });

    // Timeout: if not ready in 15 seconds, show error
    setTimeout(() => {
      if (!serverReady) {
        dialog.showErrorBox('Startup Timeout', 'Backend server is taking too long to start.\nPlease check if another instance is running or if port 3001 is occupied.');
      }
    }, 15000);

  } catch (err) {
    dialog.showErrorBox('Fork Error', `Failed to fork server process:\n${err.message}`);
  }
}

app.on('ready', () => {
  createWindow(); // Show window immediately with loading screen
  startServer();  // Start backend in background
});

app.on('window-all-closed', function () {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
