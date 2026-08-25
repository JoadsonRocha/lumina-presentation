// ==========================================================================
// LUMINA 2.0 - CORE RENDERER ENGINE
// ==========================================================================

// Global State
let mediaItems = [];
let currentIndex = 0;
let isPlaying = false;
let slideshowInterval = null;
let progressInterval = null;
let progress = 0;
let idleTimer = null;
let draggedMediaIndex = null;

// Stage & Modifiers
let activeFilter = 'none';
let currentRotation = 0; // 0, 90, 180, 270
let blackoutActive = false;
let whiteoutActive = false;
let activeSidebarTab = 'all';

// Zoom & Pan State
let zoomLevel = 1;
let isPanning = false;
let startX, startY, translateX = 0, translateY = 0;

// Settings Defaults
let settings = {
    slideshowSpeed: 4000,
    borderSize: 20,
    imageFit: 'contain',
    transitionType: 'fade',
    videoAutoAdvance: true,
    ambilightEnabled: true,
    presenterHUDEnabled: true,
    autoHideEnabled: true,
    loopEnabled: true
};

// Audio Playlist State
let playlist = [];
let currentTrackIndex = 0;
const backgroundAudio = new Audio();
backgroundAudio.volume = 0.8;

// Presentation Timer State
let presentationSeconds = 0;
let timerInterval = null;
let isTimerRunning = false;

// DOM Elements
const dropZone = document.getElementById('dropZone');
const welcomeScreen = document.getElementById('welcomeScreen');
const viewerScreen = document.getElementById('viewerScreen');
const slideshowProgress = document.getElementById('slideshowProgress');
const toastContainer = document.getElementById('toastContainer');
const projectionStatusBadge = document.getElementById('projectionStatusBadge');

// Stage Elements
const imageDisplay = document.getElementById('imageDisplay');
const zoomContainer = document.getElementById('zoomContainer');
const mainImage = document.getElementById('mainImage');
const mainVideo = document.getElementById('mainVideo');
const ambilightBg = document.getElementById('ambilightBg');
const stageBlackout = document.getElementById('stageBlackout');
const stageWhiteout = document.getElementById('stageWhiteout');
const presenterHUD = document.getElementById('presenterHUD');
const counter = document.getElementById('counter');
const timerDisplay = document.getElementById('timerDisplay');
const timerResetBtn = document.getElementById('timerResetBtn');

// Next Up Card
const nextUpCard = document.getElementById('nextUpCard');
const nextUpThumbImg = document.getElementById('nextUpThumbImg');
const nextUpName = document.getElementById('nextUpName');

// Video Controls Bar
const videoControlsBar = document.getElementById('videoControlsBar');
const vidPlayPauseBtn = document.getElementById('vidPlayPauseBtn');
const vidCurrentTime = document.getElementById('vidCurrentTime');
const vidSeekBar = document.getElementById('vidSeekBar');
const vidDuration = document.getElementById('vidDuration');
const vidMuteBtn = document.getElementById('vidMuteBtn');
const vidVolumeBar = document.getElementById('vidVolumeBar');

// Navigation & Actions
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const projectBtn = document.getElementById('projectBtn');
const fullscreenMainBtn = document.getElementById('fullscreenMainBtn');
const settingsBtn = document.getElementById('settingsBtn');
const gridModeBtn = document.getElementById('gridModeBtn');
const selectBtn = document.getElementById('selectBtn');
const importFolderBtn = document.getElementById('importFolderBtn');
const welcomeSelectBtn = document.getElementById('welcomeSelectBtn');
const welcomeFolderBtn = document.getElementById('welcomeFolderBtn');

// Sidebar Elements
const thumbSidebar = document.getElementById('thumbSidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const thumbList = document.getElementById('thumbList');
const mediaCountBadge = document.getElementById('mediaCountBadge');
const sidebarSortBtn = document.getElementById('sidebarSortBtn');
const sidebarAddBtn = document.getElementById('sidebarAddBtn');
const sidebarTabs = document.querySelectorAll('.tab-btn');

// Stage Tools
const rotateBtn = document.getElementById('rotateBtn');
const ambilightToggleBtn = document.getElementById('ambilightToggleBtn');
const blackoutBtn = document.getElementById('blackoutBtn');
const whiteoutBtn = document.getElementById('whiteoutBtn');
const exifBtn = document.getElementById('exifBtn');
const exifCard = document.getElementById('exifCard');
const exifContent = document.getElementById('exifContent');
const closeExif = document.getElementById('closeExif');
const filterBtns = document.querySelectorAll('.filter-btn');

// Grid Modal
const gridModal = document.getElementById('gridModal');
const gridContent = document.getElementById('gridContent');
const gridTotalCount = document.getElementById('gridTotalCount');
const gridSearchInput = document.getElementById('gridSearchInput');
const gridSortSelect = document.getElementById('gridSortSelect');
const closeGridBtn = document.getElementById('closeGridBtn');

// Audio & Playlist Elements
const playlistBtn = document.getElementById('playlistBtn');
const playlistModal = document.getElementById('playlistModal');
const closePlaylistBtn = document.getElementById('closePlaylistBtn');
const addMusicBtn = document.getElementById('addMusicBtn');
const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
const playlistTracks = document.getElementById('playlistTracks');
const audioInput = document.getElementById('audioInput');
const musicPlayer = document.getElementById('musicPlayer');
const musicName = document.getElementById('musicName');
const musicPlayPause = document.getElementById('musicPlayPause');
const musicPrevBtn = document.getElementById('musicPrevBtn');
const musicNextBtn = document.getElementById('musicNextBtn');
const musicMuteBtn = document.getElementById('musicMuteBtn');
const musicVolumeSlider = document.getElementById('musicVolumeSlider');

// Settings Elements
const settingsScreen = document.getElementById('settingsScreen');
const backBtn = document.getElementById('backBtn');
const saveSettingsBtn = document.getElementById('saveSettings');
const updateBtn = document.getElementById('updateBtn');
const slideshowSpeedInput = document.getElementById('slideshowSpeed');
const borderSizeInput = document.getElementById('borderSize');
const imageFitInput = document.getElementById('imageFit');
const transitionTypeInput = document.getElementById('transitionType');
const videoAutoAdvanceCheckbox = document.getElementById('videoAutoAdvanceOption');
const ambilightCheckbox = document.getElementById('ambilightOption');
const presenterHUDCheckbox = document.getElementById('presenterHUDOption');
const autoHideCheckbox = document.getElementById('autoHideOption');
const loopCheckbox = document.getElementById('loopOption');

// ==========================================================================
// PATH & URL HELPER
// ==========================================================================
function toFileUrl(filePath) {
    if (!filePath) return '';
    if (filePath.startsWith('file://') || filePath.startsWith('data:') || filePath.startsWith('blob:')) {
        return filePath;
    }
    let normalized = filePath.replace(/\\/g, '/');
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }
    return 'file://' + encodeURI(normalized);
}

