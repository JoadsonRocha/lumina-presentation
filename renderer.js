let images = [];
let currentIndex = 0;
let isPlaying = false;
let slideshowInterval = null;
let idleTimer = null;
let progressInterval = null;
let progress = 0;

// Settings State
let slideshowSpeed = 4000;
let autoHideEnabled = true;
let borderSize = 40;
let imageFit = 'contain';
let transitionType = 'fade';
let loopEnabled = true;
let showInfoEnabled = true;

// Zoom & Pan State
let zoomLevel = 1;
let isPanning = false;
let startX, startY, translateX = 0, translateY = 0;

const welcomeScreen = document.getElementById('welcomeScreen');
const viewerScreen = document.getElementById('viewerScreen');
const mainImage = document.getElementById('mainImage');
const counter = document.getElementById('counter');
const selectBtn = document.getElementById('selectBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const imageDisplay = document.getElementById('imageDisplay');
const controlsBar = document.getElementById('controlsBar');
const thumbList = document.getElementById('thumbList');
const slideshowProgress = document.getElementById('slideshowProgress');
const zoomContainer = document.getElementById('zoomContainer');
const thumbSidebar = document.getElementById('thumbSidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');

const musicBtn = document.getElementById('musicBtn');
const audioInput = document.getElementById('audioInput');
const audioPlayer = new Audio();
const exifBtn = document.getElementById('exifBtn');
const exifCard = document.getElementById('exifCard');
const exifContent = document.getElementById('exifContent');
const closeExif = document.getElementById('closeExif');
const musicPlayer = document.getElementById('musicPlayer');
const musicPlayPause = document.getElementById('musicPlayPause');
const musicStop = document.getElementById('musicStop');
const musicName = document.getElementById('musicName');

musicBtn.onclick = () => audioInput.click();

// Initialize
selectBtn.addEventListener('click', async () => {
    const selectedFiles = await window.electronAPI.selectImages();
    if (selectedFiles && selectedFiles.length > 0) {
        loadImages(selectedFiles);
    }
});

// Navigation Listeners
prevBtn.onclick = (e) => {
    e.stopPropagation();
    prevImage();
};

nextBtn.onclick = (e) => {
    e.stopPropagation();
    nextImage();
};

playPauseBtn.onclick = (e) => {
    e.stopPropagation();
    toggleSlideshow();
};

function loadImages(files) {
    images = files;
    currentIndex = 0;
    renderThumbnails();
    showImage(currentIndex);
    welcomeScreen.classList.add('hidden');
    viewerScreen.classList.remove('hidden');
    musicBtn.classList.remove('hidden'); // Mostrar música após carregar fotos
    resetIdleTimer();
}

function renderThumbnails() {
    thumbList.innerHTML = '';
    images.forEach((path, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${index === currentIndex ? 'active' : ''}`;
        thumb.innerHTML = `<img src="file://${path}" loading="lazy">`;
        thumb.onclick = () => showImage(index);
        thumbList.appendChild(thumb);
    });
}

function updateActiveThumbnail() {
    const thumbs = thumbList.querySelectorAll('.thumb-item');
    thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === currentIndex);
        if (i === currentIndex) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

async function showImage(index) {
    if (images.length === 0) return;
    
    // Reset Zoom
    resetZoom();

    // Transition Out
    if (transitionType === 'slide') {
        mainImage.classList.add('slide-out');
    } else {
        mainImage.style.opacity = 0;
    }
    
    setTimeout(async () => {
        currentIndex = index;
        const imagePath = images[currentIndex];
        mainImage.src = `file://${imagePath}`;
        
        mainImage.className = imageFit === 'cover' ? 'fit-cover' : '';
        zoomContainer.style.padding = `${borderSize}px`;

        const name = imagePath.split(/[\\/]/).pop();
        counter.textContent = `${currentIndex + 1} de ${images.length}`;
        
        updateActiveThumbnail();

        // Transition In
        if (transitionType === 'slide') {
            mainImage.classList.remove('slide-out');
            mainImage.classList.add('slide-in');
            mainImage.offsetHeight; 
            mainImage.classList.remove('slide-in');
            mainImage.style.opacity = 1;
        } else {
            mainImage.style.opacity = 1;
        }

        window.electronAPI.notifyImageChange(imagePath);
        
        // Reset Progress Bar
        if (isPlaying) {
            startProgressBar();
        } else {
            clearInterval(progressInterval);
            slideshowProgress.style.width = '0%';
        }
    }, transitionType === 'none' ? 0 : 150);
}


// Drag & Drop
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files)
        .filter(f => f.type.startsWith('image/'))
        .map(f => f.path);
    if (files.length > 0) loadImages(files);
});

