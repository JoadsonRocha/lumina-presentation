const { app, BrowserWindow, ipcMain, dialog, screen, globalShortcut, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Ensure single instance lock to prevent cache locking conflicts
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    process.exit(0);
}

// Disable problematic disk cache flags on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

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
        if (depth > 4) return;
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

function getTargetDisplay() {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    // Prefer secondary display if available
    const secondaryDisplay = displays.find(d => d.id !== primaryDisplay.id);
    return {
        display: secondaryDisplay || primaryDisplay,
        isSecondary: Boolean(secondaryDisplay),
        allDisplays: displays
    };
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 960,
        minHeight: 680,
        title: 'Lumina Presentation',
        backgroundColor: '#09090b',
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        show: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        if (presentationWindow && !presentationWindow.isDestroyed()) {
            presentationWindow.close();
        }
        mainWindow = null;
    });

    // Notify renderer on resize / fullscreen changes
    mainWindow.on('enter-full-screen', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('main-fullscreen-changed', true);
        }
    });

    mainWindow.on('leave-full-screen', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('main-fullscreen-changed', false);
        }
    });
}

function togglePresentation() {
    if (presentationWindow && !presentationWindow.isDestroyed()) {
        presentationWindow.close();
        presentationWindow = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('projection-status-changed', false);
        }
        return;
    }

    const { display, isSecondary } = getTargetDisplay();

    presentationWindow = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        fullscreen: true,
        frame: false,
        backgroundColor: '#000000',
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        show: false
    });

    presentationWindow.setBounds(display.bounds);
    presentationWindow.setFullScreen(true);
    presentationWindow.loadFile('presentation.html');

    presentationWindow.once('ready-to-show', () => {
        presentationWindow.show();
        presentationWindow.setFullScreen(true);
    });

    presentationWindow.on('closed', () => {
        presentationWindow = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('projection-status-changed', false);
        }
    });

    presentationWindow.webContents.once('did-finish-load', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('projection-status-changed', true);
            mainWindow.webContents.send('request-sync-state');
        }
        if (currentProjectionState) {
            presentationWindow.webContents.send('sync-projection', currentProjectionState);
        }
    });
}

app.whenReady().then(() => {
    createMainWindow();

    // Register local/global shortcuts safely
    globalShortcut.register('F5', () => {
        togglePresentation();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC: Media Selection
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

// IPC: Folder Selection
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

// IPC: Audio Selection
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

// IPC: Dragged paths
ipcMain.handle('parse-dropped-paths', async (event, paths) => {
    if (!Array.isArray(paths)) return [];
    const mediaList = [];
    for (const itemPath of paths) {
        if (!itemPath || typeof itemPath !== 'string' || !itemPath.trim()) continue;
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

// IPC: Projection Sync & Stage Commands
ipcMain.on('sync-projection', (event, state) => {
    currentProjectionState = state;
    if (presentationWindow && !presentationWindow.isDestroyed()) {
        presentationWindow.webContents.send('sync-projection', state);
    }
});

ipcMain.on('stage-command', (event, command) => {
    if (presentationWindow && !presentationWindow.isDestroyed()) {
        presentationWindow.webContents.send('stage-command', command);
    }
});

ipcMain.on('close-presentation', () => {
    if (presentationWindow && !presentationWindow.isDestroyed()) {
        presentationWindow.close();
        presentationWindow = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('projection-status-changed', false);
        }
    }
});

ipcMain.on('toggle-presentation', () => {
    togglePresentation();
});

ipcMain.handle('get-projection-status', () => {
    return presentationWindow !== null && !presentationWindow.isDestroyed();
});

// IPC: Main Window Fullscreen
ipcMain.on('toggle-fullscreen-main', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        const isFull = !mainWindow.isFullScreen();
        mainWindow.setFullScreen(isFull);
    }
});

ipcMain.handle('is-fullscreen-main', () => {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isFullScreen() : false;
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
                message: 'Versão de desenvolvimento 2.0.0.'
            });
        }
    }
});

autoUpdater.on('update-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-message', {
            status: 'available',
            message: 'Uma nova versão do Lumina está disponível!'
        });
    }
});

autoUpdater.on('update-not-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-message', {
            status: 'not-available',
            message: 'Você já está usando a versão mais recente.'
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