// ==========================================================================
// INITIALIZATION & SETTINGS STORAGE
// ==========================================================================
function loadSavedSettings() {
    try {
        const saved = localStorage.getItem('lumina_settings_v2');
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Error loading settings from localStorage:', e);
    }
    applySettingsToUI();
}

function saveSettingsToStorage() {
    try {
        localStorage.setItem('lumina_settings_v2', JSON.stringify(settings));
        showToast('Preferências salvas com sucesso', 'success');
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

function applySettingsToUI() {
    slideshowSpeedInput.value = settings.slideshowSpeed / 1000;
    borderSizeInput.value = settings.borderSize;
    imageFitInput.value = settings.imageFit;
    transitionTypeInput.value = settings.transitionType;
    videoAutoAdvanceCheckbox.checked = settings.videoAutoAdvance;
    ambilightCheckbox.checked = settings.ambilightEnabled;
    presenterHUDCheckbox.checked = settings.presenterHUDEnabled;
    autoHideCheckbox.checked = settings.autoHideEnabled;
    loopCheckbox.checked = settings.loopEnabled;

    ambilightToggleBtn.classList.toggle('active', settings.ambilightEnabled);
    zoomContainer.style.padding = `${settings.borderSize}px`;
    presenterHUD.style.display = settings.presenterHUDEnabled ? 'flex' : 'none';
}

loadSavedSettings();

// Check Projection Status on startup
window.electronAPI.getProjectionStatus().then(isLive => {
    updateProjectionStatus(isLive);
});

window.electronAPI.onProjectionStatusChanged((isLive) => {
    updateProjectionStatus(isLive);
    if (isLive) {
        syncToProjection();
    }
});

window.electronAPI.onRequestSyncState(() => {
    syncToProjection();
});

window.electronAPI.onMainFullscreenChanged((isFull) => {
    if (fullscreenMainBtn) {
        fullscreenMainBtn.classList.toggle('active', isFull);
    }
});

function updateProjectionStatus(isLive) {
    if (isLive) {
        projectionStatusBadge.classList.remove('hidden');
        projectBtn.classList.add('active');
        projectBtn.title = 'Encerrar Projeção (F5)';
    } else {
        projectionStatusBadge.classList.add('hidden');
        projectBtn.classList.remove('active');
        projectBtn.title = 'Projetar em 2ª Tela (F5)';
    }
}

// ==========================================================================
// TOAST NOTIFICATION SYSTEM
// ==========================================================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

// ==========================================================================
// MEDIA IMPORT & LOADING
// ==========================================================================
async function handleSelectMedia() {
    const items = await window.electronAPI.selectMedia();
    if (items && items.length > 0) {
        loadMediaList(items);
    }
}

async function handleSelectFolder() {
    showToast('Lendo pasta...', 'info');
    const items = await window.electronAPI.selectFolder();
    if (items && items.length > 0) {
        loadMediaList(items);
        showToast(`${items.length} itens carregados da pasta`, 'success');
    } else {
        showToast('Nenhum arquivo compatível encontrado na pasta', 'warn');
    }
}

selectBtn.onclick = handleSelectMedia;
welcomeSelectBtn.onclick = handleSelectMedia;
importFolderBtn.onclick = handleSelectFolder;
welcomeFolderBtn.onclick = handleSelectFolder;
sidebarAddBtn.onclick = handleSelectMedia;

function loadMediaList(newItems) {
    if (!newItems || newItems.length === 0) return;
    
    mediaItems = newItems.map(item => ({
        ...item,
        rotation: 0
    }));

    currentIndex = 0;
    currentRotation = 0;
    activeFilter = 'none';
    blackoutActive = false;
    whiteoutActive = false;
    stageBlackout.classList.remove('active');
    stageWhiteout.classList.remove('active');

    // UI Updates
    welcomeScreen.classList.add('hidden');
    viewerScreen.classList.remove('hidden');
    gridModeBtn.classList.remove('hidden');
    playlistBtn.classList.remove('hidden');

    renderThumbnails();
    showMedia(currentIndex);
    startPresentationTimer();
    resetIdleTimer();

    const imgCount = mediaItems.filter(m => m.type === 'image').length;
    const vidCount = mediaItems.filter(m => m.type === 'video').length;
    showToast(`${imgCount} foto(s), ${vidCount} vídeo(s) carregados`, 'success');
}

// Drag & Drop to Import Files
dropZone.addEventListener('dragover', (e) => {
    // If dragging an internal thumbnail, let the thumbnail drop handler manage it
    if (draggedMediaIndex !== null) return;
    e.preventDefault();
    e.stopPropagation();
    const dropBox = document.querySelector('.drop-hint-box');
    if (dropBox) dropBox.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    if (draggedMediaIndex !== null) return;
    e.preventDefault();
    const dropBox = document.querySelector('.drop-hint-box');
    if (dropBox) dropBox.classList.remove('drag-over');
});

dropZone.addEventListener('drop', async (e) => {
    if (draggedMediaIndex !== null) return;
    e.preventDefault();
    e.stopPropagation();
    const dropBox = document.querySelector('.drop-hint-box');
    if (dropBox) dropBox.classList.remove('drag-over');

    const rawFiles = Array.from(e.dataTransfer.files || []);
    if (rawFiles.length === 0) return;

    const filePaths = rawFiles.map(f => f.path);
    const parsedMedia = await window.electronAPI.parseDroppedPaths(filePaths);

    if (parsedMedia && parsedMedia.length > 0) {
        loadMediaList(parsedMedia);
    } else {
        showToast('Nenhum arquivo compatível encontrado', 'warn');
    }
});

// ==========================================================================
// REORDER MEDIA ENGINE (DRAG & DROP REORDERING)
// ==========================================================================
function reorderMedia(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= mediaItems.length || toIndex >= mediaItems.length) return;
    
    const [movedItem] = mediaItems.splice(fromIndex, 1);
    mediaItems.splice(toIndex, 0, movedItem);

    // If active slide was moved, update currentIndex
    if (currentIndex === fromIndex) {
        currentIndex = toIndex;
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        currentIndex--;
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        currentIndex++;
    }

    renderThumbnails();
    if (!gridModal.classList.contains('hidden')) {
        renderGridCards();
    }
    updateNextUpCard();
    syncToProjection();
    showToast(`Posição atualizada para #${toIndex + 1}`);
}

// ==========================================================================
// SIDEBAR THUMBNAILS
// ==========================================================================
function renderThumbnails() {
    thumbList.innerHTML = '';
    mediaCountBadge.textContent = mediaItems.length;

    const filteredItems = mediaItems
        .map((item, originalIndex) => ({ ...item, originalIndex }))
        .filter(item => {
            if (activeSidebarTab === 'all') return true;
            return item.type === activeSidebarTab;
        });

    filteredItems.forEach((item) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${item.originalIndex === currentIndex ? 'active' : ''}`;
        thumb.draggable = true;
        
        const src = toFileUrl(item.path);
        if (item.type === 'video') {
            thumb.innerHTML = `
                <video src="${src}#t=0.5" preload="metadata" muted></video>
                <span class="thumb-type-badge">VÍDEO</span>
                <span class="thumb-index">#${item.originalIndex + 1}</span>
            `;
        } else {
            thumb.innerHTML = `
                <img src="${src}" loading="lazy" alt="${item.name}">
                <span class="thumb-index">#${item.originalIndex + 1}</span>
            `;
        }

        // Click to display
        thumb.onclick = (e) => {
            showMedia(item.originalIndex);
        };

        // Drag & Drop Reordering Listeners
        thumb.addEventListener('dragstart', (e) => {
            draggedMediaIndex = item.originalIndex;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.originalIndex);
            setTimeout(() => thumb.classList.add('dragging'), 0);
        });

        thumb.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            
            const rect = thumb.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
                thumb.classList.add('drag-over-top');
                thumb.classList.remove('drag-over-bottom');
            } else {
                thumb.classList.add('drag-over-bottom');
                thumb.classList.remove('drag-over-top');
            }
        });

        thumb.addEventListener('dragleave', () => {
            thumb.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        thumb.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            thumb.classList.remove('drag-over-top', 'drag-over-bottom');
            
            if (draggedMediaIndex === null) return;
            
            reorderMedia(draggedMediaIndex, item.originalIndex);
            draggedMediaIndex = null;
        });

        thumb.addEventListener('dragend', () => {
            thumb.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
            document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom'));
            draggedMediaIndex = null;
        });

        thumbList.appendChild(thumb);
    });
}

function updateActiveThumbnail() {
    const thumbs = thumbList.querySelectorAll('.thumb-item');
    thumbs.forEach(t => {
        const idx = parseInt(t.querySelector('.thumb-index')?.textContent.replace('#', '') || '0') - 1;
        const isActive = idx === currentIndex;
        t.classList.toggle('active', isActive);
        if (isActive) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

sidebarTabs.forEach(btn => {
    btn.onclick = () => {
        sidebarTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSidebarTab = btn.dataset.tab;
        renderThumbnails();
    };
});

toggleSidebarBtn.onclick = () => {
    thumbSidebar.classList.toggle('collapsed');
};

sidebarSortBtn.onclick = () => {
    openGridModal();
};

// ==========================================================================
// MAIN STAGE DISPLAY & MEDIA RENDERING
// ==========================================================================
async function showMedia(index) {
    if (mediaItems.length === 0) return;
    
    if (index < 0) index = settings.loopEnabled ? mediaItems.length - 1 : 0;
    if (index >= mediaItems.length) index = settings.loopEnabled ? 0 : mediaItems.length - 1;
    
    currentIndex = index;
    const currentMedia = mediaItems[currentIndex];
    currentRotation = currentMedia.rotation || 0;

    resetZoom();

    // Out Transition
    const trans = settings.transitionType;
    if (trans === 'slide') {
        mainImage.classList.add('slide-out');
        mainVideo.classList.add('slide-out');
    } else if (trans === 'zoom-fade') {
        mainImage.classList.add('zoom-fade-out');
        mainVideo.classList.add('zoom-fade-out');
    } else if (trans === 'none') {
        // Immediate
    } else {
        mainImage.classList.remove('visible');
        mainVideo.classList.remove('visible');
    }

    setTimeout(() => {
        if (currentMedia.type === 'video') {
            // VIDEO MODE
            if (!mainVideo.paused) mainVideo.pause();
            mainImage.classList.add('hidden');
            mainImage.classList.remove('visible');
            mainVideo.classList.remove('hidden');

            const videoSrc = toFileUrl(currentMedia.path);
            if (mainVideo.src !== videoSrc) {
                mainVideo.src = videoSrc;
            }

            mainVideo.className = `media-node ${settings.imageFit === 'cover' ? 'fit-cover' : ''}`;
            mainVideo.style.filter = activeFilter;
            mainVideo.style.transform = `rotate(${currentRotation}deg)`;

            videoControlsBar.classList.remove('hidden');
            mainVideo.currentTime = 0;
            mainVideo.play().catch(() => {});
            vidPlayPauseBtn.textContent = '⏸';

            // Ambilight
            ambilightBg.style.backgroundImage = 'none';
            ambilightBg.classList.remove('active');
        } else {
            // IMAGE MODE
            if (!mainVideo.paused) mainVideo.pause();
            mainVideo.classList.add('hidden');
            mainVideo.classList.remove('visible');
            videoControlsBar.classList.add('hidden');

            mainImage.classList.remove('hidden');
            const imgSrc = toFileUrl(currentMedia.path);
            mainImage.src = imgSrc;
            
            mainImage.className = `media-node ${settings.imageFit === 'cover' ? 'fit-cover' : ''} ${trans === 'ken-burns' ? 'ken-burns' : ''}`;
            mainImage.style.filter = activeFilter;
            mainImage.style.transform = `rotate(${currentRotation}deg)`;

            // Ambilight Halo
            if (settings.ambilightEnabled) {
                ambilightBg.style.backgroundImage = `url("${imgSrc.replace(/"/g, '\\"')}")`;
                ambilightBg.classList.add('active');
            } else {
                ambilightBg.classList.remove('active');
            }
        }

        // Reveal
        mainImage.classList.remove('slide-out', 'zoom-fade-out');
        mainVideo.classList.remove('slide-out', 'zoom-fade-out');
        if (currentMedia.type === 'video') mainVideo.classList.add('visible');
        else mainImage.classList.add('visible');

        // Update HUD & Next Up
        counter.textContent = `${currentIndex + 1} / ${mediaItems.length}`;
        updateNextUpCard();
        updateActiveThumbnail();

        // Synchronize with Projection Screen
        syncToProjection();

        // Slideshow Progress handling
        if (isPlaying) {
            startProgressBar();
        } else {
            clearInterval(progressInterval);
            slideshowProgress.style.width = '0%';
        }
    }, trans === 'none' ? 0 : 90);
}

