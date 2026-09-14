<div align="center">

# 🌟 Lumina Presentation 2.0 PRO
### Professional Photo & Video Presenter and Dual-Screen Viewer

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

[![Release](https://img.shields.io/badge/version-2.0.0-blue.svg?style=flat-square)](https://github.com/joadsonrocha/lumina-presentation)
[![Electron](https://img.shields.io/badge/Electron-41.5.0-47848F.svg?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-40%20Passed-22c55e.svg?style=flat-square)](https://github.com/joadsonrocha/lumina-presentation)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/joadsonrocha/lumina-presentation/pulls)

<p align="center">
  <b>Lumina Presentation is a modern desktop application built for high-performance photo and video slideshows, featuring synchronized Dual-Screen Projection (F5), Drag & Drop reordering, PowerPoint (.pptx) & PDF (.pdf) export, background audio playback, and a clean, minimalist interface focused on content.</b>
</p>

</div>

---

## 📋 Table of Contents

- [Highlights](#-highlights)
- [Key Features](#-key-features)
- [Export & Project Management](#-export--project-management)
- [Keyboard Shortcuts (Cheat Sheet)](#-keyboard-shortcuts)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Installation & Getting Started](#-installation--getting-started)
- [Running Automated Tests](#-running-automated-tests)
- [Project Structure](#-project-structure)
- [License & Author](#-license--author)

---

## ✨ Highlights

- 🎬 **Unified Media Engine:** Present photos (`JPG, PNG, WEBP, GIF, SVG, AVIF`) and videos (`MP4, WEBM, MOV, MKV, AVI, OGG`) seamlessly in the same playlist.
- 📺 **Dual-Screen Projection (F5):** Control the presentation on your main display while projecting clean, synchronized fullscreen output to a secondary monitor or projector.
- 🔄 **Smart Drag & Drop:** Easily reorder slides in the thumbnail sidebar or switch to the mosaic overview Grid mode.
- 📊 **Multi-Format Exporting:** Generate native **PowerPoint (.pptx)** presentations, high-definition **PDF (.pdf)** albums, or export sequentially numbered folders (`01_...`, `02_...`).
- ⏱️ **Presenter HUD:** Built-in presentation stopwatch, upcoming slide preview card (*Next Up*), and instant stage controls (<kbd>B</kbd> for Blackout, <kbd>W</kbd> for Whiteout).
- 🎵 **Integrated Audio Playlist:** Add background music and soundtracks with smooth volume controls and mute shortcut (<kbd>M</kbd>).
- 🎨 **Minimalist Dark Aesthetics:** Sleek graphite dark palette with subtle Ambilight halo effect, smooth animations, and zero visual clutter.

---

## 🚀 Key Features

### 1. 📺 Dual-Screen Projection (F5)
- Automatic secondary display detection via Electron's Screen API.
- Real-time bidirectional synchronization for image filters (B&W, Sepia, High Contrast), 90° increments rotation, framing (*Contain / Cover*), and margins (*Safe Area*).
- Clean opening and closing with <kbd>F5</kbd> or <kbd>Esc</kbd>.

### 2. 🔄 Drag & Drop Reordering
- **Sidebar Thumbnails:** Drag and drop any photo or video thumbnail to reorder. Clear visual indicators show the exact drop destination.
- **Grid Mosaic Mode (Key <kbd>G</kbd>):** Full-screen panoramic view of all media items for rapid reorganization, title search, and automated sorting (A-Z, Media Type, Shuffle).

### 3. ➕ Continuous Media Ingestion
- Append new files or complete folders at any time without resetting the active slideshow.
- Intelligent deduplication filter prevents accidental duplicate entries.
- Quick **Clear Presentation (🗑️)** with confirmation dialog to protect against accidental resets.

### 4. 🎬 Video Playback Engine
- Native hardware-accelerated playback for `MP4`, `WEBM`, `MOV`, `MKV`, `AVI`, and `OGG`.
- Integrated video control bar with interactive seekbar, elapsed time, total duration, and volume slider.
- Optional **Auto-Advance**: automatically transitions to the next slide once the video completes.

### 5. 🔍 EXIF Metadata Inspector
- Instant camera specs inspection: ISO, focal aperture (f-stop), exposure time, capture date, and original resolution powered by [Exifr](https://github.com/MikeKovarik/exifr).

---

## 📤 Export & Project Management

Access the dedicated export dialog anytime via the header download button:

| Feature | Description |
| :--- | :--- |
| **📊 Export to PowerPoint (.pptx)** | Generates a native Microsoft PowerPoint widescreen (16:9) presentation file with all slides organized. |
| **📄 Export to PDF Document (.pdf)** | Creates a high-resolution widescreen PDF presentation album with one slide per page. |
| **📁 Export Sequentially Numbered Folder** | Copies all images and videos to a selected destination folder with padded numerical prefixes (`01_name.jpg`, `02_clip.mp4`). |
| **💾 Save Project (.lumina)** | Stores the entire presentation state (media paths, playlist, and customized preferences) into a portable `.lumina` project file. |
| **📂 Open Project (.lumina)** | Restores a previously saved presentation session in one click. |
| **🖼️ Save Current Frame** | Exports the current slide with active filters and rotation applied as a PNG/JPG image file. |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>→</kbd> or <kbd>D</kbd> | Next Slide / Media |
| <kbd>←</kbd> or <kbd>A</kbd> | Previous Slide / Media |
| <kbd>Space</kbd> | Start / Pause Slideshow |
| <kbd>F5</kbd> | Toggle Projection (2nd Screen) |
| <kbd>F11</kbd> or <kbd>F</kbd> | Toggle Fullscreen on Main Window |
| <kbd>G</kbd> | Toggle Grid Overview (Mosaic Mode) |
| <kbd>B</kbd> | Toggle Blackout (Instant Black Screen) |
| <kbd>W</kbd> | Toggle Whiteout (Instant White Screen) |
| <kbd>R</kbd> | Rotate Media 90° Clockwise |
| <kbd>M</kbd> | Mute / Unmute Audio (Video or Background Music) |
| <kbd>Home</kbd> | Jump to First Slide |
| <kbd>End</kbd> | Jump to Last Slide |
| <kbd>Esc</kbd> | Close Modals / Exit Blackout & Whiteout |
| <kbd>Ctrl</kbd> + <kbd>Scroll</kbd> | Interactive Zoom In / Zoom Out |
| <kbd>Double Click</kbd> | Toggle 1.75x Zoom with Panning |

---

## 🛠️ Architecture & Tech Stack

```
+-------------------------------------------------------------+
|                     LUMINA PRESENTATION                     |
+-------------------------------------------------------------+
|  [Main Process (Node.js/Electron)]                          |
|  - Process Singleton Lock (Prevents duplicate instances)    |
|  - Multi-Display Engine (Secondary monitor discovery)       |
|  - PPTX Engine (PptxGenJS) & PDF PrintToPDF Engine          |
|  - File System Scanners (Recursive directory traversal)     |
+-------------------------------------------------------------+
                              ↕ IPC Channels
+-------------------------------------------------------------+
|  [Preload Context Bridge (Security, CSP & Cleanup Handlers)]|
+-------------------------------------------------------------+
                              ↕
+------------------------------+------------------------------+
|  [Main Window]               |  [Projection Window]         |
|  - Presenter HUD             |  - Borderless Fullscreen     |
|  - Drag & Drop Reordering    |  - Real-Time State Mirroring |
|  - Background Audio Playlist |  - Instant Stage Overlays    |
|  - Export Center             |  - Ambilight Background Glow |
+------------------------------+------------------------------+
```

- **Runtime:** [Electron 41](https://www.electronjs.org/)
- **Languages:** Vanilla JavaScript (ES6+), HTML5, Native CSS3 (No Tailwind)
- **Dependencies:**
  - `pptxgenjs` (Native PowerPoint slide deck generation)
  - `exifr` (Photo EXIF metadata parser)
  - `electron-updater` (Auto-update checks)

---

## 📦 Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) version 18 or higher.

### 1. Clone the repository
```bash
git clone https://github.com/joadsonrocha/lumina-presentation.git
cd lumina-presentation
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the application
```bash
npm start
```

---

## 🧪 Running Automated Tests

The repository includes an automated test suite verifying file integrity, JavaScript syntax, IPC channel contracts, media extensions, and cross-platform path normalization:

```bash
npm test
```

Expected output:
```
====================================================
🧪 INICIANDO BATERIA DE TESTES DO LUMINA 2.0
====================================================
📦 1. Integridade de Arquivos e Dependências  [PASS]
🔍 2. Validação de Sintaxe JavaScript         [PASS]
🎬 3. Suporte a Imagens, Vídeos e Áudio       [PASS]
📡 4. Contrato de Canais IPC entre Janelas    [PASS]
🛡️ 5. Políticas de Segurança (CSP & Preload)   [PASS]
====================================================
📊 RESULTADO FINAL: 40 APROVADOS | 0 FALHAS
====================================================
```

---

## 📁 Project Structure

```
lumina-presentation/
├── .gitignore              # Git ignore rules
├── index.html              # Main presenter interface
├── presentation.html       # Projection window (2nd screen)
├── main.js                 # Electron main process & export engines
├── preload.js              # Secure IPC Context Bridge
├── renderer.js             # UI logic, HUD, slideshow & video engine
├── style.css               # Dark minimalist design system
├── test-suite.js           # Automated test suite
├── logo.png                # Visual brand assets
├── package.json            # Project manifest & scripts
├── LICENSE                 # GNU General Public License v3.0 (GPLv3)
├── README.md               # English Documentation
└── README.pt-BR.md         # Portuguese Documentation
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Developed with care by <b><a href="https://github.com/joadsonrocha">Joadson Rocha</a></b>
</div>
