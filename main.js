const { app, BrowserWindow, ipcMain, dialog, screen, globalShortcut, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

// Ensure single instance lock to prevent cache locking conflicts
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    process.exit(0);
}

const APP_ID = 'com.joadsonrocha.lumina';
if (process.platform === 'win32') {
    app.setAppUserModelId(APP_ID);
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

// IPC: App & Developer Info
ipcMain.handle('get-app-info', () => {
    return {
        name: 'Lumina Presentation',
        version: app.getVersion() || '2.0.0',
        author: 'Joadson Rocha',
        authorUrl: 'https://github.com/joadsonrocha',
        repoUrl: 'https://github.com/joadsonrocha/lumina-presentation',
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        v8: process.versions.v8,
        os: `${process.platform} (${process.arch})`
    };
});

// IPC: Export Reordered Folder
ipcMain.handle('export-reordered-folder', async (event, items) => {
    if (!items || items.length === 0) return { success: false, message: 'Nenhuma mídia para exportar' };
    
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecionar pasta de destino para exportação',
        properties: ['openDirectory', 'createDirectory']
    });

    if (canceled || filePaths.length === 0) return { success: false, message: 'Exportação cancelada' };

    const destDir = filePaths[0];
    const padLength = String(items.length).length < 2 ? 2 : String(items.length).length;
    let copiedCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.path || !fs.existsSync(item.path)) continue;

        const numPrefix = String(i + 1).padStart(padLength, '0');
        const ext = path.extname(item.path);
        const baseNameWithoutExt = path.basename(item.path, ext);
        const newFileName = `${numPrefix}_${baseNameWithoutExt}${ext}`;
        const destPath = path.join(destDir, newFileName);

        try {
            await fs.promises.copyFile(item.path, destPath);
            copiedCount++;
        } catch (err) {
            console.error(`Erro ao copiar ${item.path} para ${destPath}:`, err);
        }
    }

    return {
        success: true,
        count: copiedCount,
        destDir: destDir,
        message: `${copiedCount} arquivos exportados com sucesso para ${destDir}`
    };
});

// IPC: Save Lumina Project File (.lumina / JSON)
ipcMain.handle('save-project-file', async (event, projectData) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Salvar Projeto de Apresentação',
        defaultPath: 'minha_apresentacao.lumina',
        filters: [
            { name: 'Projeto Lumina (*.lumina)', extensions: ['lumina'] },
            { name: 'Arquivo JSON (*.json)', extensions: ['json'] }
        ]
    });

    if (canceled || !filePath) return { success: false, message: 'Salvamento cancelado' };

    try {
        await fs.promises.writeFile(filePath, JSON.stringify(projectData, null, 2), 'utf-8');
        return { success: true, filePath, message: 'Projeto salvo com sucesso' };
    } catch (err) {
        return { success: false, message: err.message };
    }
});

// IPC: Load Lumina Project File (.lumina / JSON)
ipcMain.handle('load-project-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Abrir Projeto Lumina',
        filters: [
            { name: 'Projeto Lumina (*.lumina)', extensions: ['lumina'] },
            { name: 'Arquivo JSON (*.json)', extensions: ['json'] }
        ],
        properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { success: false };

    try {
        const content = await fs.promises.readFile(filePaths[0], 'utf-8');
        const projectData = JSON.parse(content);
        return { success: true, projectData, filePath: filePaths[0] };
    } catch (err) {
        return { success: false, message: 'Arquivo de projeto inválido: ' + err.message };
    }
});

// IPC: Save Image Snapshot File
ipcMain.handle('save-image-file', async (event, { dataUrl, defaultName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Salvar Imagem',
        defaultPath: defaultName || 'slide_lumina.png',
        filters: [
            { name: 'Imagem PNG (*.png)', extensions: ['png'] },
            { name: 'Imagem JPEG (*.jpg)', extensions: ['jpg', 'jpeg'] }
        ]
    });

    if (canceled || !filePath) return { success: false };

    try {
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.promises.writeFile(filePath, buffer);
        return { success: true, filePath, message: 'Imagem salva com sucesso' };
    } catch (err) {
        return { success: false, message: err.message };
    }
});