// Next Up Card Logic
function updateNextUpCard() {
    if (mediaItems.length <= 1) {
        nextUpCard.style.opacity = '0';
        return;
    }
    nextUpCard.style.opacity = '1';
    const nextIdx = (currentIndex + 1) % mediaItems.length;
    const nextItem = mediaItems[nextIdx];

    nextUpName.textContent = nextItem.name;

    if (nextItem.type === 'video') {
        nextUpThumbImg.src = 'logo.png';
    } else {
        nextUpThumbImg.src = toFileUrl(nextItem.path);
    }
}

nextUpCard.onclick = () => {
    nextMedia();
};

// ==========================================================================
// VIDEO PLAYBACK & AUTO-ADVANCE
// ==========================================================================
mainVideo.ontimeupdate = () => {
    if (mainVideo.duration) {
        const percent = (mainVideo.currentTime / mainVideo.duration) * 100;
        vidSeekBar.value = percent;
        vidCurrentTime.textContent = formatTime(mainVideo.currentTime);
        vidDuration.textContent = formatTime(mainVideo.duration);
    }
};

mainVideo.onended = () => {
    if (isPlaying && settings.videoAutoAdvance) {
        nextMedia();
    }
};

vidPlayPauseBtn.onclick = () => {
    if (mainVideo.paused) {
        mainVideo.play();
        vidPlayPauseBtn.textContent = '⏸';
    } else {
        mainVideo.pause();
        vidPlayPauseBtn.textContent = '▶';
    }
};

