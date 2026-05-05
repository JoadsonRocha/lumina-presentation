const { app, BrowserWindow, ipcMain, dialog, screen, globalShortcut, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Disable default menu
Menu.setApplicationMenu(null);

let mainWindow;
let presentationWindow = null;
let currentImagePath = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 700,
        title: 'Lumina Presentation',
        backgroundColor: '#0a0a0c',
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
        show: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        if (presentationWindow) presentationWindow.close();
        mainWindow = null;
    });
}

function togglePresentation() {
    const displays = screen.getAllDisplays();
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
    });

    if (presentationWindow) {
        presentationWindow.close();
        presentationWindow = null;
        return;
    }

    const displayToUse = externalDisplay || screen.getPrimaryDisplay();

    presentationWindow = new BrowserWindow({
        x: displayToUse.bounds.x,
        y: displayToUse.bounds.y,
        width: displayToUse.bounds.width,
        height: displayToUse.bounds.height,
        fullscreen: true,
        frame: false,
        backgroundColor: '#000000',
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    presentationWindow.loadFile('presentation.html');

    presentationWindow.on('closed', () => {
        presentationWindow = null;
    });

    // Send the current image if available
    if (currentImagePath) {
        presentationWindow.webContents.once('did-finish-load', () => {
            presentationWindow.webContents.send('update-image', currentImagePath);
        });
    }
}

app.whenReady().then(() => {
    createMainWindow();

    // Register F5 shortcut
    globalShortcut.register('F5', () => {
        togglePresentation();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('select-images', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }
        ]
    });
    return result.filePaths;
});

ipcMain.on('image-changed', (event, imagePath) => {
    currentImagePath = imagePath;
    if (presentationWindow) {
        presentationWindow.webContents.send('update-image', imagePath);
    }
});

ipcMain.on('close-presentation', () => {
    if (presentationWindow) {
        presentationWindow.close();
    }
});

ipcMain.on('toggle-presentation', () => {
    togglePresentation();
});

// Auto-Updater Logic
ipcMain.on('check-for-updates', () => {
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    } else {
        // Mock feedback for development
        mainWindow.webContents.send('update-message', 'O auto-updater só funciona em apps compilados.');
    }
});

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-message', 'Uma nova atualização está disponível!');
});

autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-message', 'Você já está usando a versão mais recente.');
});

autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-message', 'Erro ao verificar atualizações: ' + err.message);
});



ipcMain.on('navigate-next', () => {
    if (mainWindow) mainWindow.webContents.send('navigate', 'next');
});

ipcMain.on('navigate-prev', () => {
    if (mainWindow) mainWindow.webContents.send('navigate', 'prev');
});

ipcMain.on('open-url', (event, url) => {
    shell.openExternal(url);
});


