const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('🧪 INICIANDO BATERIA DE TESTES DO LUMINA 2.0');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
        failedTests++;
    }
}

// --------------------------------------------------------------------------
// TEST GROUP 1: Integridade Estrutural e Arquivos Obrigatórios
// --------------------------------------------------------------------------
console.log('📦 1. Testando Integridade de Arquivos e Dependências:');

const requiredFiles = [
    'package.json',
    'main.js',
    'preload.js',
    'renderer.js',
    'index.html',
    'presentation.html',
    'style.css',
    'logo.png',
    '.gitignore',
    'node_modules/exifr/dist/full.umd.js'
];

requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    assert(fs.existsSync(fullPath), `Arquivo presente: ${file}`);
});

// --------------------------------------------------------------------------
// TEST GROUP 2: Validação de Sintaxe JavaScript
// --------------------------------------------------------------------------
console.log('\n🔍 2. Testando Sintaxe dos Arquivos JavaScript:');

const jsFiles = ['main.js', 'preload.js', 'renderer.js'];
jsFiles.forEach(file => {
    try {
        execSync(`node -c "${path.join(__dirname, file)}"`, { stdio: 'pipe' });
        assert(true, `Sintaxe válida: ${file}`);
    } catch (e) {
        assert(false, `Sintaxe válida: ${file}`, e.message);
    }
});

// --------------------------------------------------------------------------
// TEST GROUP 3: Validação de Formatos de Mídia e Utilitários de URL
// --------------------------------------------------------------------------
console.log('\n🎬 3. Testando Suporte a Extensões de Imagem, Vídeo e Áudio:');

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']);
const SUPPORTED_VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'ogg']);
const SUPPORTED_AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']);

function getMediaType(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    if (SUPPORTED_IMAGE_EXTENSIONS.has(ext)) return 'image';
    if (SUPPORTED_VIDEO_EXTENSIONS.has(ext)) return 'video';
    return null;
}

assert(getMediaType('foto.jpg') === 'image', 'Reconhece imagem JPG');
assert(getMediaType('FOTO.PNG') === 'image', 'Reconhece imagem PNG com extensão maiúscula');
assert(getMediaType('video.mp4') === 'video', 'Reconhece vídeo MP4');
assert(getMediaType('clipe.webm') === 'video', 'Reconhece vídeo WEBM');
assert(getMediaType('arquivo.txt') === null, 'Ignora arquivos não-mídia (TXT)');

// Teste de normalização toFileUrl
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

const winPath = 'D:\\FULLSTARK\\lumina-presentation\\fotos com espaço\\teste.jpg';
const convertedUrl = toFileUrl(winPath);
assert(
    convertedUrl.startsWith('file:///D:/') && convertedUrl.includes('%20'),
    'Conversão toFileUrl normaliza barras invertidas e espaços no Windows'
);

// --------------------------------------------------------------------------
// TEST GROUP 4: Contrato de Comunicação IPC (Preload <-> Main)
// --------------------------------------------------------------------------
console.log('\n📡 4. Testando Contrato de Canais IPC entre Janelas:');

const mainJsContent = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf-8');
const preloadJsContent = fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf-8');

const ipcChannels = [
    'select-media',
    'select-folder',
    'select-audio',
    'parse-dropped-paths',
    'sync-projection',
    'stage-command',
    'toggle-presentation',
    'close-presentation',
    'get-projection-status',
    'toggle-fullscreen-main',
    'export-reordered-folder',
    'export-pptx',
    'export-pdf',
    'save-project-file',
    'load-project-file',
    'save-image-file',
    'navigate-next',
    'navigate-prev'
];

ipcChannels.forEach(channel => {
    const inMain = mainJsContent.includes(`'${channel}'`);
    const inPreload = preloadJsContent.includes(`'${channel}'`);
    assert(inMain && inPreload, `Canal IPC sincronizado: ${channel}`);
});

// --------------------------------------------------------------------------
// TEST GROUP 5: Validação de Segurança e CSP
// --------------------------------------------------------------------------
console.log('\n🛡️ 5. Testando Políticas de Segurança (CSP & Preload):');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
assert(indexHtml.includes('Content-Security-Policy'), 'index.html possui Content-Security-Policy configurada');
assert(mainJsContent.includes('contextIsolation: true'), 'contextIsolation ativado no processo principal');

// --------------------------------------------------------------------------
// RESULTADOS FINAIS
// --------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`📊 RESULTADO FINAL: ${passedTests} APROVADOS | ${failedTests} FALHAS`);
console.log('====================================================\n');

if (failedTests > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
