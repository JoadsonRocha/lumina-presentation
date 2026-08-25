const { app, BrowserWindow, ipcMain, dialog, screen, globalShortcut, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Disable default menu
Menu.setApplicationMenu(null);

let mainWindow = null;
let presentationWindow = null;
let currentProjectionState = null;

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']);
const SUPPORTED_VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'ogg']);
const SUPPORTED_AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']);

function getMediaType(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    if (SUPPORTED_IMAGE_EXTENSIONS.has(ext)) return 'image';
    if (SUPPORTED_VIDEO_EXTENSIONS.has(ext)) return 'video';
    return null;
}

async function scanDirectoryForMedia(dirPath) {
    const mediaFiles = [];
    
    async function scan(currentDir, depth = 0) {
        if (depth > 3) return; // Prevent excessive recursion
        try {
            const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath, depth + 1);
                } else if (entry.isFile()) {
                    const type = getMediaType(entry.name);
                    if (type) {
                        mediaFiles.push({
                            path: fullPath,
                            name: entry.name,
                            type: type
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error scanning folder:', currentDir, err);
        }
    }

    await scan(dirPath);
    return mediaFiles;
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 960,
        minHeight: 680,
        title: 'Lumina Presentation',
        backgroundColor: '#070709',
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false // Sandbox false allows preload full IPC capabilities
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
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('projection-status-changed', false);
        }
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
            sandbox: false
        }
    });

    presentationWindow.loadFile('presentation.html');

    presentationWindow.on('closed', () => {
        presentationWindow = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('projection-status-changed', false);
        }
    });

    presentationWindow.webContents.once('did-finish-load', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('projection-status-changed', true);
        }
        if (currentProjectionState) {
            presentationWindow.webContents.send('sync-projection', currentProjectionState);
        }
    });
}

app.whenReady().then(() => {
    createMainWindow();

    // Register F5 shortcut for projection
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

// IPC Handlers: Media Selection
ipcMain.handle('select-media', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecionar Fotos e Vídeos',
        properties: ['openFile', 'multiSelections'],
        filters: [
            { 
                name: 'Mídias (Fotos e Vídeos)', 
                extensions: [
                    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif',
                    'mp4', 'webm', 'mov', 'mkv', 'avi'
                ] 
            },
            { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'] },
            { name: 'Vídeos', extensions: ['mp4', 'webm', 'mov', 'mkv', 'avi'] },
            { name: 'Todos os Arquivos', extensions: ['*'] }
        ]
    });

    if (result.canceled || !result.filePaths) return [];

    return result.filePaths.map(filePath => ({
        path: filePath,
        name: path.basename(filePath),
        type: getMediaType(filePath) || 'image'
    }));
});

// IPC Handlers: Folder Selection
ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecionar Pasta com Fotos e Vídeos',
        properties: ['openDirectory']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return [];
    }

    const folderPath = result.filePaths[0];
    return await scanDirectoryForMedia(folderPath);
});

// IPC Handlers: Audio Selection
ipcMain.handle('select-audio', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecionar Músicas de Fundo',
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Arquivos de Áudio', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'] }
        ]
    });

    if (result.canceled || !result.filePaths) return [];

    return result.filePaths.map(filePath => ({
        path: filePath,
        name: path.basename(filePath)
    }));
});

// IPC Handlers: Parse Dropped Files
ipcMain.handle('parse-dropped-paths', async (event, paths) => {
    const mediaList = [];
    for (const itemPath of paths) {
        try {
            const stats = await fs.promises.stat(itemPath);
            if (stats.isDirectory()) {
                const subMedia = await scanDirectoryForMedia(itemPath);
                mediaList.push(...subMedia);
            } else if (stats.isFile()) {
                const type = getMediaType(itemPath);
                if (type) {
                    mediaList.push({
                        path: itemPath,
                        name: path.basename(itemPath),
                        type: type
                    });
                }
            }
        } catch (err) {
            console.error('Error handling dropped path:', itemPath, err);
        }
    }
    return mediaList;
});

// State Syncing with Projection
ipcMain.on('sync-projection', (event, state) => {
    currentProjectionState = state;
    if (presentationWindow && !presentationWindow.isDestroyed()) {
        presentationWindow.webContents.send('sync-projection', state);
    }
});

// Stage Commands (Blackout, Whiteout, etc.)
ipcMain.on('stage-command', (event, command) => {
    if (presentationWindow && !presentationWindow.isDestroyed()) {
        presentationWindow.webContents.send('stage-command', command);
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

ipcMain.handle('get-projection-status', () => {
    return presentationWindow !== null && !presentationWindow.isDestroyed();
});

ipcMain.on('toggle-fullscreen-main', () => {
    if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
});

// Navigation from Projector to Main
ipcMain.on('navigate-next', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('navigate', 'next');
});

ipcMain.on('navigate-prev', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('navigate', 'prev');
});

ipcMain.on('open-url', (event, url) => {
    shell.openExternal(url);
});

// Auto-Updater Logic
ipcMain.on('check-for-updates', () => {
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-message', {
                status: 'info',
                message: 'O auto-updater está em modo de desenvolvimento (versão 2.0.0).'
            });
        }
    }
});

autoUpdater.on('update-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-message', {
            status: 'available',
            message: 'Uma nova versão do Lumina está disponível para download!'
        });
    }
});

autoUpdater.on('update-not-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-message', {
            status: 'not-available',
            message: 'Você já está usando a versão mais recente do Lumina.'
        });
    }
});

autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-message', {
            status: 'error',
            message: 'Erro ao verificar atualizações: ' + err.message
        });
    }
});
