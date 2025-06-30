import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openKanbanBoard() {
    const uniqueSuffix = generateId('kanban');
    const winId = window.windowManager.createWindow('Kanban Board', '', { width: '1000px', height: '650px', appType: 'kanban-board' });
    const content = `
        <div class="app-toolbar kanban-toolbar">
            ${getStandardAppToolbarHTML()}
            <button id="addKanbanColumnBtn_${uniqueSuffix}" class="app-button" style="margin-left:auto;"><i class="fas fa-plus-square"></i> Nova Coluna</button>
        </div>
        <div class="kanban-board-container" id="kanbanBoardContainer_${uniqueSuffix}"></div>`;

    const winData = window.windowManager.windows.get(winId); if (!winData) return winId;
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId, boardData: { columns: [] }, appDataType: 'kanban-board',
        containerEl: winData.element.querySelector(`#kanbanBoardContainer_${uniqueSuffix}`),
        draggedCard: null, draggedCardData: null, sourceColumnId: null,
        getData: function() { return this.boardData; },
        loadData: function(dataString, fileMeta) { 
            let data;
            try { data = JSON.parse(dataString); } catch (e) { showNotification("Erro ao ler arquivo Kanban.", 3000); this.loadDefaultBoard(); this.renderBoard(); return; } 
            this.boardData = (data && data.columns) ? data : { columns: [] }; 
            (this.boardData.columns || []).forEach(col => { col.id = col.id || generateId('col'); (col.cards || []).forEach(card => { card.id = card.id || generateId('card'); }); }); 
            this.fileId = fileMeta.id; 
            this.markClean(); 
            window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
            this.renderBoard(); 
        },
        init: function() { 
            setupAppToolbarActions(this);
            winData.element.querySelector(`#addKanbanColumnBtn_${uniqueSuffix}`).onclick = () => this.addColumn(); 
            this.containerEl.addEventListener('click', (e) => this.handleBoardClick(e)); 
            this.containerEl.addEventListener('input', (e) => this.handleBoardInput(e)); 
            this.containerEl.addEventListener('dragstart', (e) => this.handleDragStart(e)); 
            this.containerEl.addEventListener('dragend', (e) => this.handleDragEnd(e)); 
            this.containerEl.addEventListener('dragover', (e) => this.handleDragOver(e)); 
            this.containerEl.addEventListener('drop', (e) => this.handleDrop(e)); 
            if(!this.boardData.columns.length) this.loadDefaultBoard(); 
            this.renderBoard(); 
        },
        loadDefaultBoard: function() { this.boardData = { columns: [ { id: generateId('col'), title: 'A Fazer', cards: [] }, { id: generateId('col'), title: 'Em Andamento', cards: [] }, { id: generateId('col'), title: 'Concluído', cards: [] } ] }; },
        renderBoard: function() { this.containerEl.innerHTML = ''; this.boardData.columns.forEach(column => this.renderColumn(column)); },
        renderColumn: function(columnData) { const colEl = document.createElement('div'); colEl.className = 'kanban-column'; colEl.dataset.columnId = columnData.id; colEl.innerHTML = `<div class="kanban-column-header"><input type="text" class="kanban-column-title" value="${columnData.title}" placeholder="Título"><div class="kanban-column-actions"><button class="app-button danger small-action" data-action="delete-column" title="Excluir Coluna"><i class="fas fa-trash"></i></button></div></div><div class="kanban-cards-container"></div><button class="app-button secondary kanban-add-card-btn" data-action="add-card"><i class="fas fa-plus"></i> Adicionar Cartão</button>`; const cardsContainer = colEl.querySelector('.kanban-cards-container'); (columnData.cards || []).forEach(card => this.renderCard(cardsContainer, card)); this.containerEl.appendChild(colEl); },
        renderCard: function(cardsContainerEl, cardData) { const cardEl = document.createElement('div'); cardEl.className = 'kanban-card'; cardEl.dataset.cardId = cardData.id; cardEl.draggable = true; cardEl.innerHTML = `<span class="kanban-card-title">${cardData.title}</span> ${cardData.description ? `<div class="kanban-card-description">${cardData.description}</div>` : ''} <div class="kanban-card-meta"><span class="kanban-card-id">#${cardData.id.slice(-5)}</span> <div class="kanban-card-actions"><button class="app-button secondary action-button" data-action="edit-card" title="Editar"><i class="fas fa-edit"></i></button> <button class="app-button danger action-button" data-action="delete-card" title="Excluir"><i class="fas fa-trash"></i></button></div></div>`; cardsContainerEl.appendChild(cardEl); },
        addColumn: function() { const title = prompt("Nome da nova coluna:", "Nova Coluna"); if (title) { this.boardData.columns.push({ id: generateId('col'), title: title, cards: [] }); this.markDirty(); this.renderBoard(); } },
        addCard: function(columnId) { const title = prompt("Título do cartão:", "Nova Tarefa"); if (!title) return; const description = prompt("Descrição:", ""); const column = this.boardData.columns.find(c => c.id === columnId); if (column) { column.cards.push({ id: generateId('card'), title, description }); this.markDirty(); this.renderBoard(); } },
        editCard: function(columnId, cardId) { const column = this.boardData.columns.find(c => c.id === columnId); if (!column) return; const card = column.cards.find(ca => ca.id === cardId); if (!card) return; const newTitle = prompt("Novo título:", card.title); if (newTitle === null) return; const newDescription = prompt("Nova descrição:", card.description || ""); if (newDescription === null) return; card.title = newTitle; card.description = newDescription; this.markDirty(); this.renderBoard(); },
        deleteColumn: function(columnId) { if (confirm("Excluir coluna e cartões?")) { this.boardData.columns = this.boardData.columns.filter(c => c.id !== columnId); this.markDirty(); this.renderBoard(); } },
        deleteCard: function(columnId, cardId) { if (confirm("Excluir cartão?")) { const column = this.boardData.columns.find(c => c.id === columnId); if (column) { column.cards = column.cards.filter(c => c.id !== cardId); this.markDirty(); this.renderBoard(); } } },
        handleBoardClick: function(e) { const button = e.target.closest('button[data-action]'); if (!button) return; const action = button.dataset.action; const columnEl = button.closest('.kanban-column'); const columnId = columnEl?.dataset.columnId; const cardEl = button.closest('.kanban-card'); const cardId = cardEl?.dataset.cardId; if (action === 'add-card') this.addCard(columnId); else if (action === 'delete-column') this.deleteColumn(columnId); else if (action === 'edit-card') this.editCard(columnId, cardId); else if (action === 'delete-card') this.deleteCard(columnId, cardId); },
        handleBoardInput: function(e) { if (e.target.classList.contains('kanban-column-title')) { const columnId = e.target.closest('.kanban-column').dataset.columnId; const column = this.boardData.columns.find(c => c.id === columnId); if (column) { column.title = e.target.value; this.markDirty();} } },
        handleDragStart: function(e) { if (!e.target.classList.contains('kanban-card')) return; this.draggedCard = e.target; this.draggedCard.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; this.sourceColumnId = this.draggedCard.closest('.kanban-column').dataset.columnId; const sourceColData = this.boardData.columns.find(c => c.id === this.sourceColumnId); this.draggedCardData = sourceColData.cards.find(c => c.id === this.draggedCard.dataset.cardId); },
        handleDragEnd: function() { if (this.draggedCard) { this.draggedCard.classList.remove('dragging'); } this.draggedCard = null; this.draggedCardData = null; this.sourceColumnId = null; document.querySelectorAll('.kanban-drop-placeholder').forEach(p => p.remove()); },
        handleDragOver: function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const targetColumnEl = e.target.closest('.kanban-column'); if (!targetColumnEl) return; const cardsContainer = targetColumnEl.querySelector('.kanban-cards-container'); const afterElement = [...cardsContainer.querySelectorAll('.kanban-card:not(.dragging)')].reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = e.clientY - box.top - box.height / 2; return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest; }, { offset: Number.NEGATIVE_INFINITY }).element; document.querySelectorAll('.kanban-drop-placeholder').forEach(p => p.remove()); const placeholder = document.createElement('div'); placeholder.className = 'kanban-drop-placeholder'; if (afterElement == null) { cardsContainer.appendChild(placeholder); } else { cardsContainer.insertBefore(placeholder, afterElement); } },
        handleDrop: function(e) { e.preventDefault(); document.querySelectorAll('.kanban-drop-placeholder').forEach(p => p.remove()); if (!this.draggedCardData) return; const targetColumnEl = e.target.closest('.kanban-column'); if (!targetColumnEl) return; const targetColumnId = targetColumnEl.dataset.columnId; const afterElement = [...targetColumnEl.querySelectorAll('.kanban-card:not(.dragging)')].reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = e.clientY - box.top - box.height / 2; return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest; }, { offset: Number.NEGATIVE_INFINITY }).element; const sourceColData = this.boardData.columns.find(c => c.id === this.sourceColumnId); const cardIndex = sourceColData.cards.findIndex(c => c.id === this.draggedCardData.id); if (cardIndex > -1) { sourceColData.cards.splice(cardIndex, 1); } const targetColData = this.boardData.columns.find(c => c.id === targetColumnId); const targetCardId = afterElement ? afterElement.dataset.cardId : null; let insertAtIndex = targetColData.cards.length; if (targetCardId) { insertAtIndex = targetColData.cards.findIndex(c => c.id === targetCardId); } if (insertAtIndex === -1) insertAtIndex = targetColData.cards.length; targetColData.cards.splice(insertAtIndex, 0, this.draggedCardData); this.markDirty(); this.renderBoard(); },
        cleanup: () => {}
    };
    initializeFileState(appState, "Novo Kanban Board", "board.kanban", "kanban-board");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}