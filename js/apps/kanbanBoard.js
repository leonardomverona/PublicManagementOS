import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openKanbanBoard() {
    const uniqueSuffix = generateId('kanban');
    const winId = window.windowManager.createWindow('Quadro Kanban', '', { width: '1200px', height: '750px', appType: 'kanban-board' });
    const content = `
        <div class="app-toolbar kanban-toolbar">
            ${getStandardAppToolbarHTML()}
            <div class="toolbar-group" style="margin-left: auto;">
                <button id="addColumnBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-plus"></i> Nova Coluna</button>
            </div>
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="searchInput_${uniqueSuffix}" class="app-input" placeholder="Buscar tarefas..." style="margin-bottom:0; width: 250px; padding-left: 35px;">
            </div>
        </div>
        <div class="kanban-board" id="kanbanBoard_${uniqueSuffix}">
            <!-- Colunas e o botão de adicionar coluna serão renderizados aqui -->
        </div>

        <!-- Modal para Edição/Criação de Card -->
        <div class="modal-overlay" id="cardModal_${uniqueSuffix}" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 100;">
            <div class="modal-content" style="background: var(--window-bg); border-radius: 12px; width: 100%; max-width: 600px; box-shadow: var(--shadow);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid var(--separator-color); display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="modal-title" style="font-size: 1.3rem; font-weight: 600;">Editar Tarefa</h3>
                    <button class="modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 25px;">
                    <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Título</label>
                            <input type="text" class="app-input" id="cardTitleInput">
                        </div>
                        <div class="form-group">
                            <label>Prioridade</label>
                            <select class="app-select" id="cardPriorityInput">
                                <option value="low">Baixa</option>
                                <option value="medium" selected>Média</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Data de Vencimento</label>
                            <input type="date" class="app-input" id="cardDueDateInput">
                        </div>
                        <div class="form-group">
                            <label>Responsável</label>
                            <input type="text" class="app-input" id="cardAssigneeInput">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Descrição</label>
                            <textarea class="app-textarea" id="cardDescriptionInput" rows="3"></textarea>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Tags (separadas por vírgula)</label>
                            <input type="text" class="app-input" id="cardTagsInput">
                        </div>
                    </div>
                </div>
                <div class="form-footer" style="display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid var(--separator-color);">
                    <button class="app-button secondary modal-cancel-btn">Cancelar</button>
                    <button class="app-button modal-save-btn">Salvar Alterações</button>
                </div>
            </div>
        </div>
    `;

    const winData = window.windowManager.windows.get(winId); if (!winData) return winId;
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId,
        appDataType: 'kanban-board',
        boardData: { columns: [] },
        editingCardId: null,
        editingColumnId: null,
        
        // Elementos da UI
        boardEl: winData.element.querySelector(`#kanbanBoard_${uniqueSuffix}`),
        searchInput: winData.element.querySelector(`#searchInput_${uniqueSuffix}`),
        addColumnBtn: winData.element.querySelector(`#addColumnBtn_${uniqueSuffix}`),
        modal: {
            overlay: winData.element.querySelector(`#cardModal_${uniqueSuffix}`),
            title: winData.element.querySelector(`#cardTitleInput`),
            priority: winData.element.querySelector(`#cardPriorityInput`),
            dueDate: winData.element.querySelector(`#cardDueDateInput`),
            assignee: winData.element.querySelector(`#cardAssigneeInput`),
            description: winData.element.querySelector(`#cardDescriptionInput`),
            tags: winData.element.querySelector(`#cardTagsInput`),
            saveBtn: winData.element.querySelector(`.modal-save-btn`),
            cancelBtn: winData.element.querySelector(`.modal-cancel-btn`),
            closeBtn: winData.element.querySelector('.modal-close'),
        },

        getData: function() { return this.boardData; },
        loadData: function(dataString, fileMeta) { 
            let data;
            try { data = JSON.parse(dataString); } catch (e) { showNotification("Erro ao ler arquivo Kanban.", 3000); this.loadDefaultBoard(); this.renderBoard(); return; } 
            this.boardData = (data && Array.isArray(data.columns)) ? data : { columns: [] }; 
            (this.boardData.columns || []).forEach(col => { col.id = col.id || generateId('col'); (col.cards || []).forEach(card => { card.id = card.id || generateId('card'); }); }); 
            this.fileId = fileMeta.id; 
            this.markClean(); 
            window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
            this.renderBoard(); 
        },
        
        init: function() { 
            setupAppToolbarActions(this);
            this.addColumnBtn.onclick = () => this.addColumn(); 
            this.searchInput.oninput = () => this.filterBoard();
            
            // Eventos do Modal
            this.modal.saveBtn.onclick = () => this.saveCard();
            this.modal.cancelBtn.onclick = () => this.closeModal();
            this.modal.closeBtn.onclick = () => this.closeModal();

            // Eventos do Board (delegação)
            this.boardEl.addEventListener('click', (e) => this.handleBoardClick(e));
            this.boardEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
            this.boardEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
            this.boardEl.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.boardEl.addEventListener('drop', (e) => this.handleDrop(e));
            this.boardEl.addEventListener('dragleave', (e) => this.handleDragLeave(e));

            if(!this.boardData.columns.length) this.loadDefaultBoard(); 
            this.renderBoard(); 
        },

        loadDefaultBoard: function() { this.boardData = { columns: [ { id: generateId('col'), title: 'A Fazer', cards: [] }, { id: generateId('col'), title: 'Em Andamento', cards: [] }, { id: generateId('col'), title: 'Concluído', cards: [] } ] }; },
        
        renderBoard: function(filteredData = null) {
            const dataToRender = filteredData || this.boardData;
            this.boardEl.innerHTML = '';
            dataToRender.columns.forEach(column => {
                const columnEl = document.createElement('div');
                columnEl.className = 'kanban-column';
                columnEl.dataset.columnId = column.id;
                
                const cardsHTML = column.cards.map(card => this.renderCard(card)).join('');

                columnEl.innerHTML = `
                    <div class="column-header">
                        <span class="column-title">${column.title}</span>
                        <div class="column-actions">
                            <button class="action-btn" data-action="delete-column" title="Excluir Coluna"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="cards-container">${cardsHTML}</div>
                    <button class="add-card-btn" data-action="add-card"><i class="fas fa-plus"></i> Adicionar Tarefa</button>
                `;
                this.boardEl.appendChild(columnEl);
            });
        },

        renderCard: function(card) {
            const priorityMap = {
                high: { label: 'Alta', class: 'high-priority' },
                medium: { label: 'Média', class: 'medium-priority' },
                low: { label: 'Baixa', class: 'low-priority' }
            };
            const priorityInfo = priorityMap[card.priority] || priorityMap.medium;
            
            const formatDate = (dateString) => {
                if (!dateString) return 'Sem data';
                return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            };

            const tagsHTML = (card.tags || []).map(tag => `<span class="card-tag">${tag}</span>`).join('');

            return `
                <div class="kanban-card ${priorityInfo.class}" data-card-id="${card.id}" draggable="true">
                    <div class="card-header">
                        <span class="card-title">${card.title}</span>
                    </div>
                    ${card.description ? `<p class="card-description">${card.description}</p>` : ''}
                    <div class="card-meta">
                        <div class="card-due-date"><i class="far fa-calendar"></i> ${formatDate(card.dueDate)}</div>
                        ${card.assignee ? `<div class="card-assignee"><i class="fas fa-user"></i> ${card.assignee}</div>` : ''}
                    </div>
                    ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
                </div>
            `;
        },

        handleBoardClick: function(e) {
            const addCardBtn = e.target.closest('[data-action="add-card"]');
            const deleteColBtn = e.target.closest('[data-action="delete-column"]');
            const cardEl = e.target.closest('.kanban-card');

            if (addCardBtn) {
                const columnId = addCardBtn.closest('.kanban-column').dataset.columnId;
                this.openModal(null, columnId);
            } else if (deleteColBtn) {
                if (confirm("Tem certeza que deseja excluir esta coluna e todos os seus cartões?")) {
                    const columnId = deleteColBtn.closest('.kanban-column').dataset.columnId;
                    this.boardData.columns = this.boardData.columns.filter(c => c.id !== columnId);
                    this.markDirty();
                    this.renderBoard();
                }
            } else if (cardEl) {
                const cardId = cardEl.dataset.cardId;
                this.openModal(cardId);
            }
        },

        openModal: function(cardId = null, columnId = null) {
            this.editingCardId = cardId;
            this.editingColumnId = columnId;
            let card = null;

            if (cardId) {
                for (const col of this.boardData.columns) {
                    const foundCard = col.cards.find(c => c.id === cardId);
                    if (foundCard) {
                        card = foundCard;
                        this.editingColumnId = col.id;
                        break;
                    }
                }
            }
            
            this.modal.overlay.style.display = 'flex';
            this.modal.title.value = card ? card.title : '';
            this.modal.priority.value = card ? card.priority : 'medium';
            this.modal.dueDate.value = card ? card.dueDate : '';
            this.modal.assignee.value = card ? card.assignee : '';
            this.modal.description.value = card ? card.description : '';
            this.modal.tags.value = card ? (card.tags || []).join(', ') : '';
        },

        closeModal: function() { this.modal.overlay.style.display = 'none'; },

        saveCard: function() {
            const cardData = {
                title: this.modal.title.value || 'Nova Tarefa',
                priority: this.modal.priority.value,
                dueDate: this.modal.dueDate.value,
                assignee: this.modal.assignee.value,
                description: this.modal.description.value,
                tags: this.modal.tags.value.split(',').map(t => t.trim()).filter(Boolean)
            };

            if (this.editingCardId) { // Editando card existente
                const column = this.boardData.columns.find(col => col.id === this.editingColumnId);
                const cardIndex = column.cards.findIndex(c => c.id === this.editingCardId);
                if (cardIndex > -1) {
                    column.cards[cardIndex] = { ...column.cards[cardIndex], ...cardData };
                }
            } else { // Novo card
                const column = this.boardData.columns.find(col => col.id === this.editingColumnId);
                if (column) {
                    column.cards.push({ id: generateId('card'), ...cardData });
                }
            }
            this.markDirty();
            this.closeModal();
            this.renderBoard();
        },
        
        addColumn: function() {
            const title = prompt("Nome da nova coluna:", "Nova Coluna");
            if (title) {
                this.boardData.columns.push({ id: generateId('col'), title, cards: [] });
                this.markDirty();
                this.renderBoard();
            }
        },

        filterBoard: function() {
            const query = this.searchInput.value.trim().toLowerCase();
            if (!query) {
                this.renderBoard();
                return;
            }
            const filteredData = JSON.parse(JSON.stringify(this.boardData));
            filteredData.columns.forEach(col => {
                col.cards = col.cards.filter(card => 
                    (card.title?.toLowerCase().includes(query)) ||
                    (card.description?.toLowerCase().includes(query)) ||
                    (card.assignee?.toLowerCase().includes(query)) ||
                    (card.tags?.some(tag => tag.toLowerCase().includes(query)))
                );
            });
            this.renderBoard(filteredData);
        },

        // Drag & Drop Handlers
        draggedCardEl: null,
        sourceColumnId: null,

        handleDragStart: function(e) {
            if (e.target.classList.contains('kanban-card')) {
                this.draggedCardEl = e.target;
                this.sourceColumnId = e.target.closest('.kanban-column').dataset.columnId;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            }
        },
        handleDragEnd: function(e) {
            if (this.draggedCardEl) {
                this.draggedCardEl.classList.remove('dragging');
                this.draggedCardEl = null;
                this.sourceColumnId = null;
            }
        },
        handleDragOver: function(e) {
            e.preventDefault();
            const columnEl = e.target.closest('.kanban-column');
            if (columnEl) {
                columnEl.querySelector('.cards-container').classList.add('drag-over');
            }
        },
        handleDragLeave: function(e) {
            const columnEl = e.target.closest('.kanban-column');
            if (columnEl) {
                columnEl.querySelector('.cards-container').classList.remove('drag-over');
            }
        },
        handleDrop: function(e) {
            e.preventDefault();
            const targetColumnEl = e.target.closest('.kanban-column');
            if (targetColumnEl && this.draggedCardEl) {
                targetColumnEl.querySelector('.cards-container').classList.remove('drag-over');
                const cardId = this.draggedCardEl.dataset.cardId;
                const targetColumnId = targetColumnEl.dataset.columnId;

                // Modificar a estrutura de dados
                const sourceColumn = this.boardData.columns.find(c => c.id === this.sourceColumnId);
                const cardIndex = sourceColumn.cards.findIndex(c => c.id === cardId);
                const [cardToMove] = sourceColumn.cards.splice(cardIndex, 1);
                
                const targetColumn = this.boardData.columns.find(c => c.id === targetColumnId);
                targetColumn.cards.push(cardToMove);
                
                this.markDirty();
                this.renderBoard();
            }
        },

        cleanup: () => {}
    };

    initializeFileState(appState, "Novo Kanban Board", "board.kanban", "kanban-board");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