vidSeekBar.oninput = () => {
    if (mainVideo.duration) {
        mainVideo.currentTime = (vidSeekBar.value / 100) * mainVideo.duration;
    }
};

vidMuteBtn.onclick = () => {
    mainVideo.muted = !mainVideo.muted;
    vidMuteBtn.textContent = mainVideo.muted ? '🔇' : '🔊';
    syncToProjection();
};

vidVolumeBar.oninput = () => {
    mainVideo.volume = parseFloat(vidVolumeBar.value);
    mainVideo.muted = mainVideo.volume === 0;
    vidMuteBtn.textContent = mainVideo.muted ? '🔇' : '🔊';
    syncToProjection();
};

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ==========================================================================
// STAGE COMMANDS & SYNCING TO PROJECTION
// ==========================================================================
function syncToProjection() {
    if (mediaItems.length === 0) return;
    const current = mediaItems[currentIndex];
    
    window.electronAPI.syncProjection({
        media: current,
        fit: settings.imageFit,
        filter: activeFilter,
        rotation: currentRotation,
        borderSize: settings.borderSize,
        transitionType: settings.transitionType,
        ambilightEnabled: settings.ambilightEnabled,
        blackout: blackoutActive,
        whiteout: whiteoutActive,
        videoMuted: mainVideo.muted,
        videoVolume: mainVideo.volume
    });
}

