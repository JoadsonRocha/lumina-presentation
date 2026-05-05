const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectImages: () => ipcRenderer.invoke('select-images'),
    onUpdateImage: (callback) => ipcRenderer.on('update-image', (event, path) => callback(path)),
    notifyImageChange: (path) => ipcRenderer.send('image-changed', path),
    closePresentation: () => ipcRenderer.send('close-presentation'),
    navigateNext: () => ipcRenderer.send('navigate-next'),
    navigatePrev: () => ipcRenderer.send('navigate-prev'),
    onNavigate: (callback) => ipcRenderer.on('navigate', (event, direction) => callback(direction)),
    togglePresentation: () => ipcRenderer.send('toggle-presentation'),
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, msg) => callback(msg)),
    openUrl: (url) => ipcRenderer.send('open-url', url)
});