// IPC: Export to PowerPoint (.pptx)
ipcMain.handle('export-pptx', async (event, items) => {
    if (!items || items.length === 0) return { success: false, message: 'Nenhuma mídia para exportar' };

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Apresentação para PowerPoint (.pptx)',
        defaultPath: 'apresentacao.pptx',
        filters: [{ name: 'Apresentação PowerPoint (*.pptx)', extensions: ['pptx'] }]
    });

    if (canceled || !filePath) return { success: false, message: 'Exportação cancelada' };

    try {
        const pres = new pptxgen();
        pres.layout = 'LAYOUT_16x9';
        pres.author = 'Lumina Presentation';
        pres.title = 'Apresentação Lumina';

        for (const item of items) {
            const slide = pres.addSlide();
            slide.background = { color: '000000' };

            if (item.type === 'image' && fs.existsSync(item.path)) {
                slide.addImage({
                    path: item.path,
                    x: 0,
                    y: 0,
                    w: '100%',
                    h: '100%',
                    sizing: { type: 'contain', w: '100%', h: '100%' }
                });
            } else if (item.type === 'video') {
                slide.addText(`🎬 Vídeo: ${item.name}`, {
                    x: 1,
                    y: 3.2,
                    w: 8,
                    h: 1.5,
                    color: 'FFFFFF',
                    fontSize: 24,
                    align: 'center'
                });
            }
        }

        await pres.writeFile({ fileName: filePath });
        return { success: true, filePath, message: 'Apresentação PowerPoint (.pptx) gerada com sucesso!' };
    } catch (err) {
        console.error('PPTX Export error:', err);
        return { success: false, message: 'Erro ao gerar PPTX: ' + err.message };
    }
});

// IPC: Export to PDF Document (.pdf)
ipcMain.handle('export-pdf', async (event, items) => {
    if (!items || items.length === 0) return { success: false, message: 'Nenhuma mídia para exportar' };

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Apresentação para PDF (.pdf)',
        defaultPath: 'apresentacao.pdf',
        filters: [{ name: 'Documento PDF (*.pdf)', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return { success: false, message: 'Exportação cancelada' };

    let pdfWin = null;
    try {
        const slidesHtml = items.map(item => {
            if (item.type === 'image') {
                const imgUri = 'file:///' + item.path.replace(/\\/g, '/');
                return `<div class="slide"><img src="${imgUri}" alt="${item.name}"></div>`;
            } else {
                return `<div class="slide"><div class="video-card">🎬 ${item.name}</div></div>`;
            }
        }).join('\n');

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: 297mm 167.06mm; /* 16:9 Landscape */
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000000; }
  .slide {
    width: 100vw;
    height: 100vh;
    page-break-after: always;
    page-break-inside: avoid;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000000;
    overflow: hidden;
  }
  .slide img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .video-card {
    color: #ffffff;
    font-family: sans-serif;
    font-size: 32px;
    font-weight: bold;
    background: #18181c;
    padding: 30px 60px;
    border-radius: 16px;
    border: 1px solid #333;
  }
</style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;

        pdfWin = new BrowserWindow({
            show: false,
            width: 1920,
            height: 1080,
            webPreferences: {
                webSecurity: false
            }
        });

        await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
        await new Promise(resolve => setTimeout(resolve, 800));

        const pdfBuffer = await pdfWin.webContents.printToPDF({
            landscape: true,
            printBackground: true,
            margins: { marginType: 'none' }
        });

        await fs.promises.writeFile(filePath, pdfBuffer);
        return { success: true, filePath, message: 'Documento PDF (.pdf) gerado com sucesso!' };
    } catch (err) {
        console.error('PDF Export error:', err);
        return { success: false, message: 'Erro ao gerar PDF: ' + err.message };
    } finally {
        if (pdfWin && !pdfWin.isDestroyed()) {
            pdfWin.close();
        }
    }
});