function toggleBlackout() {
    blackoutActive = !blackoutActive;
    if (blackoutActive) whiteoutActive = false;
    
    stageBlackout.classList.toggle('active', blackoutActive);
    stageWhiteout.classList.remove('active');
    blackoutBtn.classList.toggle('active', blackoutActive);
    whiteoutBtn.classList.remove('active');
    
    syncToProjection();
    showToast(blackoutActive ? 'Blackout ativado' : 'Blackout desativado');
}

function toggleWhiteout() {
    whiteoutActive = !whiteoutActive;
    if (whiteoutActive) blackoutActive = false;

    stageWhiteout.classList.toggle('active', whiteoutActive);
    stageBlackout.classList.remove('active');
    whiteoutBtn.classList.toggle('active', whiteoutActive);
    blackoutBtn.classList.remove('active');

    syncToProjection();
    showToast(whiteoutActive ? 'Whiteout ativado' : 'Whiteout desativado');
}

function rotateMedia() {
    currentRotation = (currentRotation + 90) % 360;
    if (mediaItems[currentIndex]) {
        mediaItems[currentIndex].rotation = currentRotation;
    }
    mainImage.style.transform = `rotate(${currentRotation}deg)`;
    mainVideo.style.transform = `rotate(${currentRotation}deg)`;
    syncToProjection();
    showToast(`Rotação: ${currentRotation}°`);
}

rotateBtn.onclick = rotateMedia;
blackoutBtn.onclick = toggleBlackout;
whiteoutBtn.onclick = toggleWhiteout;

ambilightToggleBtn.onclick = () => {
    settings.ambilightEnabled = !settings.ambilightEnabled;
    ambilightToggleBtn.classList.toggle('active', settings.ambilightEnabled);
    if (!settings.ambilightEnabled) {
        ambilightBg.classList.remove('active');
    } else if (mediaItems[currentIndex]?.type === 'image') {
        ambilightBg.classList.add('active');
    }
    syncToProjection();
    saveSettingsToStorage();
};

// Filter Buttons
filterBtns.forEach(btn => {
    btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter || 'none';
        mainImage.style.filter = activeFilter;
        mainVideo.style.filter = activeFilter;
        syncToProjection();
    };
});

// ==========================================================================
// NAVIGATION & SLIDESHOW ENGINE
// ==========================================================================
function nextMedia() {
    if (mediaItems.length === 0) return;
    let next = currentIndex + 1;
    if (next >= mediaItems.length) {
        if (!settings.loopEnabled) {
            if (isPlaying) toggleSlideshow();
            return;
        }
        next = 0;
    }
    showMedia(next);
}

function prevMedia() {
    if (mediaItems.length === 0) return;
    let prev = currentIndex - 1;
    if (prev < 0) {
        if (!settings.loopEnabled) return;
        prev = mediaItems.length - 1;
    }
    showMedia(prev);
}

prevBtn.onclick = (e) => { e.stopPropagation(); prevMedia(); };
nextBtn.onclick = (e) => { e.stopPropagation(); nextMedia(); };

function startProgressBar() {
    clearInterval(progressInterval);
    progress = 0;
    slideshowProgress.style.width = '0%';
    
    let duration = settings.slideshowSpeed;
    if (mediaItems[currentIndex]?.type === 'video' && mainVideo.duration && settings.videoAutoAdvance) {
        duration = mainVideo.duration * 1000;
    }

    const step = 100 / (duration / 100);
    progressInterval = setInterval(() => {
        progress += step;
        slideshowProgress.style.width = `${Math.min(100, progress)}%`;
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 100);
}

function toggleSlideshow() {
    if (mediaItems.length === 0) return;
    isPlaying = !isPlaying;
    const playIcon = document.getElementById('playIcon');
    
    if (isPlaying) {
        if (playIcon) playIcon.textContent = '⏸';
        playPauseBtn.classList.add('active');
        slideshowInterval = setInterval(() => {
            if (mediaItems[currentIndex]?.type === 'video' && settings.videoAutoAdvance) return;
            nextMedia();
        }, settings.slideshowSpeed);
        startProgressBar();
    } else {
        if (playIcon) playIcon.textContent = '▶';
        playPauseBtn.classList.remove('active');
        clearInterval(slideshowInterval);
        clearInterval(progressInterval);
        slideshowProgress.style.width = '0%';
    }
}

playPauseBtn.onclick = toggleSlideshow;

// ==========================================================================
// PRESENTATION STOPWATCH TIMER
// ==========================================================================
function startPresentationTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        presentationSeconds++;
        const mins = Math.floor(presentationSeconds / 60);
        const secs = presentationSeconds % 60;
        timerDisplay.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, 1000);
}

