const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configurar auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Estilo moderno
    titleBarStyle: 'default',
    backgroundColor: '#0f172a',
    show: false // Mostrar cuando esté listo
  });

  // Cargar la app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostrar cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Verificar actualizaciones después de mostrar la ventana
    if (process.env.NODE_ENV !== 'development') {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
      }, 3000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Eventos de auto-updater
autoUpdater.on('checking-for-update', () => {
  console.log('Buscando actualizaciones...');
  sendStatusToWindow('checking-for-update');
});

autoUpdater.on('update-available', (info) => {
  console.log('Actualización disponible:', info.version);
  sendStatusToWindow('update-available', info);
});

autoUpdater.on('update-not-available', () => {
  console.log('No hay actualizaciones disponibles');
  sendStatusToWindow('update-not-available');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Descargando: ${Math.round(progress.percent)}%`);
  sendStatusToWindow('download-progress', progress);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Actualización descargada:', info.version);
  sendStatusToWindow('update-downloaded', info);
  
  // Mostrar diálogo para reiniciar
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Actualización lista',
    message: `La versión ${info.version} está lista para instalar.`,
    detail: '¿Deseas reiniciar ahora para aplicar la actualización?',
    buttons: ['Reiniciar ahora', 'Más tarde'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('Error en auto-updater:', error);
  sendStatusToWindow('update-error', error.message);
});

function sendStatusToWindow(status, data = null) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-status', { status, data });
  }
}

// IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (process.env.NODE_ENV !== 'development') {
    return autoUpdater.checkForUpdatesAndNotify();
  }
  return null;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

// App events
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
