<div align="center">

# 🌟 Lumina Presentation 2.0 PRO
### Apresentador e Visualizador Profissional de Fotos & Vídeos

[![Release](https://img.shields.io/badge/version-2.0.0-blue.svg?style=flat-square)](https://github.com/joadsonrocha/lumina-presentation)
[![Electron](https://img.shields.io/badge/Electron-41.5.0-47848F.svg?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-39%20Passed-22c55e.svg?style=flat-square)](https://github.com/joadsonrocha/lumina-presentation)
[![License](https://img.shields.io/badge/license-MIT-purple.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/joadsonrocha/lumina-presentation/pulls)

<p align="center">
  <b>O Lumina Presentation é uma aplicação desktop moderna projetada para apresentações de fotos e vídeos de alta performance, com suporte a Projeção em 2ª Tela (F5), Reordenação por Arrastar e Soltar (Drag & Drop), Exportação para PowerPoint (.pptx) e PDF (.pdf), e interface minimalista focada no conteúdo.</b>
</p>

</div>

---

## 📋 Índice

- [Destaques](#-destaques)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Central de Exportação & Projetos](#-central-de-exportação--projetos)
- [Atalhos de Teclado (Cheat Sheet)](#-atalhos-de-teclado)
- [Arquitetura & Tecnologias](#-arquitetura--tecnologias)
- [Como Instalar e Executar](#-como-instalar-e-executar)
- [Executando Testes Automatizados](#-executando-testes-automatizados)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença & Autor](#-licença--autor)

---

## ✨ Destaques

- 🎬 **Mídias Unificadas:** Apresente fotos (`JPG, PNG, WEBP, GIF, SVG, AVIF`) e vídeos (`MP4, WEBM, MOV, MKV, AVI`) juntos no mesmo fluxo.
- 📺 **Projeção Dual-Screen (F5):** Controle a apresentação na sua tela enquanto projeta em tela cheia sincronizada no segundo monitor ou projetor.
- 🔄 **Drag & Drop Inteligente:** Reordene slides com facilidade tanto na barra lateral de miniaturas quanto no modo grade em mosaico.
- 📊 **Exportação Multi-Formato:** Gere arquivos nativos de **PowerPoint (.pptx)**, documentos **PDF (.pdf)** widescreen 16:9, ou copie pastas com ordenação numérica (`01_...`, `02_...`).
- ⏱️ **HUD do Apresentador:** Cronômetro integrado de palco, indicador de próximo slide (*Next Up*) e comandos rápidos de palco (<kbd>B</kbd> para Blackout, <kbd>W</kbd> para Whiteout).
- 🎵 **Playlist de Áudio Integrada:** Adicione trilhas sonoras e músicas de fundo com controle suave de volume e atalho de mudo (<kbd>M</kbd>).
- 🎨 **Interface Clean & Minimalista:** Paleta grafite escura elegante, sem excesso de brilhos artificiais, com efeito Ambilight sutil de fundo.

---

## 🚀 Funcionalidades Principais

### 1. 📺 Projeção em Segunda Tela (F5)
- Detecção automática de monitores secundários via Electron Screen API.
- Sincronização bidirecional em tempo real de filtros (P&B, Sépia, Alto Contraste), rotação de 90° em 90°, enquadramento (*Contain / Cover*) e margens (*Safe Area*).
- Fechamento e reabertura limpos com tecla <kbd>F5</kbd> ou <kbd>Esc</kbd>.

### 2. 🔄 Reordenação por Arrastar e Soltar (Drag & Drop)
- **Barra Lateral de Miniaturas:** Arraste qualquer miniatura de foto ou vídeo para reposicionar sua ordem. Indicadores visuais mostram o ponto exato de inserção.
- **Modo Grade / Mosaico (Tecla <kbd>G</kbd>):** Visão panorâmica de todos os slides para reorganização rápida, busca por nome e ordenação por filtros (A-Z, Tipo, Shuffle).

### 3. ➕ Adição Contínua de Mídias
- Adicione novas fotos ou pastas inteiras a qualquer momento sem perder os itens que já estavam na apresentação.
- Filtro inteligente anti-duplicatas para evitar inclusão acidental do mesmo arquivo.
- Botão **Limpar Apresentação (🗑️)** para recomeçar quando desejado.

### 4. 🎬 Motor de Reprodução de Vídeos
- Suporte nativo aos formatos `MP4`, `WEBM`, `MOV`, `MKV`, `AVI` e `OGG`.
- Barra de controle de vídeo com seekbar interativa, tempo decorrido, duração total e volume independente.
- Opção configurável de **Avanço Automático**: avança automaticamente para o próximo slide assim que o vídeo termina.

### 5. 🔍 Inspetor de Metadados EXIF
- Leitura instantânea de dados de câmera, ISO, abertura (f-stop), tempo de exposição, data original e resolução via [Exifr](https://github.com/MikeKovarik/exifr).

---

## 📤 Central de Exportação & Projetos

O Lumina conta com um painel dedicado de exportação acessível pelo botão de download no cabeçalho:

| Opção | Descrição |
| :--- | :--- |
| **📊 Exportar PowerPoint (.pptx)** | Cria um arquivo nativo do Microsoft PowerPoint em formato widescreen 16:9 com todos os slides organizados. |
| **📄 Exportar Documento PDF (.pdf)** | Gera um álbum / apresentação em PDF widescreen em alta definição com 1 slide por página. |
| **📁 Exportar Pasta Ordenada** | Copia todas as fotos e vídeos para uma nova pasta com prefixos numéricos (`01_nome.jpg`, `02_video.mp4`). |
| **💾 Salvar Projeto (.lumina)** | Salva o estado completo da apresentação (mídias, playlist e configurações) em arquivo JSON `.lumina`. |
| **📂 Abrir Projeto (.lumina)** | Restaura uma apresentação salva anteriormente em um clique. |
| **🖼️ Salvar Slide Atual** | Exporta a foto em exibição com os filtros e rotação aplicados em formato PNG/JPG. |

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
| :--- | :--- |
| <kbd>→</kbd> ou <kbd>D</kbd> | Próximo Slide / Mídia |
| <kbd>←</kbd> ou <kbd>A</kbd> | Slide / Mídia Anterior |
| <kbd>Espaço</kbd> | Iniciar / Pausar Slideshow |
| <kbd>F5</kbd> | Ativar / Desativar Projeção (2ª Tela) |
| <kbd>F11</kbd> ou <kbd>F</kbd> | Alternar Tela Cheia na Janela Principal |
| <kbd>G</kbd> | Abrir / Fechar Modo Grade (Mosaico) |
| <kbd>B</kbd> | Alternar Modo Blackout (Tela Preta Instantânea) |
| <kbd>W</kbd> | Alternar Modo Whiteout (Tela Branca Instantânea) |
| <kbd>R</kbd> | Girar Mídia em 90° |
| <kbd>M</kbd> | Mutar / Desmutar Áudio (Vídeo ou Música de Fundo) |
| <kbd>Home</kbd> | Ir para o Primeiro Slide |
| <kbd>End</kbd> | Ir para o Último Slide |
| <kbd>Esc</kbd> | Fechar Modais / Desativar Blackout/Whiteout |
| <kbd>Ctrl</kbd> + <kbd>Scroll</kbd> | Zoom In / Zoom Out Interativo |
| <kbd>Duplo Clique</kbd> | Alternar Zoom 1.75x com Pan |

---

## 🛠️ Arquitetura & Tecnologias

```
+-------------------------------------------------------------+
|                     LUMINA PRESENTATION                     |
+-------------------------------------------------------------+
|  [Main Process (Node.js/Electron)]                          |
|  - Process Singleton Lock (Prevenção de conflitos no disco) |
|  - Multi-Display Engine (Detecção de Monitores Secundários) |
|  - PPTX Engine (PptxGenJS) & PDF PrintToPDF Engine          |
|  - File System Scanners (Varredura Recursiva de Pastas)     |
+-------------------------------------------------------------+
                              ↕ IPC Channels
+-------------------------------------------------------------+
|  [Preload Context Bridge (Segurança & CSP)]                 |
+-------------------------------------------------------------+
                              ↕
+------------------------------+------------------------------+
|  [Janela Principal]          |  [Janela de Projeção]        |
|  - HUD do Apresentador       |  - Tela Cheia sem Bordas     |
|  - Drag & Drop Reordering    |  - Sincronização em Tempo    |
|  - Playlist de Áudio         |    Real (State Mirroring)    |
|  - Central de Exportação     |  - Overlays de Palco         |
+------------------------------+------------------------------+
```

- **Runtime:** [Electron 41](https://www.electronjs.org/)
- **Linguagens:** JavaScript (ES6+), HTML5, CSS3 Nativo (sem Tailwind)
- **Bibliotecas:**
  - `pptxgenjs` (Geração nativa de apresentações PowerPoint)
  - `exifr` (Leitura de metadados fotográficos EXIF)
  - `electron-updater` (Verificação de novas versões)

---

## 📦 Como Instalar e Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior instalado.

### 1. Clonar o repositório
```bash
git clone https://github.com/joadsonrocha/lumina-presentation.git
cd lumina-presentation
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Executar o aplicativo
```bash
npm start
```

---

## 🧪 Executando Testes Automatizados

O projeto conta com uma suíte de testes automatizados que valida a integridade dos arquivos, sintaxe JavaScript, contratos de canais IPC, suporte a extensões de mídia e conversão de caminhos no Windows:

```bash
npm test
```

Resultado esperado:
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
📊 RESULTADO FINAL: 39 APROVADOS | 0 FALHAS
====================================================
```

---

## 📁 Estrutura do Projeto

```
lumina-presentation/
├── .gitignore              # Regras de exclusão do Git
├── index.html              # Interface do Apresentador (Janela Principal)
├── presentation.html       # Tela de Projeção em 2ª Tela
├── main.js                 # Processo Principal do Electron & Exportadores
├── preload.js              # Context Bridge seguro para comunicação IPC
├── renderer.js             # Motor de renderização, slideshow e HUD
├── style.css               # Design System minimalista escuro
├── test-suite.js           # Suíte de testes automatizados
├── logo.png                # Identidade visual da aplicação
├── package.json            # Manifesto e dependências do projeto
└── README.md               # Documentação do projeto
```

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  Desenvolvido com dedicação por <b><a href="https://github.com/joadsonrocha">Joadson Rocha</a></b>
</div>