timerResetBtn.onclick = (e) => {
    e.stopPropagation();
    presentationSeconds = 0;
    timerDisplay.textContent = '00:00';
    showToast('Cronômetro zerado');
};

// ==========================================================================
// ZOOM & PAN ENGINE
// ==========================================================================
imageDisplay.addEventListener('wheel', (e) => {
    if (mediaItems.length === 0) return;
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        zoomLevel = Math.max(1, Math.min(5, zoomLevel + delta));
        updateZoomTransform();
    } else {
        if (e.deltaY > 0) nextMedia();
        else prevMedia();
    }
    resetIdleTimer();
}, { passive: false });

imageDisplay.addEventListener('mousedown', (e) => {
    if (zoomLevel > 1) {
        isPanning = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        imageDisplay.style.cursor = 'grabbing';
    }
});

window.addEventListener('mousemove', (e) => {
    if (isPanning) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateZoomTransform();
    }
});

window.addEventListener('mouseup', () => {
    isPanning = false;
    imageDisplay.style.cursor = zoomLevel > 1 ? 'grab' : 'auto';
});

// Double click to toggle zoom
imageDisplay.ondblclick = (e) => {
    if (e.target.closest('.video-controls-bar') || e.target.closest('.quick-toolbar') || e.target.closest('.presenter-hud')) return;
    if (zoomLevel > 1) {
        resetZoom();
    } else {
        zoomLevel = 1.75;
        updateZoomTransform();
    }
};

function updateZoomTransform() {
    const rot = `rotate(${currentRotation}deg)`;
    mainImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel}) ${rot}`;
    mainVideo.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel}) ${rot}`;
    imageDisplay.style.cursor = zoomLevel > 1 ? 'grab' : 'auto';
}

function resetZoom() {
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;
    updateZoomTransform();
}

// ==========================================================================
// GRID OVERVIEW MODAL (MODO GRADE COM DRAG & DROP)
// ==========================================================================
function openGridModal() {
    if (mediaItems.length === 0) return;
    gridTotalCount.textContent = `${mediaItems.length} itens`;
    renderGridCards();
    gridModal.classList.remove('hidden');
    gridSearchInput.value = '';
    gridSearchInput.focus();
}

function closeGridModal() {
    gridModal.classList.add('hidden');
}

gridModeBtn.onclick = openGridModal;
closeGridBtn.onclick = closeGridModal;

gridSearchInput.oninput = () => {
    renderGridCards();
};

gridSortSelect.onchange = () => {
    const sortVal = gridSortSelect.value;
    if (sortVal === 'name-asc') {
        mediaItems.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortVal === 'name-desc') {
        mediaItems.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortVal === 'type-image') {
        mediaItems.sort((a, b) => (a.type === 'image' ? -1 : 1));
    } else if (sortVal === 'type-video') {
        mediaItems.sort((a, b) => (a.type === 'video' ? -1 : 1));
    } else if (sortVal === 'shuffle') {
        mediaItems.sort(() => Math.random() - 0.5);
    }
    renderThumbnails();
    renderGridCards();
    showMedia(0);
    showToast('Ordem atualizada');
};

function renderGridCards() {
    gridContent.innerHTML = '';
    const query = gridSearchInput.value.toLowerCase().trim();

    mediaItems.forEach((item, index) => {
        if (query && !item.name.toLowerCase().includes(query)) return;

        const card = document.createElement('div');
        card.className = `grid-card ${index === currentIndex ? 'active' : ''}`;
        card.draggable = true;
        
        const src = toFileUrl(item.path);
        const isVideo = item.type === 'video';
        const mediaTag = isVideo 
            ? `<video src="${src}#t=0.5" muted preload="metadata"></video>` 
            : `<img src="${src}" loading="lazy" alt="${item.name}">`;

        card.innerHTML = `
            ${mediaTag}
            <span class="grid-card-badge">${isVideo ? 'VÍDEO' : 'FOTO'}</span>
            <button class="grid-delete-btn" title="Remover">&times;</button>
            <div class="grid-card-overlay">
                <span class="grid-card-title">#${index + 1} ${item.name}</span>
            </div>
        `;

        card.onclick = (e) => {
            if (e.target.classList.contains('grid-delete-btn')) {
                e.stopPropagation();
                removeMediaItem(index);
                return;
            }
            showMedia(index);
            closeGridModal();
        };

        // Drag & Drop inside Grid
        card.addEventListener('dragstart', (e) => {
            draggedMediaIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            card.classList.remove('drag-over');
            
            if (draggedMediaIndex !== null) {
                reorderMedia(draggedMediaIndex, index);
                draggedMediaIndex = null;
            }
        });

        card.addEventListener('dragend', () => {
            document.querySelectorAll('.grid-card').forEach(c => c.classList.remove('dragging', 'drag-over'));
            draggedMediaIndex = null;
        });

        gridContent.appendChild(card);
    });
}

