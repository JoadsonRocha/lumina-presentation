const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Media selection & parsing
    selectMedia: () => ipcRenderer.invoke('select-media'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    selectAudio: () => ipcRenderer.invoke('select-audio'),
    parseDroppedPaths: (paths) => ipcRenderer.invoke('parse-dropped-paths', paths),

    // Projection sync & controls
    syncProjection: (state) => ipcRenderer.send('sync-projection', state),
    onSyncProjection: (callback) => ipcRenderer.on('sync-projection', (event, state) => callback(state)),
    onRequestSyncState: (callback) => ipcRenderer.on('request-sync-state', () => callback()),
    sendStageCommand: (command) => ipcRenderer.send('stage-command', command),
    onStageCommand: (callback) => ipcRenderer.on('stage-command', (event, cmd) => callback(cmd)),
    
    togglePresentation: () => ipcRenderer.send('toggle-presentation'),
    closePresentation: () => ipcRenderer.send('close-presentation'),
    getProjectionStatus: () => ipcRenderer.invoke('get-projection-status'),
    onProjectionStatusChanged: (callback) => ipcRenderer.on('projection-status-changed', (event, isLive) => callback(isLive)),

    // Navigation
    navigateNext: () => ipcRenderer.send('navigate-next'),
    navigatePrev: () => ipcRenderer.send('navigate-prev'),
    onNavigate: (callback) => ipcRenderer.on('navigate', (event, direction) => callback(direction)),

    // Window controls
    toggleFullscreenMain: () => ipcRenderer.send('toggle-fullscreen-main'),
    isFullscreenMain: () => ipcRenderer.invoke('is-fullscreen-main'),
    onMainFullscreenChanged: (callback) => ipcRenderer.on('main-fullscreen-changed', (event, isFull) => callback(isFull)),

    // Export & Projects
    exportReorderedFolder: (items) => ipcRenderer.invoke('export-reordered-folder', items),
    saveProjectFile: (projectData) => ipcRenderer.invoke('save-project-file', projectData),
    loadProjectFile: () => ipcRenderer.invoke('load-project-file'),
    saveImageFile: (dataUrl, defaultName) => ipcRenderer.invoke('save-image-file', { dataUrl, defaultName }),

    // Updates & Shell
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, data) => callback(data)),
    openUrl: (url) => ipcRenderer.send('open-url', url)
});
