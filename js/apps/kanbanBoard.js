import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openKanbanBoard() {
    const uniqueSuffix = generateId('kanban');
    const winId = window.windowManager.createWindow('Quadro Kanban', '', { width: '1200px', height: '750px', appType: 'kanban-board' });
    const content = `
        <style>
            /* Kanban App Specific Styles */
            .kanban-board-app-container { padding: 0 !important; background-color: #f5f7fa; }
            .dark-mode .kanban-board-app-container { background-color: #252936; }
            .kanban-board-app { display: flex; flex-direction: column; height: 100%; }
            .kanban-board { display: flex; padding: 20px; gap: 20px; overflow-x: auto; flex-grow: 1; -webkit-overflow-scrolling: touch; /* Melhora o scroll no iOS */ }
            .kanban-column { background: var(--input-bg); border-radius: 12px; min-width: 320px; max-width: 320px; display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid var(--separator-color); }
            .dark-mode .kanban-column { background: #2c3140; }
            .column-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--separator-color); }
            .column-title { font-weight: 600; font-size: 1.1rem; color: var(--text-color); }
            .column-actions .action-btn { width: 30px; height: 30px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--secondary-text-color); transition: all 0.2s; }
            .column-actions .action-btn:hover { background: var(--hover-highlight-color); color: var(--danger-color); }
            .cards-container { padding: 15px; flex-grow: 1; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; min-height: 100px; }
            .cards-container.drag-over { background: var(--accent-light-translucent); outline: 2px dashed var(--accent-color); }
            .kanban-card { background: var(--window-bg); border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.07); cursor: grab; transition: all 0.2s; border-left: 5px solid var(--secondary-text-color); user-select: none; /* Impede seleção de texto ao arrastar */ }
            .kanban-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .kanban-card.high-priority { border-left-color: #dc3545; }
            .kanban-card.medium-priority { border-left-color: #ffc107; }
            .kanban-card.low-priority { border-left-color: #28a745; }
            .card-header { margin-bottom: 10px; }
            .card-title { font-weight: 600; font-size: 1.05rem; }
            .card-description { color: var(--secondary-text-color); font-size: 0.9rem; line-height: 1.5; margin-bottom: 15px; white-space: pre-wrap; }
            .card-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--secondary-text-color); margin-bottom: 12px; }
            .card-due-date, .card-assignee { display: flex; align-items: center; gap: 6px; }
            .card-tags { display: flex; flex-wrap: wrap; gap: 8px; }
            .card-tag { font-size: 0.75rem; padding: 4px 10px; border-radius: 20px; }
            /* Tag Color Classes */
            .tag-gray { background-color: rgba(108, 117, 125, 0.1); color: #6c757d; } .dark-mode .tag-gray { background-color: rgba(108, 117, 125, 0.2); color: #adb5bd; }
            .tag-blue { background-color: rgba(74, 108, 247, 0.1); color: #4a6cf7; } .dark-mode .tag-blue { background-color: rgba(74, 108, 247, 0.2); color: #8c9eff; }
            .tag-green { background-color: rgba(40, 167, 69, 0.1); color: #28a745; } .dark-mode .tag-green { background-color: rgba(40, 167, 69, 0.2); color: #52c41a; }
            .tag-red { background-color: rgba(220, 53, 69, 0.1); color: #dc3545; } .dark-mode .tag-red { background-color: rgba(220, 53, 69, 0.2); color: #ff4d4f; }
            .tag-yellow { background-color: rgba(255, 193, 7, 0.1); color: #b38700; } .dark-mode .tag-yellow { background-color: rgba(255, 193, 7, 0.2); color: #ffc107; }
            .tag-purple { background-color: rgba(106, 17, 203, 0.1); color: #6a11cb; } .dark-mode .tag-purple { background-color: rgba(106, 17, 203, 0.2); color: #9d4edd; }
            
            .modal-tag .remove-tag { cursor: pointer; margin-left: 6px; font-weight: bold; opacity: 0.7; }
            .modal-tag .remove-tag:hover { opacity: 1; }

            .add-card-btn { margin: 0 10px 10px 10px; padding: 10px; border-radius: 6px; border: 1px dashed var(--input-border-color); background: transparent; color: var(--secondary-text-color); display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
            .add-card-btn:hover { border-color: var(--accent-color); color: var(--accent-color); background: var(--hover-highlight-color); }
            .kanban-card.dragging { opacity: 0.5; transform: rotate(3deg); }
            /* @NOVO: Estilo para o fantasma do card no modo touch */
            .kanban-card.touch-ghost { position: absolute; z-index: 1000; pointer-events: none; opacity: 0.8; transform: rotate(5deg); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
            /* @NOVO: Esconde o card original enquanto está sendo arrastado com o dedo */
            .kanban-card.touch-dragging { opacity: 0.4; }

        </style>

        <div class="app-toolbar kanban-toolbar">
            ${getStandardAppToolbarHTML()}
            <div class="toolbar-group" style="margin-left: auto;">
                <button id="addColumnBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-plus"></i> Nova Coluna</button>
            </div>
            <div class="search-box" style="position: relative;">
                <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--secondary-text-color);"></i>
                <input type="text" id="searchInput_${uniqueSuffix}" class="app-input" placeholder="Buscar tarefas..." style="margin-bottom:0; width: 250px; padding-left: 35px;">
            </div>
        </div>
        <div class="kanban-board" id="kanbanBoard_${uniqueSuffix}"></div>

        <div class="modal-overlay" id="cardModal_${uniqueSuffix}" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 100;">
            <div class="modal-content" style="background: var(--window-bg); border-radius: 12px; width: 100%; max-width: 600px; box-shadow: var(--shadow); display: flex; flex-direction: column;">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid var(--separator-color); display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="modal-title" style="font-size: 1.3rem; font-weight: 600;">Editar Tarefa</h3>
                    <button class="modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--secondary-text-color);">×</button>
                </div>
                <div class="modal-body" style="padding: 25px; overflow-y: auto;">
                    <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group" style="margin-bottom: 20px; grid-column: span 2;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Título</label>
                            <input type="text" class="app-input" id="cardTitleInput">
                        </div>
                        <div class="form-group"><label>Prioridade</label><select class="app-select" id="cardPriorityInput"><option value="low">Baixa</option><option value="medium" selected>Média</option><option value="high">Alta</option></select></div>
                        <div class="form-group"><label>Data de Vencimento</label><input type="date" class="app-input" id="cardDueDateInput"></div>
                        <div class="form-group" style="grid-column: span 2;"><label>Responsável</label><input type="text" class="app-input" id="cardAssigneeInput"></div>
                        <div class="form-group" style="grid-column: span 2;"><label>Descrição</label><textarea class="app-textarea" id="cardDescriptionInput" rows="4"></textarea></div>
                        <!-- UI de Tags Aprimorada -->
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Tags</label>
                            <div id="cardTagsContainer" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; padding: 5px 0;"></div>
                            <div style="display: flex; gap: 10px;">
                                <input type="text" class="app-input" id="newTagTextInput" placeholder="Nova tag..." style="flex-grow: 1; margin: 0;">
                                <select class="app-select" id="newTagColorInput" style="flex-shrink: 0; width: 100px; margin: 0;">
                                    <option value="gray">Cinza</option><option value="blue">Azul</option><option value="green">Verde</option><option value="red">Vermelho</option><option value="yellow">Amarelo</option><option value="purple">Roxo</option>
                                </select>
                                <button class="app-button secondary" id="addTagBtn" type="button" style="padding: 8px 12px;">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-footer" style="display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid var(--separator-color); margin-top: auto;">
                    <button class="app-button secondary modal-cancel-btn">Cancelar</button>
                    <button class="app-button modal-save-btn">Salvar Alterações</button>
                </div>
            </div>
        </div>
    `;

    const winData = window.windowManager.windows.get(winId); if (!winData) return winId;
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId, appDataType: 'kanban-board', boardData: { columns: [] }, editingCardId: null, editingColumnId: null,
        
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
            tagsContainer: winData.element.querySelector('#cardTagsContainer'),
            newTagText: winData.element.querySelector('#newTagTextInput'),
            newTagColor: winData.element.querySelector('#newTagColorInput'),
            addTagBtn: winData.element.querySelector('#addTagBtn'),
            saveBtn: winData.element.querySelector(`.modal-save-btn`),
            cancelBtn: winData.element.querySelector(`.modal-cancel-btn`),
            closeBtn: winData.element.querySelector('.modal-close'),
        },

        getData: function() { return this.boardData; },
        loadData: function(dataString, fileMeta) { 
            let data;
            try { data = JSON.parse(dataString); } catch (e) { showNotification("Erro ao ler arquivo Kanban.", 3000); this.loadDefaultBoard(); this.renderBoard(); return; } 
            this.boardData = (data && Array.isArray(data.columns)) ? data : { columns: [] }; 
            (this.boardData.columns || []).forEach(col => { 
                col.id = col.id || generateId('col'); 
                (col.cards || []).forEach(card => { 
                    card.id = card.id || generateId('card');
                    card.tags = (card.tags || []).map(tag => typeof tag === 'string' ? {text: tag, color: 'gray'} : tag);
                }); 
            }); 
            this.fileId = fileMeta.id; 
            this.markClean(); 
            window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
            this.renderBoard(); 
        },
        
        init: function() { 
            setupAppToolbarActions(this);
            this.addColumnBtn.onclick = () => this.addColumn(); 
            this.searchInput.oninput = () => this.filterBoard();
            
            this.modal.saveBtn.onclick = () => this.saveCard();
            this.modal.cancelBtn.onclick = () => this.closeModal();
            this.modal.closeBtn.onclick = () => this.closeModal();
            this.modal.addTagBtn.onclick = () => this.addTagToModal();
            this.modal.tagsContainer.addEventListener('click', (e) => {
                if(e.target.classList.contains('remove-tag')) {
                    e.target.parentElement.remove();
                }
            });

            // Eventos de Mouse (Drag and Drop)
            this.boardEl.addEventListener('click', (e) => this.handleBoardClick(e));
            this.boardEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
            this.boardEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
            this.boardEl.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.boardEl.addEventListener('drop', (e) => this.handleDrop(e));
            this.boardEl.addEventListener('dragleave', (e) => this.handleDragLeave(e));

            // @MODIFICADO: Adiciona eventos de Toque
            this.boardEl.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.boardEl.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            this.boardEl.addEventListener('touchend', (e) => this.handleTouchEnd(e));


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
                    <div class="column-header"><span class="column-title">${column.title}</span><div class="column-actions"><button class="action-btn" data-action="delete-column" title="Excluir Coluna"><i class="fas fa-trash"></i></button></div></div>
                    <div class="cards-container">${cardsHTML}</div>
                    <button class="add-card-btn" data-action="add-card"><i class="fas fa-plus"></i> Adicionar Tarefa</button>
                `;
                this.boardEl.appendChild(columnEl);
            });
        },

        renderCard: function(card) {
            const priorityInfo = { high: 'high-priority', medium: 'medium-priority', low: 'low-priority' }[card.priority] || 'medium-priority';
            const formatDate = (dateString) => dateString ? new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem data';
            const tagsHTML = (card.tags || []).map(tag => `<span class="card-tag tag-${tag.color || 'gray'}">${tag.text}</span>`).join('');

            // @MODIFICADO: Remove o atributo draggable para evitar conflito com touch
            return `
                <div class="kanban-card ${priorityInfo}" data-card-id="${card.id}">
                    <div class="card-header"><span class="card-title">${card.title}</span></div>
                    ${card.description ? `<p class="card-description">${card.description}</p>` : ''}
                    <div class="card-meta">
                        <div class="card-due-date"><i class="far fa-calendar-alt"></i> ${formatDate(card.dueDate)}</div>
                        ${card.assignee ? `<div class="card-assignee"><i class="fas fa-user-circle"></i> ${card.assignee}</div>` : ''}
                    </div>
                    ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
                </div>`;
        },

        handleBoardClick: function(e) {
            // @MODIFICADO: Evita abrir modal se estivermos arrastando com o toque
            if (this.isTouchDragging) return;

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
                    if (foundCard) { card = foundCard; this.editingColumnId = col.id; break; }
                }
            }
            
            this.modal.overlay.style.display = 'flex';
            this.modal.title.value = card ? card.title : '';
            this.modal.priority.value = card ? card.priority : 'medium';
            this.modal.dueDate.value = card ? card.dueDate : '';
            this.modal.assignee.value = card ? card.assignee : '';
            this.modal.description.value = card ? card.description : '';
            this.renderModalTags(card ? card.tags : []);
        },

        renderModalTags: function(tags) {
            this.modal.tagsContainer.innerHTML = '';
            (tags || []).forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = `card-tag modal-tag tag-${tag.color || 'gray'}`;
                tagEl.dataset.color = tag.color || 'gray';
                tagEl.textContent = tag.text;
                tagEl.innerHTML += ' <span class="remove-tag">×</span>';
                this.modal.tagsContainer.appendChild(tagEl);
            });
        },

        addTagToModal: function() {
            const text = this.modal.newTagText.value.trim();
            const color = this.modal.newTagColor.value;
            if (!text) return;
        
            const currentTags = Array.from(this.modal.tagsContainer.children).map(el => ({ text: el.textContent.slice(0, -2).trim(), color: el.dataset.color }));
            currentTags.push({ text, color });
            this.renderModalTags(currentTags);
            this.modal.newTagText.value = '';
            this.modal.newTagText.focus();
        },

        closeModal: function() { this.modal.overlay.style.display = 'none'; },

        saveCard: function() {
            const tags = Array.from(this.modal.tagsContainer.children).map(el => ({ text: el.textContent.slice(0, -2).trim(), color: el.dataset.color }));
            const cardData = {
                title: this.modal.title.value || 'Nova Tarefa', priority: this.modal.priority.value,
                dueDate: this.modal.dueDate.value, assignee: this.modal.assignee.value,
                description: this.modal.description.value, tags: tags
            };
            if (this.editingCardId) {
                const column = this.boardData.columns.find(col => col.id === this.editingColumnId);
                const cardIndex = column.cards.findIndex(c => c.id === this.editingCardId);
                if (cardIndex > -1) { column.cards[cardIndex] = { ...column.cards[cardIndex], ...cardData }; }
            } else {
                const column = this.boardData.columns.find(col => col.id === this.editingColumnId);
                if (column) { column.cards.push({ id: generateId('card'), ...cardData }); }
            }
            this.markDirty(); this.closeModal(); this.renderBoard();
        },
        
        addColumn: function() { const title = prompt("Nome da nova coluna:", "Nova Coluna"); if (title) { this.boardData.columns.push({ id: generateId('col'), title, cards: [] }); this.markDirty(); this.renderBoard(); } },

        filterBoard: function() {
            const query = this.searchInput.value.trim().toLowerCase();
            if (!query) { this.renderBoard(); return; }
            const filteredData = JSON.parse(JSON.stringify(this.boardData));
            filteredData.columns.forEach(col => {
                col.cards = col.cards.filter(card => 
                    (card.title?.toLowerCase().includes(query)) ||
                    (card.description?.toLowerCase().includes(query)) ||
                    (card.assignee?.toLowerCase().includes(query)) ||
                    (card.tags?.some(tag => tag.text.toLowerCase().includes(query)))
                );
            });
            this.renderBoard(filteredData);
        },
        
        // --- Lógica de Drag and Drop para Mouse ---
        draggedCardEl: null, sourceColumnId: null,
        handleDragStart: function(e) { if (e.target.classList.contains('kanban-card')) { this.draggedCardEl = e.target; e.target.setAttribute('draggable', true); this.sourceColumnId = e.target.closest('.kanban-column').dataset.columnId; setTimeout(() => e.target.classList.add('dragging'), 0); } },
        handleDragEnd: function(e) { if (this.draggedCardEl) { this.draggedCardEl.classList.remove('dragging'); this.draggedCardEl.setAttribute('draggable', false); this.draggedCardEl = null; this.sourceColumnId = null; } },
        handleDragOver: function(e) { e.preventDefault(); const columnEl = e.target.closest('.cards-container'); if (columnEl) { columnEl.classList.add('drag-over'); } },
        handleDragLeave: function(e) { const columnEl = e.target.closest('.cards-container'); if (columnEl) { columnEl.classList.remove('drag-over'); } },
        handleDrop: function(e) {
            e.preventDefault();
            const targetColumnEl = e.target.closest('.kanban-column');
            if (targetColumnEl && this.draggedCardEl) {
                targetColumnEl.querySelector('.cards-container').classList.remove('drag-over');
                const cardId = this.draggedCardEl.dataset.cardId;
                const targetColumnId = targetColumnEl.dataset.columnId;
                const sourceColumn = this.boardData.columns.find(c => c.id === this.sourceColumnId);
                const cardIndex = sourceColumn.cards.findIndex(c => c.id === cardId);
                const [cardToMove] = sourceColumn.cards.splice(cardIndex, 1);
                const targetColumn = this.boardData.columns.find(c => c.id === targetColumnId);
                targetColumn.cards.push(cardToMove);
                this.markDirty(); this.renderBoard();
            }
        },

        // --- @NOVO: Lógica de Drag and Drop para Toque ---
        touchGhostEl: null, touchStartEl: null, touchStartX: 0, touchStartY: 0,
        isTouchDragging: false, longPressTimer: null,

        handleTouchStart: function(e) {
            const cardEl = e.target.closest('.kanban-card');
            if (!cardEl) return;
            
            // Inicia um timer para o "long press"
            this.longPressTimer = setTimeout(() => {
                this.isTouchDragging = true; // Inicia o arrastar
                
                // Prepara o card original e o fantasma
                this.touchStartEl = cardEl;
                this.sourceColumnId = cardEl.closest('.kanban-column').dataset.columnId;
                cardEl.classList.add('touch-dragging');

                this.touchGhostEl = cardEl.cloneNode(true);
                this.touchGhostEl.classList.add('touch-ghost');
                document.body.appendChild(this.touchGhostEl);

                // Posiciona o fantasma
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                this.touchGhostEl.style.width = `${cardEl.offsetWidth}px`;
                this.moveGhost(touch.clientX, touch.clientY);
                
                e.preventDefault(); // Impede o scroll da página enquanto arrasta
            }, 200); // Atraso de 200ms para diferenciar clique de arrastar
        },

        handleTouchMove: function(e) {
            if (!this.isTouchDragging || !this.touchGhostEl) return;
            e.preventDefault(); // Impede o scroll
            
            const touch = e.touches[0];
            this.moveGhost(touch.clientX, touch.clientY);

            // Adiciona feedback visual à coluna sob o dedo
            this.touchGhostEl.style.display = 'none'; // Esconde fantasma para detectar elemento abaixo
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            this.touchGhostEl.style.display = '';
            
            this.boardEl.querySelectorAll('.cards-container.drag-over').forEach(el => el.classList.remove('drag-over'));
            const columnContainer = elementBelow ? elementBelow.closest('.cards-container') : null;
            if (columnContainer) {
                columnContainer.classList.add('drag-over');
            }
        },

        handleTouchEnd: function(e) {
            clearTimeout(this.longPressTimer); // Cancela o timer se o dedo for solto antes

            if (!this.isTouchDragging || !this.touchGhostEl) {
                this.isTouchDragging = false;
                return;
            }

            // Pega a posição final do toque
            const touch = e.changedTouches[0];
            this.touchGhostEl.style.display = 'none';
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            this.touchGhostEl.style.display = '';
            
            const targetColumnEl = elementBelow ? elementBelow.closest('.kanban-column') : null;

            if (targetColumnEl) {
                const cardId = this.touchStartEl.dataset.cardId;
                const targetColumnId = targetColumnEl.dataset.columnId;

                // Move os dados
                if (this.sourceColumnId !== targetColumnId) {
                    const sourceColumn = this.boardData.columns.find(c => c.id === this.sourceColumnId);
                    const cardIndex = sourceColumn.cards.findIndex(c => c.id === cardId);
                    if(cardIndex > -1) {
                        const [cardToMove] = sourceColumn.cards.splice(cardIndex, 1);
                        const targetColumn = this.boardData.columns.find(c => c.id === targetColumnId);
                        targetColumn.cards.push(cardToMove);
                        this.markDirty();
                        this.renderBoard();
                    }
                }
            }

            // Limpeza
            this.touchStartEl.classList.remove('touch-dragging');
            document.body.removeChild(this.touchGhostEl);
            this.boardEl.querySelectorAll('.cards-container.drag-over').forEach(el => el.classList.remove('drag-over'));
            
            this.touchGhostEl = null;
            this.touchStartEl = null;
            this.sourceColumnId = null;
            
            // Pequeno delay para evitar que o clique seja disparado logo após soltar
            setTimeout(() => { this.isTouchDragging = false; }, 100);
        },

        moveGhost: function(x, y) {
            if (!this.touchGhostEl) return;
            this.touchGhostEl.style.left = `${x - this.touchGhostEl.offsetWidth / 2}px`;
            this.touchGhostEl.style.top = `${y - this.touchGhostEl.offsetHeight / 2}px`;
        },

        cleanup: () => {
             // @NOVO: Garante que o fantasma seja removido se a janela for fechada
             if(appState.touchGhostEl && appState.touchGhostEl.parentElement) {
                appState.touchGhostEl.parentElement.removeChild(appState.touchGhostEl);
             }
        }
    };

    initializeFileState(appState, "Novo Kanban Board", "board.kanban", "kanban-board");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
