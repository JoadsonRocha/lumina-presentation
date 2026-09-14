const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Media selection & parsing
    selectMedia: () => ipcRenderer.invoke('select-media'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    selectAudio: () => ipcRenderer.invoke('select-audio'),
    parseDroppedPaths: (paths) => ipcRenderer.invoke('parse-dropped-paths', paths),

    // Projection sync & controls
    syncProjection: (state) => ipcRenderer.send('sync-projection', state),
    onSyncProjection: (callback) => {
        const handler = (event, state) => callback(state);
        ipcRenderer.on('sync-projection', handler);
        return () => ipcRenderer.removeListener('sync-projection', handler);
    },
    onRequestSyncState: (callback) => {
        const handler = () => callback();
        ipcRenderer.on('request-sync-state', handler);
        return () => ipcRenderer.removeListener('request-sync-state', handler);
    },
    sendStageCommand: (command) => ipcRenderer.send('stage-command', command),
    onStageCommand: (callback) => {
        const handler = (event, cmd) => callback(cmd);
        ipcRenderer.on('stage-command', handler);
        return () => ipcRenderer.removeListener('stage-command', handler);
    },
    
    togglePresentation: () => ipcRenderer.send('toggle-presentation'),
    closePresentation: () => ipcRenderer.send('close-presentation'),
    getProjectionStatus: () => ipcRenderer.invoke('get-projection-status'),
    onProjectionStatusChanged: (callback) => {
        const handler = (event, isLive) => callback(isLive);
        ipcRenderer.on('projection-status-changed', handler);
        return () => ipcRenderer.removeListener('projection-status-changed', handler);
    },

    // Navigation
    navigateNext: () => ipcRenderer.send('navigate-next'),
    navigatePrev: () => ipcRenderer.send('navigate-prev'),
    onNavigate: (callback) => {
        const handler = (event, direction) => callback(direction);
        ipcRenderer.on('navigate', handler);
        return () => ipcRenderer.removeListener('navigate', handler);
    },

    // Window controls
    toggleFullscreenMain: () => ipcRenderer.send('toggle-fullscreen-main'),
    isFullscreenMain: () => ipcRenderer.invoke('is-fullscreen-main'),
    onMainFullscreenChanged: (callback) => {
        const handler = (event, isFull) => callback(isFull);
        ipcRenderer.on('main-fullscreen-changed', handler);
        return () => ipcRenderer.removeListener('main-fullscreen-changed', handler);
    },

    // Export & Projects
    exportReorderedFolder: (items) => ipcRenderer.invoke('export-reordered-folder', items),
    exportPptx: (items) => ipcRenderer.invoke('export-pptx', items),
    exportPdf: (items) => ipcRenderer.invoke('export-pdf', items),
    saveProjectFile: (projectData) => ipcRenderer.invoke('save-project-file', projectData),
    loadProjectFile: () => ipcRenderer.invoke('load-project-file'),
    saveImageFile: (dataUrl, defaultName) => ipcRenderer.invoke('save-image-file', { dataUrl, defaultName }),

    // App & Developer Info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),

    // Updates & Shell
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    onUpdateMessage: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('update-message', handler);
        return () => ipcRenderer.removeListener('update-message', handler);
    },
    openUrl: (url) => ipcRenderer.send('open-url', url)
});
