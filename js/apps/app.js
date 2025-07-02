import { showNotification } from '../main.js';

/**
 * Retorna o HTML padrão da barra de ferramentas para os aplicativos.
 */
export function getStandardAppToolbarHTML() {
    return `
        <button data-action="save" class="app-button" title="Salvar (Ctrl+S)"><i class="fas fa-save"></i> Salvar na Nuvem</button>
        <button data-action="save-as" class="app-button secondary" title="Salvar Como..."><i class="fas fa-file-export"></i> Salvar Como...</button>
        <button data-action="open-cloud" class="app-button secondary" title="Abrir da Nuvem..."><i class="fas fa-cloud-download-alt"></i> Abrir da Nuvem</button>
        <button data-action="export-pdf" class="app-button secondary" title="Exportar como PDF"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
    `;
}

/**
 * Inicializa o estado de um novo arquivo para um aplicativo.
 * @param {object} appState - O objeto de estado do aplicativo.
 * @param {string} defaultTitle - O título padrão da janela.
 * @param {string} defaultFileName - O nome de arquivo padrão para salvar.
 * @param {string} appDataType - O tipo de dados do aplicativo.
 */
export function initializeFileState(appState, defaultTitle, defaultFileName, appDataType) {
    appState.isDirty = false;
    appState.fileId = null;
    appState.defaultFileName = defaultFileName;
    appState.appDataType = appDataType;

    appState.markDirty = function() {
        if (!this.isDirty) {
            this.isDirty = true;
            const currentWin = window.windowManager.windows.get(this.winId);
            if (currentWin && !currentWin.title.startsWith('*')) {
                window.windowManager.updateWindowTitle(this.winId, '*' + currentWin.title);
            }
        }
    };
    
    appState.markClean = function() {
        this.isDirty = false;
        const currentWin = window.windowManager.windows.get(this.winId);
        if (currentWin && currentWin.title.startsWith('*')) {
             window.windowManager.updateWindowTitle(this.winId, currentWin.title.substring(1));
        }
    };

    window.windowManager.updateWindowTitle(appState.winId, defaultTitle);
}

/**
 * Configura as ações da barra de ferramentas para um aplicativo.
 * @param {object} appState - O objeto de estado do aplicativo.
 */
export function setupAppToolbarActions(appState) {
     const toolbar = window.windowManager.windows.get(appState.winId).element.querySelector('.app-toolbar');
     if(!toolbar) return;
     
     toolbar.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-action]');
        if(!button) return;
        const action = button.dataset.action;
        
        if (action === 'save') await handleSaveAction(appState);
        else if (action === 'save-as') await handleSaveAsAction(appState);
        else if (action === 'open-cloud') await openFileForApp();
        else if (action === 'export-pdf') handleExportToPDF(appState.winId);
     });
}

/**
 * Salva o estado atual do aplicativo. Se já tiver um fileId, salva sobre o mesmo arquivo.
 * @param {object} appState - O objeto de estado do aplicativo.
 */
export async function handleSaveAction(appState) {
    if (!window.firestoreManager) {
        showNotification("Acesso à nuvem não está pronto.", 3000);
        return;
    }
    if (appState.fileId) {
        const winData = window.windowManager.windows.get(appState.winId);
        showNotification(`Salvando "${winData.title.replace('*','').trim()}"...`, 2000);
        try {
            const dataToSave = appState.getData();
            const jsonString = JSON.stringify(dataToSave, null, 2);
            const fileMetadata = {
                fileId: appState.fileId,
                name: winData.title.replace('*','').trim(),
                appDataType: appState.appDataType
            };
            
            await window.firestoreManager.saveFile(fileMetadata, jsonString);
            appState.markClean();
            showNotification(`"${fileMetadata.name}" salvo na nuvem.`, 2500);
        } catch(e) {
             showNotification("Falha ao salvar. Verifique o console.", 4000);
        }
    } else {
        await handleSaveAsAction(appState);
    }
}

/**
 * Salva o estado atual do aplicativo como um novo arquivo.
 * @param {object} appState - O objeto de estado do aplicativo.
 */
export async function handleSaveAsAction(appState) {
     if (!window.firestoreManager) {
        showNotification("Acesso à nuvem não está pronto.", 3000);
        return;
    }
    const dataToSave = appState.getData();
    const defaultFilename = (appState.fileId && window.windowManager.windows.get(appState.winId)?.title) ?
        window.windowManager.windows.get(appState.winId).title.replace('*','').trim() : appState.defaultFileName;
    
    const newFilename = prompt("Salvar arquivo na nuvem como:", defaultFilename);
    if (!newFilename || newFilename.trim() === '') return;
    
    showNotification(`Salvando "${newFilename}"...`, 2000);
    try {
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const fileMetadata = {
            fileId: null, // Null indica um novo arquivo
            name: newFilename,
            appDataType: appState.appDataType
        };
        
        const savedFile = await window.firestoreManager.saveFile(fileMetadata, jsonString);

        appState.fileId = savedFile.id;
        appState.markClean();
        window.windowManager.updateWindowTitle(appState.winId, savedFile.name);
        showNotification(`Arquivo salvo como "${savedFile.name}" na nuvem.`, 3000);

    } catch(e) {
        showNotification("Falha ao salvar. Verifique o console.", 4000);
    }
}

/**
 * Exporta o conteúdo da janela ativa para PDF.
 * @param {string} winId - O ID da janela a ser exportada.
 */
export function handleExportToPDF(winId) {
    const winData = window.windowManager.windows.get(winId);
    if (!winData) {
        showNotification("Janela não encontrada para exportação.", 3000);
        return;
    }

    const winEl = winData.element;
    const contentEl = winEl.querySelector('.window-content'); 
    
    if (!contentEl) {
        showNotification("Conteúdo da janela não encontrado para exportação.", 3000);
        return;
    }

    const titleEl = winEl.querySelector('.window-title-text');
    const originalTitle = document.title;
    
    document.title = titleEl ? titleEl.textContent.replace('*','') : 'Exportação PMOS';
    document.body.classList.add('printing-mode');
    
    contentEl.classList.add('window-to-print');
    
    showNotification("Preparando para exportação. Use 'Salvar como PDF' na caixa de impressão.", 4000);

    setTimeout(() => {
        window.print();
        
        const cleanupPrintStyles = () => {
            document.body.classList.remove('printing-mode');
            contentEl.classList.remove('window-to-print');
            document.title = originalTitle;
            
            // Remove o listener para não interferir em outras impressões
            window.onafterprint = null; 
        };

        // Adiciona o listener para limpar os estilos APÓS a caixa de diálogo de impressão ser fechada
        if (window.onafterprint !== undefined) {
            window.onafterprint = cleanupPrintStyles;
        } else {
            // Fallback para navegadores que não suportam onafterprint (raro)
            setTimeout(cleanupPrintStyles, 500);
        }
    }, 250);
}


/**
 * Abre o explorador de arquivos para o usuário selecionar um arquivo para abrir.
 */
export function openFileForApp() {
    // Reutiliza a janela do explorador se já estiver aberta
    let fsWin = Array.from(window.windowManager.windows.values()).find(w => w.appType === 'filesystem');
    if (fsWin) {
        window.windowManager.makeActive(fsWin.element.id);
        return;
    }
    // Se não, abre uma nova
    window.windowManager.appLaunchActions['open-file-system']();
}