// Zoom & Pan
imageDisplay.addEventListener('wheel', (e) => {
    if (images.length === 0) return;
    if (e.ctrlKey) {
        // Zoom
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        zoomLevel = Math.max(1, Math.min(5, zoomLevel + delta));
        updateZoomTransform();
    } else {
        // Navigation (default)
        if (e.deltaY > 0) nextImage();
        else prevImage();
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

function updateZoomTransform() {
    mainImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    imageDisplay.style.cursor = zoomLevel > 1 ? 'grab' : 'auto';
}

function resetZoom() {
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;
    updateZoomTransform();
}

// Slideshow Progress
function startProgressBar() {
    clearInterval(progressInterval);
    progress = 0;
    slideshowProgress.style.width = '0%';
    
    const step = 100 / (slideshowSpeed / 100);
    progressInterval = setInterval(() => {
        progress += step;
        slideshowProgress.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 100);
}

function toggleSlideshow() {
    isPlaying = !isPlaying;
    const icon = playPauseBtn.querySelector('span');
    
    if (isPlaying) {
        icon.textContent = '⏸';
        slideshowInterval = setInterval(nextImage, slideshowSpeed);
        startProgressBar();
    } else {
        icon.textContent = '▶';
        clearInterval(slideshowInterval);
        clearInterval(progressInterval);
        slideshowProgress.style.width = '0%';
    }
}

// Quick Filters
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
        if (btn.dataset.filter) {
            mainImage.style.filter = btn.dataset.filter;
        }
    };
});

// EXIF Info
exifBtn.onclick = async () => {
    if (images.length === 0) return;
    try {
        const data = await window.exifr.parse(images[currentIndex]);
        if (data) {
            exifContent.innerHTML = `
                <div class="exif-item">
                    <span class="exif-label">Câmera</span>
                    <span class="exif-value">${data.Make || ''} ${data.Model || 'Desconhecida'}</span>
                </div>
                <div class="exif-item">
                    <span class="exif-label">Configurações</span>
                    <span class="exif-value">ISO ${data.ISO || 'N/A'} | f/${data.FNumber || 'N/A'} | ${data.ExposureTime ? data.ExposureTime + 's' : 'N/A'}</span>
                </div>
                <div class="exif-item">
                    <span class="exif-label">Dimensões</span>
                    <span class="exif-value">${data.ExifImageWidth || '?'} x ${data.ExifImageHeight || '?'} px</span>
                </div>
                <div class="exif-item">
                    <span class="exif-label">Data</span>
                    <span class="exif-value">${data.DateTimeOriginal ? new Date(data.DateTimeOriginal).toLocaleDateString() : 'N/A'}</span>
                </div>
            `;
            exifCard.classList.remove('hidden');
        } else {
            exifContent.innerHTML = '<p class="exif-value">Sem metadados disponíveis.</p>';
            exifCard.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
        exifContent.innerHTML = '<p class="exif-value">Erro ao ler arquivo.</p>';
        exifCard.classList.remove('hidden');
    }
};

closeExif.onclick = () => {
    exifCard.classList.add('hidden');
};

// Background Music
let currentAudioURL = null;

audioInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('audio/')) {
            alert('Por favor, selecione apenas arquivos de áudio.');
            return;
        }
        
        // Revogar URL antiga para liberar memória
        if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
        
        currentAudioURL = URL.createObjectURL(file);
        audioPlayer.src = currentAudioURL;
        audioPlayer.loop = true;
        audioPlayer.play();
        
        musicName.textContent = file.name;
        musicPlayer.classList.remove('hidden');
        musicBtn.classList.add('active');
        musicBtn.style.color = '#ec4899';
    }
};

musicPlayPause.onclick = () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        musicPlayPause.textContent = '⏸';
    } else {
        audioPlayer.pause();
        musicPlayPause.textContent = '▶';
    }
};

