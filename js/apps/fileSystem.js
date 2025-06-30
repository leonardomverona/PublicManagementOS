import { generateId, showNotification } from '../main.js';
import { openSWOTAnalysis } from './swotAnalysis.js';
import { openOKRTracker } from './okrTracker.js';
import { openGanttChart } from './ganttChart.js';
import { openProjectTasks } from './projectTasks.js';
import { openIshikawaDiagram } from './ishikawaDiagram.js';
import { openBPMNModeler } from './bpmnModeler.js';
import { openMindMap } from './mindMap.js';
import { openContractManager } from './contractManager.js';
import { openChecklistTool } from './checklistTool.js';
import { openNCRTool } from './ncrTool.js';
import { openPDCATool } from './pdcaTool.js';
import { open5W2HTool } from './5w2hTool.js';
import { openKanbanBoard } from './kanbanBoard.js';
import { openSIPOCMatrix } from './sipocMatrix.js';


function getAppOpenerForFile(file) {
    const appFileMap = {
        'swot-analysis': openSWOTAnalysis,
        'okr-tracker': openOKRTracker,
        'gantt-chart': openGanttChart,
        'project-tasks': openProjectTasks,
        'ishikawa-diagram': openIshikawaDiagram,
        'bpmn-modeler': openBPMNModeler,
        'mindmap': openMindMap,
        'contract-manager': openContractManager,
        'checklist': openChecklistTool,
        'ncr': openNCRTool,
        'pdca': openPDCATool,
        '5w2h': open5W2HTool,
        'kanban-board': openKanbanBoard,
        'sipoc-matrix': openSIPOCMatrix
    };
    return appFileMap[file.appDataType] || null;
}

export async function openFileSystem() {
    const uniqueSuffix = generateId('fs');
    const content = `
        <div class="file-explorer" style="flex-direction: column;">
            <div style="padding: 10px; border-bottom: 1px solid var(--separator-color); display:flex; align-items:center; gap:10px;">
                <h3 style="margin:0; flex-grow:1;">Meus Arquivos (Nuvem)</h3>
                <button id="refreshFsBtn_${uniqueSuffix}" class="app-button secondary" title="Atualizar Lista"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div class="file-content" id="fileListContainer_${uniqueSuffix}" style="flex-grow:1;">
                <p>Carregando arquivos...</p>
            </div>
        </div>`;
    const winId = window.windowManager.createWindow('Explorador de Arquivos', content, {
        width: '800px',
        height: '550px',
        appType: 'filesystem'
    });

    const winData = window.windowManager.windows.get(winId);
    if (!winData) return;
    const fileListContainer = winData.element.querySelector(`#fileListContainer_${uniqueSuffix}`);
    
    async function renderFileList() {
        if (!window.firestoreManager) {
            fileListContainer.innerHTML = '<p style="color:red;">Não conectado à nuvem.</p>';
            return;
        }
        fileListContainer.innerHTML = '<p>Carregando arquivos...</p>';
        try {
            const files = await window.firestoreManager.listFiles();
            fileListContainer.innerHTML = '';
            if (files.length === 0) {
                fileListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--secondary-text-color);">Nenhum arquivo encontrado na nuvem.</p>';
                return;
            }
            
            const table = document.createElement('table');
            table.className = 'app-table';
            table.innerHTML = `<thead><tr><th>Nome do Arquivo</th><th>Tipo</th><th>Modificado em</th><th>Ações</th></tr></thead><tbody></tbody>`;
            const tbody = table.querySelector('tbody');
            
            files.forEach(file => {
                const appType = file.appDataType || 'Desconhecido';
                const appIcons = { 'swot-analysis': '📝', 'okr-tracker': '🎯', 'gantt-chart': '📊', 'project-tasks': '✅', 'ishikawa-diagram': '🐠', 'bpmn-modeler': '🔄', 'mindmap': '🧠', 'contract-manager': '📜', 'checklist': '☑️', 'ncr': '⚠️', 'pdca': '🔁', '5w2h': '❓', 'kanban-board': '📋', 'sipoc-matrix': '🧩' };
                const appIcon = appIcons[appType] || '📄';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="item-icon">${appIcon}</span> ${file.name}</td>
                    <td>${appType}</td>
                    <td>${new Date(file.modifiedTime).toLocaleString('pt-BR')}</td>
                    <td>
                        <button class="app-button action-button" data-action="open" data-file-id="${file.id}" data-file-name="${file.name}" title="Abrir"><i class="fas fa-folder-open"></i></button>
                        <button class="app-button secondary action-button" data-action="rename" data-file-id="${file.id}" data-file-name="${file.name}" title="Renomear"><i class="fas fa-edit"></i></button>
                        <button class="app-button danger action-button" data-action="delete" data-file-id="${file.id}" data-file-name="${file.name}" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            fileListContainer.appendChild(table);

        } catch (e) {
            fileListContainer.innerHTML = `<p style="color:red;">Erro ao carregar arquivos: ${e.message}</p>`;
        }
    }

    fileListContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const fileId = button.dataset.fileId;
        const fileName = button.dataset.fileName;
        const action = button.dataset.action;

        if (action === 'open') {
            showNotification(`Abrindo "${fileName}"...`, 2000);
            try {
                const fileContentString = await window.firestoreManager.readFile(fileId);
                const filesList = await window.firestoreManager.listFiles();
                const fileMeta = filesList.find(f => f.id === fileId);

                const appOpener = getAppOpenerForFile(fileMeta);
                if (!appOpener) {
                     showNotification(`Não há aplicativo para abrir "${fileMeta.name}".`, 3000);
                     return;
                }
                
                const newWinId = appOpener();
                const newWinData = window.windowManager.windows.get(newWinId);
                newWinData.currentAppInstance.loadData(fileContentString, {id: fileId, name: fileName, ...fileMeta});

            } catch(err) {
                console.error("Error opening file: ", err);
                showNotification(`Falha ao abrir o arquivo.`, 4000);
            }

        } else if (action === 'rename') {
            const newName = prompt(`Novo nome para "${fileName}":`, fileName);
            if(newName && newName.trim() !== '') {
                await window.firestoreManager.renameFile(fileId, newName);
                showNotification("Arquivo renomeado.", 2000);
                renderFileList();
            }
        } else if (action === 'delete') {
            if (confirm(`Tem certeza que deseja excluir "${fileName}" da nuvem?`)) {
                await window.firestoreManager.deleteFile(fileId);
                showNotification("Arquivo excluído.", 2000);
                renderFileList();
            }
        }
    });

    winData.element.querySelector(`#refreshFsBtn_${uniqueSuffix}`).onclick = renderFileList;
    renderFileList();
}