function removeMediaItem(index) {
    mediaItems.splice(index, 1);
    if (mediaItems.length === 0) {
        welcomeScreen.classList.remove('hidden');
        viewerScreen.classList.add('hidden');
        closeGridModal();
        return;
    }
    if (currentIndex >= mediaItems.length) currentIndex = mediaItems.length - 1;
    renderThumbnails();
    renderGridCards();
    showMedia(currentIndex);
    showToast('Item removido');
}

// ==========================================================================
// BACKGROUND AUDIO & PLAYLIST
// ==========================================================================
playlistBtn.onclick = () => playlistModal.classList.toggle('hidden');
closePlaylistBtn.onclick = () => playlistModal.classList.add('hidden');

addMusicBtn.onclick = async () => {
    const audioFiles = await window.electronAPI.selectAudio();
    if (audioFiles && audioFiles.length > 0) {
        audioFiles.forEach(file => {
            playlist.push({
                name: file.name,
                path: file.path
            });
        });
        renderPlaylist();
        if (backgroundAudio.paused && playlist.length > 0) {
            playTrack(playlist.length - audioFiles.length);
        }
        showToast(`${audioFiles.length} faixa(s) adicionada(s)`, 'success');
    }
};

clearPlaylistBtn.onclick = () => {
    playlist = [];
    backgroundAudio.pause();
    musicPlayer.classList.add('hidden');
    renderPlaylist();
    showToast('Playlist limpa');
};

function renderPlaylist() {
    playlistTracks.innerHTML = '';
    playlist.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `track-item ${idx === currentTrackIndex ? 'active' : ''}`;
        item.innerHTML = `
            <span class="track-name">${track.name}</span>
            <span class="track-status">${idx === currentTrackIndex && !backgroundAudio.paused ? '▶' : ''}</span>
        `;
        item.onclick = () => playTrack(idx);
        playlistTracks.appendChild(item);
    });
}

function playTrack(index) {
    if (playlist.length === 0) return;
    currentTrackIndex = index;
    const track = playlist[currentTrackIndex];
    
    backgroundAudio.src = toFileUrl(track.path);
    backgroundAudio.play().then(() => {
        musicName.textContent = track.name;
        musicPlayer.classList.remove('hidden');
        musicPlayPause.textContent = '⏸';
        playlistBtn.classList.add('active');
        renderPlaylist();
    }).catch(err => console.error('Audio play error:', err));
}

backgroundAudio.onended = () => {
    if (playlist.length > 0) {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        playTrack(currentTrackIndex);
    }
};

musicPlayPause.onclick = () => {
    if (backgroundAudio.paused) {
        backgroundAudio.play();
        musicPlayPause.textContent = '⏸';
    } else {
        backgroundAudio.pause();
        musicPlayPause.textContent = '▶';
    }
    renderPlaylist();
};

musicPrevBtn.onclick = () => {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrack(currentTrackIndex);
};

musicNextBtn.onclick = () => {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playTrack(currentTrackIndex);
};

musicMuteBtn.onclick = () => {
    backgroundAudio.muted = !backgroundAudio.muted;
    musicMuteBtn.textContent = backgroundAudio.muted ? '🔇' : '🔊';
};

musicVolumeSlider.oninput = () => {
    backgroundAudio.volume = parseFloat(musicVolumeSlider.value);
    backgroundAudio.muted = backgroundAudio.volume === 0;
    musicMuteBtn.textContent = backgroundAudio.muted ? '🔇' : '🔊';
};

// ==========================================================================
// EXIF & METADATA VIEWER
// ==========================================================================
exifBtn.onclick = async () => {
    if (mediaItems.length === 0) return;
    const media = mediaItems[currentIndex];

    if (media.type === 'video') {
        exifContent.innerHTML = `
            <div class="exif-item">
                <span class="exif-label">Tipo</span>
                <span class="exif-value">Vídeo</span>
            </div>
            <div class="exif-item">
                <span class="exif-label">Arquivo</span>
                <span class="exif-value">${media.name}</span>
            </div>
            <div class="exif-item">
                <span class="exif-label">Duração</span>
                <span class="exif-value">${formatTime(mainVideo.duration)}</span>
            </div>
            <div class="exif-item">
                <span class="exif-label">Resolução</span>
                <span class="exif-value">${mainVideo.videoWidth || '?'} x ${mainVideo.videoHeight || '?'} px</span>
            </div>
        `;
        exifCard.classList.remove('hidden');
        return;
    }

    try {
        const data = await window.exifr.parse(media.path);
        if (data) {
            exifContent.innerHTML = `
                <div class="exif-item">
                    <span class="exif-label">Câmera</span>
                    <span class="exif-value">${data.Make || ''} ${data.Model || 'Desconhecida'}</span>
                </div>
                <div class="exif-item">
                    <span class="exif-label">Exposição</span>
                    <span class="exif-value">ISO ${data.ISO || 'N/A'} | f/${data.FNumber || 'N/A'} | ${data.ExposureTime ? data.ExposureTime + 's' : 'N/A'}</span>
                </div>
                <div class="exif-item">
                    <span class="exif-label">Resolução</span>
                    <span class="exif-value">${data.ExifImageWidth || mainImage.naturalWidth || '?'} x ${data.ExifImageHeight || mainImage.naturalHeight || '?'} px</span>
                </div>
                <div class="exif-item">
                    <span class="exif-label">Data</span>
                    <span class="exif-value">${data.DateTimeOriginal ? new Date(data.DateTimeOriginal).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
            `;
        } else {
            exifContent.innerHTML = `
                <div class="exif-item">
                    <span class="exif-label">Arquivo</span>
                    <span class="exif-value">${media.name}</span>
                </div>
                <div class="exif-item">
                    <span class="exif-label">Resolução</span>
                    <span class="exif-value">${mainImage.naturalWidth} x ${mainImage.naturalHeight} px</span>
                </div>
            `;
        }
        exifCard.classList.remove('hidden');
    } catch (err) {
        console.error('EXIF parse error:', err);
        exifContent.innerHTML = `<p class="exif-value">Arquivo: ${media.name}</p>`;
        exifCard.classList.remove('hidden');
    }
};