musicStop.onclick = () => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    musicPlayer.classList.add('hidden');
    musicBtn.classList.remove('active');
    musicBtn.style.color = 'white';
};

// Sidebar Toggle
toggleSidebarBtn.onclick = () => {
    thumbSidebar.classList.toggle('collapsed');
};

// ... existing logic for settings and keyboard ...

// Settings Logic (Restored from previous version)
const settingsBtn = document.getElementById('settingsBtn');
const settingsScreen = document.getElementById('settingsScreen');
const backBtn = document.getElementById('backBtn');
const saveSettings = document.getElementById('saveSettings');
const updateBtn = document.getElementById('updateBtn');
const slideshowSpeedInput = document.getElementById('slideshowSpeed');
const borderSizeInput = document.getElementById('borderSize');
const imageFitInput = document.getElementById('imageFit');
const transitionTypeInput = document.getElementById('transitionType');
const autoHideCheckbox = document.getElementById('autoHideOption');
const loopCheckbox = document.getElementById('loopOption');
const showInfoCheckbox = document.getElementById('showInfoOption');

settingsBtn.onclick = () => settingsScreen.classList.remove('hidden');
backBtn.onclick = () => settingsScreen.classList.add('hidden');

saveSettings.onclick = () => {
    slideshowSpeed = parseInt(slideshowSpeedInput.value) * 1000;
    borderSize = parseInt(borderSizeInput.value);
    imageFit = imageFitInput.value;
    transitionType = transitionTypeInput.value;
    autoHideEnabled = autoHideCheckbox.checked;
    loopEnabled = loopCheckbox.checked;
    showInfoEnabled = showInfoCheckbox.checked;
    
    controlsBar.style.display = showInfoEnabled ? 'flex' : 'none';
    zoomContainer.style.padding = `${borderSize}px`;
    mainImage.className = imageFit === 'cover' ? 'fit-cover' : '';

    if (isPlaying) {
        clearInterval(slideshowInterval);
        slideshowInterval = setInterval(nextImage, slideshowSpeed);
        startProgressBar();
    }
    settingsScreen.classList.add('hidden');
};

function nextImage() {
    let next = currentIndex + 1;
    if (next >= images.length) {
        if (!loopEnabled) {
            if (isPlaying) toggleSlideshow();
            return;
        }
        next = 0;
    }
    showImage(next);
}

function prevImage() {
    let prev = currentIndex - 1;
    if (prev < 0) {
        if (!loopEnabled) return;
        prev = images.length - 1;
    }
    showImage(prev);
}

function resetIdleTimer() {
    if (!autoHideEnabled) {
        imageDisplay.classList.add('show-cursor');
        controlsBar.classList.remove('hide');
        return;
    }
    imageDisplay.classList.add('show-cursor');
    controlsBar.classList.remove('hide');
    clearTimeout(idleTimer);
    if (!isPlaying) {
        idleTimer = setTimeout(() => {
            imageDisplay.classList.remove('show-cursor');
            controlsBar.classList.add('hide');
        }, 3000);
    }
}

document.addEventListener('mousemove', resetIdleTimer);

// IPC
window.electronAPI.onNavigate((direction) => {
    if (direction === 'next') nextImage();
    if (direction === 'prev') prevImage();
});

window.electronAPI.togglePresentation = () => window.electronAPI.togglePresentation(); // Already in API

// Keyboard
document.addEventListener('keydown', (e) => {
    if (images.length === 0) return;
    resetIdleTimer();
    if (e.key === 'ArrowRight' || e.key === 'd') nextImage();
    if (e.key === 'ArrowLeft' || e.key === 'a') prevImage();
    if (e.key === ' ') toggleSlideshow();
});

// Update Logic
updateBtn.addEventListener('click', () => {
    updateBtn.textContent = 'Verificando...';
    window.electronAPI.checkForUpdates();
});

window.electronAPI.onUpdateMessage((msg) => {
    alert(msg);
    updateBtn.textContent = 'Verificar Atualizações';
});

// Support Logic
const supportBtn = document.getElementById('supportBtn');

supportBtn.onclick = () => {
    window.electronAPI.openUrl('https://joadsonrocha.github.io/apoieme/apoie-me.html');
};