closeExif.onclick = () => exifCard.classList.add('hidden');

// ==========================================================================
// SETTINGS SCREEN LOGIC
// ==========================================================================
settingsBtn.onclick = () => settingsScreen.classList.remove('hidden');
backBtn.onclick = () => settingsScreen.classList.add('hidden');

saveSettingsBtn.onclick = () => {
    settings.slideshowSpeed = parseInt(slideshowSpeedInput.value) * 1000;
    settings.borderSize = parseInt(borderSizeInput.value);
    settings.imageFit = imageFitInput.value;
    settings.transitionType = transitionTypeInput.value;
    settings.videoAutoAdvance = videoAutoAdvanceCheckbox.checked;
    settings.ambilightEnabled = ambilightCheckbox.checked;
    settings.presenterHUDEnabled = presenterHUDCheckbox.checked;
    settings.autoHideEnabled = autoHideCheckbox.checked;
    settings.loopEnabled = loopCheckbox.checked;

    applySettingsToUI();
    saveSettingsToStorage();
    showMedia(currentIndex);

    if (isPlaying) {
        clearInterval(slideshowInterval);
        slideshowInterval = setInterval(nextMedia, settings.slideshowSpeed);
        startProgressBar();
    }

    settingsScreen.classList.add('hidden');
};

updateBtn.onclick = () => {
    updateBtn.textContent = 'Verificando...';
    window.electronAPI.checkForUpdates();
};

window.electronAPI.onUpdateMessage((data) => {
    updateBtn.textContent = 'Verificar Atualizações';
    showToast(data.message, data.status === 'error' ? 'error' : 'info');
});

// ==========================================================================
// DUAL SCREEN PROJECTION & FULLSCREEN
// ==========================================================================
projectBtn.onclick = () => {
    window.electronAPI.togglePresentation();
};

if (fullscreenMainBtn) {
    fullscreenMainBtn.onclick = () => {
        window.electronAPI.toggleFullscreenMain();
    };
}

window.electronAPI.onNavigate((direction) => {
    if (direction === 'next') nextMedia();
    if (direction === 'prev') prevMedia();
});

// Idle Mouse Auto-Hide
function resetIdleTimer() {
    imageDisplay.classList.add('show-cursor');
    clearTimeout(idleTimer);
    if (settings.autoHideEnabled && !isPlaying) {
        idleTimer = setTimeout(() => {
            imageDisplay.classList.remove('show-cursor');
        }, 3500);
    }
}

document.addEventListener('mousemove', resetIdleTimer);

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
            document.activeElement.blur();
            closeGridModal();
        }
        return;
    }

    resetIdleTimer();

    switch (e.key) {
        case 'F5':
            e.preventDefault();
            window.electronAPI.togglePresentation();
            break;
        case 'F11':
        case 'f':
        case 'F':
            e.preventDefault();
            window.electronAPI.toggleFullscreenMain();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            nextMedia();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            prevMedia();
            break;
        case ' ':
            e.preventDefault();
            toggleSlideshow();
            break;
        case 'b':
        case 'B':
            toggleBlackout();
            break;
        case 'w':
        case 'W':
            toggleWhiteout();
            break;
        case 'r':
        case 'R':
            rotateMedia();
            break;
        case 'g':
        case 'G':
            if (gridModal.classList.contains('hidden')) openGridModal();
            else closeGridModal();
            break;
        case 'm':
        case 'M':
            if (mediaItems[currentIndex]?.type === 'video') {
                vidMuteBtn.click();
            } else {
                musicMuteBtn.click();
            }
            break;
        case 'Home':
            if (mediaItems.length > 0) showMedia(0);
            break;
        case 'End':
            if (mediaItems.length > 0) showMedia(mediaItems.length - 1);
            break;
        case 'Escape':
            if (!gridModal.classList.contains('hidden')) closeGridModal();
            else if (!settingsScreen.classList.contains('hidden')) settingsScreen.classList.add('hidden');
            else if (!playlistModal.classList.contains('hidden')) playlistModal.classList.add('hidden');
            else if (!exifCard.classList.contains('hidden')) exifCard.classList.add('hidden');
            else if (blackoutActive) toggleBlackout();
            else if (whiteoutActive) toggleWhiteout();
            break;
    }
});
