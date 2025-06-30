import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openGanttChart() {
    const uniqueSuffix = generateId('gantt');
    const winId = window.windowManager.createWindow('Roadmap do Projeto (Gantt 2.0)', '', { width: '90vw', height: '85vh', appType: 'gantt-chart' });

    const content = `
        <style>
            :root {
                --gantt-header-height: 64px;
                --gantt-row-height: 40px;
                --gantt-parent-bar-color: #5D6D7E;
                --gantt-milestone-color: #A569BD;
                --gantt-selected-row-bg: rgba(var(--accent-color-rgb), 0.1);
            }
            .gantt-chart-app-container { padding: 0 !important; background-color: var(--background); font-family: 'Inter', sans-serif; display: flex; flex-direction: column; height: 100%; }
            .gantt-v2-container { display: flex; flex-grow: 1; width: 100%; overflow: hidden; }
            
            /* --- Barra de Ferramentas --- */
            .app-toolbar { flex-shrink: 0; }
            .app-toolbar .app-button i { margin-right: 6px; }
            .toolbar-separator { border-left: 1px solid var(--separator-color); margin: 0 8px; height: 20px; }

            /* --- Painel da Tabela (Sidebar) --- */
            .gantt-sidebar { width: 45%; min-width: 450px; max-width: 70%; background-color: var(--window-bg); display: flex; flex-direction: column; border-right: 1px solid var(--separator-color); }
            .gantt-sidebar-header, .gantt-task-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 80px 80px 140px 110px 110px;
                gap: 10px;
                align-items: center;
                padding: 0 10px;
                box-sizing: border-box; flex-shrink: 0;
            }
            .gantt-sidebar-header { padding: 10px; font-size: 0.75em; font-weight: 600; color: var(--secondary-text-color); border-bottom: 1px solid var(--separator-color); text-transform: uppercase; }
            .gantt-sidebar-body { flex-grow: 1; overflow-y: auto; overflow-x: hidden; position: relative; }
            .gantt-task-row { min-height: var(--gantt-row-height); border-bottom: 1px solid var(--separator-color); cursor: pointer; user-select: none; }
            .gantt-task-row.selected { background-color: var(--gantt-selected-row-bg); }
            .gantt-task-row:hover { background-color: var(--hover-highlight-color); }
            .task-cell { padding: 5px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; height: 100%; }
            .task-cell input, .task-cell select { width: 100%; background: transparent; border: none; color: var(--text-color); padding: 5px; border-radius: 4px; box-sizing: border-box; font-size: 0.9em; height: 30px; }
            .task-cell input:focus, .task-cell select:focus { background: var(--input-bg); outline: 1px solid var(--accent-color); }
            .task-cell input[type="date"] { padding-right: 0; }
            .task-cell span.read-only-field { padding: 5px; color: var(--secondary-text-color); font-size: 0.9em; }
            .task-name-cell { gap: 5px; }
            .task-expander { width: 20px; text-align: center; cursor: pointer; color: var(--secondary-text-color); transition: transform 0.2s; flex-shrink: 0; }
            .task-expander.collapsed { transform: rotate(-90deg); }
            .task-icon { margin: 0 4px; flex-shrink: 0; }
            .avatar { width: 24px; height: 24px; border-radius: 50%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 600; margin-right: 8px; flex-shrink: 0; }
            
            /* --- Divisor Redimensionável --- */
            .gantt-splitter { width: 5px; background: var(--separator-color); cursor: col-resize; transition: background-color 0.2s; flex-shrink: 0; }
            .gantt-splitter:hover, .gantt-splitter.dragging { background: var(--accent-color); }

            /* --- Área do Gráfico --- */
            .gantt-chart-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
            .gantt-chart-header-container { flex-shrink: 0; z-index: 4; background-color: var(--toolbar-bg); }
            .gantt-timeline-header { white-space: nowrap; border-bottom: 1px solid var(--separator-color); display: flex; flex-direction: column; }
            .gantt-timeline-months, .gantt-timeline-days { display: flex; }
            .gantt-timeline-month, .gantt-timeline-day { text-align: center; color: var(--secondary-text-color); font-size: 0.8em; border-right: 1px solid var(--separator-color); box-sizing: border-box; flex-shrink: 0; }
            .gantt-timeline-month { font-weight: 600; padding: 5px 0; border-top: 1px solid var(--separator-color); }
            .gantt-timeline-day { padding: 8px 0; }

            .gantt-chart-viewport { flex-grow: 1; overflow: auto; position: relative; }
            .gantt-chart-content { position: relative; }
            .gantt-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
            .gantt-grid-line, .gantt-row-line, .gantt-grid-weekend { position: absolute; }
            .gantt-today-marker { position: absolute; top: 0; width: 2px; height: 100%; background-color: var(--danger-color); z-index: 2; opacity: 0.9; }
            .gantt-grid-line { top: 0; width: 1px; height: 100%; background-color: var(--separator-color); opacity: 0.5; }
            .gantt-row-line { left: 0; height: 1px; width: 100%; background-color: var(--separator-color); }
            .gantt-grid-weekend { top: 0; height: 100%; background-color: var(--separator-color); opacity: 0.1; }

            .gantt-bar-container { position: absolute; height: var(--gantt-row-height); display: flex; align-items: center; }
            .gantt-bar { position: relative; height: 28px; background-color: var(--accent-color); border-radius: 6px; display: flex; align-items: center; color: white; font-size: 0.85em; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: move; transition: filter 0.2s, background-color 0.2s; }
            .gantt-bar:hover { filter: brightness(1.1); }
            .gantt-bar-progress { position: absolute; top: 0; left: 0; height: 100%; background: rgba(0,0,0,0.25); border-radius: 6px; pointer-events: none; }
            .gantt-bar-handle { position: absolute; top: 0; width: 8px; height: 100%; z-index: 2; }
            .gantt-bar-handle.left { left: 0; cursor: ew-resize; }
            .gantt-bar-handle.right { right: 0; cursor: ew-resize; }
            .gantt-bar-parent { background-color: var(--gantt-parent-bar-color); border-radius: 2px; height: 12px; }
            .gantt-bar-parent .gantt-bar-progress { background-color: rgba(255,255,255,0.4); }
            .gantt-milestone { position: absolute; width: 24px; height: 24px; background: var(--gantt-milestone-color); transform: rotate(45deg); top: 8px; border-radius: 3px; cursor: move; transition: transform 0.2s, background-color 0.2s; }
            .gantt-milestone:hover { transform: rotate(45deg) scale(1.1); }
            
            /* --- Drag-to-connect Handles --- */
            .gantt-dependency-handle { position: absolute; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #fff; border: 2px solid var(--accent-color); border-radius: 50%; z-index: 3; cursor: crosshair; opacity: 0; transition: opacity 0.2s; }
            .gantt-bar:hover .gantt-dependency-handle { opacity: 1; }
            .gantt-dependency-handle.end { right: -6px; }

            #ganttSvgOverlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            #ganttConnectionLine { stroke: var(--accent-color); stroke-width: 2; stroke-dasharray: 5,5; fill: none; }
            .gantt-dependency-path { stroke: var(--secondary-text-color); stroke-width: 1.5; fill: none; opacity: 0.8; marker-end: url(#arrowhead); }
            .gantt-dependency-path.critical { stroke: var(--danger-color) !important; stroke-width: 2.5 !important; opacity: 1 !important; }
            .gantt-bar.critical { border: 2px solid var(--danger-color); }
            .gantt-milestone.critical { border: 2px solid var(--danger-color); transform: rotate(45deg) scale(1.1); }


            /* --- Tooltip & Context Menu --- */
            .gantt-tooltip, .gantt-context-menu { position: fixed; background: var(--context-menu-bg); color: var(--text-color); border: 1px solid var(--separator-color); border-radius: 8px; padding: 8px; z-index: 10000; font-size: 0.9em; box-shadow: 0 5px 15px rgba(0,0,0,0.2); transition: opacity 0.2s; opacity: 0; pointer-events: none; }
            .gantt-tooltip.visible, .gantt-context-menu.visible { opacity: 1; pointer-events: auto; }
            .gantt-tooltip-title { font-weight: 600; margin-bottom: 8px; }
            .gantt-tooltip-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .gantt-tooltip-label { color: var(--secondary-text-color); margin-right: 15px; }
            .gantt-context-menu-item { padding: 8px 12px; cursor: pointer; border-radius: 4px; display:flex; align-items:center; gap: 8px; }
            .gantt-context-menu-item:hover { background-color: var(--hover-highlight-color); }
            .gantt-context-menu-item.danger:hover { background-color: rgba(var(--danger-color-rgb), 0.8); color: white; }
            .gantt-context-menu-separator { height: 1px; background: var(--separator-color); margin: 4px 0; }
            .gantt-color-palette { display: flex; padding: 5px; }
            .gantt-color-swatch { width: 20px; height: 20px; border-radius: 50%; margin: 0 4px; cursor: pointer; border: 2px solid transparent; }
            .gantt-color-swatch:hover { border-color: var(--text-color); }

            /* --- Estado Vazio --- */
            .gantt-empty-state { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: var(--secondary-text-color); }
            .gantt-empty-state i { font-size: 48px; margin-bottom: 16px; }
        </style>

        <div class="app-toolbar">
            ${getStandardAppToolbarHTML()}
            <button id="undoBtn_${uniqueSuffix}" class="app-button secondary" title="Desfazer (Ctrl+Z)" disabled><i class="fas fa-undo"></i></button>
            <button id="redoBtn_${uniqueSuffix}" class="app-button secondary" title="Refazer (Ctrl+Y)" disabled><i class="fas fa-redo"></i></button>
            <div class="toolbar-separator"></div>
            <button id="addTaskBtn_${uniqueSuffix}" class="app-button" style="margin-left: auto;"><i class="fas fa-plus-circle"></i> Tarefa</button>
            <button id="addMilestoneBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-gem"></i> Marco</button>
            <div class="toolbar-separator"></div>
            <button id="zoomOutBtn_${uniqueSuffix}" class="app-button secondary" title="Reduzir Zoom"><i class="fas fa-search-minus"></i></button>
            <button id="zoomInBtn_${uniqueSuffix}" class="app-button secondary" title="Aumentar Zoom"><i class="fas fa-search-plus"></i></button>
            <button id="todayBtn_${uniqueSuffix}" class="app-button secondary" title="Ir para Hoje"><i class="fas fa-calendar-day"></i></button>
            <button id="criticalPathBtn_${uniqueSuffix}" class="app-button secondary" title="Mostrar Caminho Crítico"><i class="fas fa-project-diagram"></i></button>
        </div>
        <div class="gantt-v2-container">
            <div class="gantt-sidebar" id="ganttSidebar_${uniqueSuffix}">
                <div class="gantt-sidebar-header">
                    <span>Tarefa</span>
                    <span>Duração</span>
                    <span>Prog. %</span>
                    <span>Responsável</span>
                    <span>Início</span>
                    <span>Fim</span>
                </div>
                <div class="gantt-sidebar-body" id="ganttSidebarBody_${uniqueSuffix}"></div>
            </div>
            <div class="gantt-splitter" id="ganttSplitter_${uniqueSuffix}"></div>
            <div class="gantt-chart-area">
                <div class="gantt-chart-header-container" id="ganttHeaderContainer_${uniqueSuffix}"></div>
                <div class="gantt-chart-viewport" id="ganttChartViewport_${uniqueSuffix}">
                    <div class="gantt-chart-content" id="ganttChartContent_${uniqueSuffix}">
                         <svg id="ganttSvgOverlay" width="100%" height="100%">
                           <defs><marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" opacity="0.8" fill="var(--secondary-text-color)"/></marker></defs>
                           <path id="ganttConnectionLine" d=""></path>
                        </svg>
                        <div class="gantt-grid" id="ganttGrid_${uniqueSuffix}"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="gantt-tooltip" id="ganttTooltip_${uniqueSuffix}"></div>
        <div class="gantt-context-menu" id="ganttContextMenu_${uniqueSuffix}"></div>
    `;
    const winData = window.windowManager.windows.get(winId);
    if (!winData) return winId;
    const winEl = winData.element;
    winEl.querySelector('.window-content').innerHTML = content;
    const winBody = winEl.querySelector('.window-body');

    const appState = {
        // --- PROPRIEDADES DO APP ---
        winId, appDataType: 'gantt-chart',
        tasks: [],
        
        // --- ESTADO DA UI ---
        ui: {
            sidebarBody: winEl.querySelector(`#ganttSidebarBody_${uniqueSuffix}`),
            headerContainer: winEl.querySelector(`#ganttHeaderContainer_${uniqueSuffix}`),
            chartViewport: winEl.querySelector(`#ganttChartViewport_${uniqueSuffix}`),
            chartContent: winEl.querySelector(`#ganttChartContent_${uniqueSuffix}`),
            gridEl: winEl.querySelector(`#ganttGrid_${uniqueSuffix}`),
            svgOverlay: winEl.querySelector(`#ganttSvgOverlay`),
            tooltipEl: winEl.querySelector(`#ganttTooltip_${uniqueSuffix}`),
            contextMenuEl: winEl.querySelector(`#ganttContextMenu_${uniqueSuffix}`),
            splitter: winEl.querySelector(`#ganttSplitter_${uniqueSuffix}`),
            connectionLine: winEl.querySelector(`#ganttConnectionLine`),
            undoBtn: winEl.querySelector(`#undoBtn_${uniqueSuffix}`),
            redoBtn: winEl.querySelector(`#redoBtn_${uniqueSuffix}`),
            criticalPathBtn: winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`),
        },
        
        state: {
            timeline: { startDate: null, endDate: null, unitWidth: 40, totalWidth: 0 },
            flatTaskOrder: [],
            selectedTaskId: null,
            showCriticalPath: false,
            isConnecting: false,
            connectionStartTask: null,
            undoStack: [],
            redoStack: [],
        },

        // --- LIFECYCLE E DADOS ---
        init: function() {
            setupAppToolbarActions(this);
            this.setupToolbarActions();
            this.setupEventListeners();
            this.renderAll();
        },
        getData: function() { return JSON.parse(JSON.stringify(this.tasks)); },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString); 
                this.tasks = Array.isArray(data) ? data : [];
                this.tasks.forEach(t => { 
                    if (!t.hasOwnProperty('color')) t.color = null;
                    if (!t.hasOwnProperty('collapsed')) t.collapsed = false;
                });
                this.fileId = fileMeta.id; 
                this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.state.undoStack = [];
                this.state.redoStack = [];
                this.updateUndoRedoButtons();
                this.renderAll(); 
            } catch (e) { 
                showNotification("Erro ao ler arquivo Gantt.", 3000, 'error'); 
                console.error("Gantt Load Error:", e);
            } 
        },
        
        // --- MANIPULADORES DE ESTADO (UNDO/REDO) ---
        pushState: function(description = 'action') {
            this.state.undoStack.push(JSON.stringify(this.tasks));
            this.state.redoStack = []; 
            if (this.state.undoStack.length > 50) this.state.undoStack.shift(); 
            this.updateUndoRedoButtons();
            this.markDirty();
        },
        undo: function() {
            if (this.state.undoStack.length > 0) {
                this.state.redoStack.push(JSON.stringify(this.tasks));
                this.tasks = JSON.parse(this.state.undoStack.pop());
                this.updateUndoRedoButtons();
                this.renderAll();
                this.markDirty();
            }
        },
        redo: function() {
            if (this.state.redoStack.length > 0) {
                this.state.undoStack.push(JSON.stringify(this.tasks));
                this.tasks = JSON.parse(this.state.redoStack.pop());
                this.updateUndoRedoButtons();
                this.renderAll();
                this.markDirty();
            }
        },
        updateUndoRedoButtons: function() {
            this.ui.undoBtn.disabled = this.state.undoStack.length === 0;
            this.ui.redoBtn.disabled = this.state.redoStack.length === 0;
        },

        // --- LÓGICA DE RENDERIZAÇÃO ---
        renderAll: function() {
            this.updateAllParentTasks();
            this.calculateTimeline();
            this.state.flatTaskOrder = this.getFlatTaskOrder();
            this.renderSidebar();
            this.renderChart();
            this.renderDependencies();
            this.updateCriticalPath();
            this.renderEmptyState();
        },
        renderEmptyState: function() {
            const container = this.ui.chartViewport.parentElement;
            let emptyStateEl = container.querySelector('.gantt-empty-state');
            if (this.tasks.length === 0) {
                if(!emptyStateEl) {
                    emptyStateEl = document.createElement('div');
                    emptyStateEl.className = 'gantt-empty-state';
                    container.appendChild(emptyStateEl);
                }
                emptyStateEl.innerHTML = `<i class="fas fa-tasks"></i>
                    <p>Nenhuma tarefa ainda.</p>
                    <p>Clique em "+ Tarefa" para começar.</p>`;
                emptyStateEl.style.display = 'block';
            } else if (emptyStateEl) {
                emptyStateEl.style.display = 'none';
            }
        },

        // --- CÁLCULOS (DATAS, TIMELINE, CAMINHO CRÍTICO) ---
        dateUtils: {
            parse: (dateStr) => new Date(dateStr + 'T00:00:00Z'),
            format: (dateObj) => dateObj.toISOString().split('T')[0],
            addDays: (dateObj, days) => {
                const result = new Date(dateObj);
                result.setUTCDate(result.getUTCDate() + days);
                return result;
            },
            daysBetween: (d1, d2) => {
                const date1 = appState.dateUtils.parse(d1);
                const date2 = appState.dateUtils.parse(d2);
                return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
            },
        },
        calculateTimeline: function() {
            if (this.tasks.length === 0) {
                const today = new Date();
                this.state.timeline.startDate = this.dateUtils.addDays(today, -7);
                this.state.timeline.endDate = this.dateUtils.addDays(today, 30);
                return;
            }
            let minDate = null, maxDate = null;
            this.tasks.forEach(t => {
                if (t.type === 'parent' && this.tasks.some(c => c.parentId === t.id)) return;
                const start = this.dateUtils.parse(t.start);
                const end = t.end ? this.dateUtils.parse(t.end) : this.dateUtils.parse(t.start);
                if (!minDate || start < minDate) minDate = start;
                if (!maxDate || end > maxDate) maxDate = end;
            });
            this.state.timeline.startDate = this.dateUtils.addDays(minDate, -7);
            this.state.timeline.endDate = this.dateUtils.addDays(maxDate, 14);
        },
        updateAllParentTasks: function() {
            const taskMap = new Map(this.tasks.map(t => [t.id, t]));
            const childrenMap = new Map(this.tasks.map(t => [t.id, []]));
            const roots = [];

            this.tasks.forEach(task => {
                if (task.parentId && taskMap.has(task.parentId)) {
                    childrenMap.get(task.parentId).push(task);
                } else {
                    roots.push(task);
                }
            });

            const processNode = (task) => {
                const children = childrenMap.get(task.id);
                if (task.type !== 'parent' || !children || children.length === 0) {
                    if(task.type === 'parent') { // Parent task with no children
                       task.progress = 0;
                    }
                    return;
                }
                
                children.forEach(processNode); 

                const childTasks = children.filter(c => c.start && c.end);
                if (childTasks.length > 0) {
                    const startDates = childTasks.map(c => this.dateUtils.parse(c.start));
                    const endDates = childTasks.map(c => this.dateUtils.parse(c.end));
                    
                    task.start = this.dateUtils.format(new Date(Math.min(...startDates)));
                    task.end = this.dateUtils.format(new Date(Math.max(...endDates)));
                    
                    const totalProgress = childTasks.reduce((sum, c) => sum + (Number(c.progress) || 0), 0);
                    task.progress = Math.round(totalProgress / childTasks.length);
                }
            };
            this.tasks.filter(t => t.type === 'parent').forEach(processNode);
        },

        // --- RENDERIZAÇÃO DA SIDEBAR E GRÁFICO ---
        renderSidebar: function() {
            this.ui.sidebarBody.innerHTML = '';
            if (this.tasks.length === 0) return;
            
            const renderTaskNode = (task, level) => {
                const row = document.createElement('div');
                row.className = 'gantt-task-row';
                if(this.state.selectedTaskId === task.id) row.classList.add('selected');
                row.dataset.taskId = task.id;
                
                const children = this.tasks.filter(t => t.parentId === task.id);
                const isParent = task.type === 'parent' || children.length > 0;
                if (isParent && task.type !== 'parent') task.type = 'parent';

                const expanderHTML = isParent ? `<span class="task-expander ${task.collapsed ? 'collapsed' : ''}"><i class="fas fa-angle-down"></i></span>` : '<span class="task-expander"></span>';
                const icon = task.type === 'milestone' ? 'fa-gem' : isParent ? 'fa-folder' : 'fa-tasks';
                const barColor = task.color || (isParent ? 'var(--gantt-parent-bar-color)' : task.type === 'milestone' ? 'var(--gantt-milestone-color)' : 'var(--accent-color)');
                const duration = isParent ? (this.dateUtils.daysBetween(task.start, task.end) + 1) + 'd' : (task.type === 'milestone' ? '0d' : (this.dateUtils.daysBetween(task.start, task.end) + 1) + 'd');
                const progress = task.progress || 0;

                row.innerHTML = `
                    <div class="task-cell task-name-cell" style="padding-left: ${level * 25 + 5}px;">
                        ${expanderHTML}
                        <i class="fas ${icon} task-icon" style="color: ${barColor};"></i>
                        <input type="text" value="${task.name}" data-field="name" title="${task.name}">
                    </div>
                    <div class="task-cell"><span class="read-only-field">${duration}</span></div>
                    <div class="task-cell">${isParent ? `<span class="read-only-field">${progress}%</span>` : `<input type="number" min="0" max="100" value="${progress}" data-field="progress">`}</div>
                    <div class="task-cell" title="${task.assignee || ''}">${this.generateAvatar(task.assignee)}<input type="text" value="${task.assignee || ''}" data-field="assignee" placeholder="-"></div>
                    <div class="task-cell">${isParent ? `<span class="read-only-field">${new Date(task.start+'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>` : `<input type="date" value="${task.start}" data-field="start">`}</div>
                    <div class="task-cell">${isParent || task.type === 'milestone' ? `<span class="read-only-field">${new Date(task.end+'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>` : `<input type="date" value="${task.end}" data-field="end">`}</div>
                `;
                this.ui.sidebarBody.appendChild(row);

                if (isParent && !task.collapsed) {
                    children.sort((a,b) => this.dateUtils.parse(a.start) - this.dateUtils.parse(b.start)).forEach(child => renderTaskNode(child, level + 1));
                }
            };
            this.tasks.filter(t => !t.parentId).sort((a,b) => this.dateUtils.parse(a.start) - this.dateUtils.parse(b.start)).forEach(task => renderTaskNode(task, 0));
        },
        renderChart: function() {
             const { startDate, endDate, unitWidth } = this.state.timeline;
            if (!startDate) return;

            const totalDays = this.dateUtils.daysBetween(this.dateUtils.format(startDate), this.dateUtils.format(endDate));
            this.state.timeline.totalWidth = totalDays * unitWidth;

            this.ui.headerContainer.innerHTML = '';
            this.ui.gridEl.innerHTML = '';
            this.ui.chartContent.querySelectorAll('.gantt-bar-container, .gantt-today-marker').forEach(el => el.remove());

            const headerEl = document.createElement('div');
            headerEl.className = 'gantt-timeline-header';
            const monthsEl = document.createElement('div'); monthsEl.className = 'gantt-timeline-months';
            const daysEl = document.createElement('div'); daysEl.className = 'gantt-timeline-days';
            
            let currentMonth = -1, monthDayCount = 0, currentMonthEl = null;
            for (let i = 0; i < totalDays; i++) {
                const dayDate = this.dateUtils.addDays(startDate, i);
                if (dayDate.getUTCMonth() !== currentMonth) {
                    if(currentMonthEl) currentMonthEl.style.width = `${monthDayCount * unitWidth}px`;
                    currentMonth = dayDate.getUTCMonth();
                    monthDayCount = 0;
                    const monthName = dayDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                    currentMonthEl = document.createElement('div');
                    currentMonthEl.className = 'gantt-timeline-month';
                    currentMonthEl.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    monthsEl.appendChild(currentMonthEl);
                }
                monthDayCount++;

                const dayEl = document.createElement('div');
                dayEl.className = 'gantt-timeline-day';
                dayEl.style.width = `${unitWidth}px`;
                dayEl.textContent = dayDate.getUTCDate();
                daysEl.appendChild(dayEl);

                const gridLine = document.createElement('div');
                gridLine.className = 'gantt-grid-line';
                gridLine.style.left = `${i * unitWidth}px`;
                this.ui.gridEl.appendChild(gridLine);

                const dayOfWeek = dayDate.getUTCDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    const weekendEl = document.createElement('div');
                    weekendEl.className = 'gantt-grid-weekend';
                    weekendEl.style.left = `${i * unitWidth}px`;
                    weekendEl.style.width = `${unitWidth}px`;
                    this.ui.gridEl.appendChild(weekendEl);
                }
            }
            if(currentMonthEl) currentMonthEl.style.width = `${monthDayCount * unitWidth}px`;
            headerEl.appendChild(monthsEl);
            headerEl.appendChild(daysEl);
            this.ui.headerContainer.appendChild(headerEl);

            this.state.flatTaskOrder.forEach((taskId, index) => {
                const task = this.tasks.find(t => t.id === taskId);
                if (!task) return;

                const rowLine = document.createElement('div');
                rowLine.className = 'gantt-row-line';
                if(this.state.selectedTaskId === task.id) rowLine.style.background = 'var(--gantt-selected-row-bg)';
                rowLine.style.top = `${index * 40 + 39}px`;
                this.ui.gridEl.appendChild(rowLine);
                
                if (task.type === 'parent' && task.collapsed) return;

                const taskStart = this.dateUtils.parse(task.start);
                const left = this.dateUtils.daysBetween(this.dateUtils.format(startDate), task.start) * unitWidth;

                const barContainer = document.createElement('div');
                barContainer.className = 'gantt-bar-container';
                barContainer.style.top = `${index * 40}px`;
                barContainer.dataset.taskId = task.id;
                
                const barColor = task.color || 'var(--accent-color)';

                if (task.type === 'milestone') {
                    barContainer.style.left = `${left}px`;
                    barContainer.innerHTML = `<div class="gantt-milestone" style="background-color: ${task.color || 'var(--gantt-milestone-color)'};"></div>`;
                } else {
                    const taskEnd = this.dateUtils.parse(task.end);
                    const duration = this.dateUtils.daysBetween(task.start, task.end) + 1;
                    const width = duration * unitWidth;
                    barContainer.style.left = `${left}px`;
                    barContainer.style.width = `${width}px`;

                    const barClass = task.type === 'parent' ? 'gantt-bar-parent' : '';
                    const progress = task.progress || 0;

                    barContainer.innerHTML = `
                        <div class="gantt-bar ${barClass}" style="${task.type !== 'parent' ? 'background-color:' + barColor : ''}">
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle left"></div>' : ''}
                            <div class="gantt-bar-progress" style="width: ${progress}%"></div>
                            <span style="z-index:1; padding: 0 8px; pointer-events:none; color: ${task.type === 'parent' ? '#fff' : 'inherit'}">${task.name}</span>
                            ${task.type !== 'parent' ? `<div class="gantt-dependency-handle end" data-type="end"></div><div class="gantt-bar-handle right"></div>` : ''}
                        </div>
                    `;
                }
                this.ui.chartContent.appendChild(barContainer);
            });
            
            const today = new Date();
            if (today >= startDate && today <= endDate) {
                const todayOffset = this.dateUtils.daysBetween(this.dateUtils.format(startDate), this.dateUtils.format(today)) * unitWidth;
                const todayMarker = document.createElement('div');
                todayMarker.className = 'gantt-today-marker';
                todayMarker.style.left = `${todayOffset}px`;
                todayMarker.style.height = `${this.state.flatTaskOrder.length * 40}px`;
                this.ui.chartContent.appendChild(todayMarker);
            }

            const contentHeight = this.state.flatTaskOrder.length * 40;
            this.ui.chartContent.style.width = `${this.state.timeline.totalWidth}px`;
            this.ui.chartContent.style.height = `${contentHeight}px`;
            this.ui.svgOverlay.setAttribute('width', this.state.timeline.totalWidth);
            this.ui.svgOverlay.setAttribute('height', contentHeight);
        },
        
        // --- LÓGICA DE DEPENDÊNCIAS E CAMINHO CRÍTICO ---
        renderDependencies: function() {
            this.ui.svgOverlay.querySelectorAll('.gantt-dependency-path').forEach(p => p.remove());
            const barElements = {};
            this.ui.chartContent.querySelectorAll('.gantt-bar-container').forEach(b => { barElements[b.dataset.taskId] = b; });
            
            const getTaskIndex = (taskId) => this.state.flatTaskOrder.indexOf(taskId);

            this.tasks.forEach(task => {
                if(task.dependencies) {
                    const deps = task.dependencies.split(',').filter(d => d.trim() !== '');
                    deps.forEach(depId => {
                        const predecessor = this.tasks.find(t => t.id === depId.trim());
                        if(!predecessor || !barElements[task.id] || !barElements[predecessor.id]) return;

                        const fromEl = barElements[predecessor.id];
                        const toEl = barElements[task.id];
                        
                        const fromIndex = getTaskIndex(predecessor.id);
                        const toIndex = getTaskIndex(task.id);
                        if (fromIndex === -1 || toIndex === -1) return;

                        const fromX = fromEl.offsetLeft + (predecessor.type === 'milestone' ? 12 : fromEl.offsetWidth);
                        const fromY = fromIndex * 40 + 20;
                        const toX = toEl.offsetLeft + (task.type === 'milestone' ? 12 : 0) - 5; // -5 for arrowhead
                        const toY = toIndex * 40 + 20;
                        
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        const d = `M ${fromX} ${fromY} L ${fromX + 15} ${fromY} L ${fromX + 15} ${toY} L ${toX} ${toY}`;
                        path.setAttribute('d', d);
                        path.setAttribute('class', 'gantt-dependency-path');
                        path.dataset.fromId = predecessor.id;
                        path.dataset.toId = task.id;
                        this.ui.svgOverlay.appendChild(path);
                    });
                }
            });
        },
        updateCriticalPath: function() {
            this.ui.chartContent.querySelectorAll('.critical').forEach(el => el.classList.remove('critical'));
            this.ui.svgOverlay.querySelectorAll('.critical').forEach(el => el.classList.remove('critical'));

            if (!this.state.showCriticalPath) return;

            const tasks = this.tasks.filter(t => t.type !== 'parent');
            if (tasks.length === 0) return;

            tasks.forEach(t => {
                t.earlyStart = 0;
                t.earlyFinish = 0;
                t.lateStart = Infinity;
                t.lateFinish = Infinity;
                t.duration = t.type === 'milestone' ? 0 : this.dateUtils.daysBetween(t.start, t.end) + 1;
            });

            const taskMap = new Map(tasks.map(t => [t.id, t]));
            const adj = new Map(tasks.map(t => [t.id, []]));
            const revAdj = new Map(tasks.map(t => [t.id, []]));
            
            tasks.forEach(t => {
                if (t.dependencies) {
                    t.dependencies.split(',').forEach(depId => {
                        depId = depId.trim();
                        if (taskMap.has(depId)) {
                            adj.get(depId).push(t.id);
                            revAdj.get(t.id).push(depId);
                        }
                    });
                }
            });

            const sortedTasks = this.topologicalSort(tasks, adj);
            
            sortedTasks.forEach(u => {
                (revAdj.get(u.id) || []).forEach(pId => {
                    const p = taskMap.get(pId);
                    u.earlyStart = Math.max(u.earlyStart, p.earlyFinish);
                });
                u.earlyFinish = u.earlyStart + u.duration;
            });

            const projectFinishTime = Math.max(0, ...tasks.map(t => t.earlyFinish));
            tasks.forEach(t => t.lateFinish = projectFinishTime);

            [...sortedTasks].reverse().forEach(u => {
                if ((adj.get(u.id) || []).length === 0) {
                    u.lateFinish = projectFinishTime;
                } else {
                    u.lateFinish = Math.min(...(adj.get(u.id) || []).map(vId => taskMap.get(vId).lateStart));
                }
                u.lateStart = u.lateFinish - u.duration;
            });
            
            const criticalPathTaskIds = new Set();
            tasks.forEach(t => {
                const slack = t.lateStart - t.earlyStart;
                if (Math.abs(slack) < 0.01) {
                    criticalPathTaskIds.add(t.id);
                    const barEl = this.ui.chartContent.querySelector(`.gantt-bar-container[data-task-id="${t.id}"] .gantt-bar, .gantt-bar-container[data-task-id="${t.id}"] .gantt-milestone`);
                    if (barEl) barEl.classList.add('critical');
                }
            });

            this.ui.svgOverlay.querySelectorAll('.gantt-dependency-path').forEach(path => {
                const { fromId, toId } = path.dataset;
                if (criticalPathTaskIds.has(fromId) && criticalPathTaskIds.has(toId)) {
                    path.classList.add('critical');
                }
            });
        },
        topologicalSort: function(tasks, adj) {
            const inDegree = new Map(tasks.map(t => [t.id, 0]));
            tasks.forEach(t => {
                (adj.get(t.id) || []).forEach(vId => {
                    inDegree.set(vId, (inDegree.get(vId) || 0) + 1);
                });
            });

            const queue = tasks.filter(t => inDegree.get(t.id) === 0);
            const sorted = [];
            const taskMap = new Map(tasks.map(t => [t.id, t]));

            while (queue.length > 0) {
                const u = queue.shift();
                sorted.push(u);
                (adj.get(u.id) || []).forEach(vId => {
                    inDegree.set(vId, inDegree.get(vId) - 1);
                    if (inDegree.get(vId) === 0) {
                        queue.push(taskMap.get(vId));
                    }
                });
            }
            return sorted;
        },

        // --- AÇÕES DO USUÁRIO ---
        addTask: function(isMilestone = false, parentId = null) {
            this.pushState('add task');
            const today = new Date();
            const todayStr = this.dateUtils.format(today);
            const endStr = this.dateUtils.format(this.dateUtils.addDays(today, isMilestone ? 0 : 5));

            const newTask = {
                id: generateId('task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start: todayStr, end: endStr,
                assignee: '', progress: 0, dependencies: '',
                type: isMilestone ? 'milestone' : 'task',
                parentId: parentId,
                color: null,
                collapsed: false,
            };
            this.tasks.push(newTask);
            if (parentId) {
                const parent = this.tasks.find(t => t.id === parentId);
                if(parent) parent.collapsed = false;
            }
            this.renderAll();
        },
        deleteTask: function(taskId) {
            if (confirm('Tem certeza que deseja excluir esta tarefa e todas as suas sub-tarefas?')) {
                this.pushState('delete task');
                const tasksToDelete = new Set([taskId]);
                const findChildren = (pId) => {
                    this.tasks.forEach(t => {
                        if (t.parentId === pId) {
                            tasksToDelete.add(t.id);
                            findChildren(t.id);
                        }
                    });
                };
                findChildren(taskId);
                
                this.tasks = this.tasks.filter(t => !tasksToDelete.has(t.id));
                
                this.tasks.forEach(t => {
                    if (t.dependencies) {
                        t.dependencies = t.dependencies.split(',')
                            .map(dep => dep.trim())
                            .filter(depId => !tasksToDelete.has(depId))
                            .join(',');
                    }
                });

                this.renderAll();
            }
        },
        updateTask: function(taskId, field, value, noPushState = false) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task && task[field] !== value) {
                if(!noPushState) this.pushState('update task');
                task[field] = value;
                
                if (field === 'start' && task.type !== 'milestone') {
                    if (this.dateUtils.parse(task.start) > this.dateUtils.parse(task.end)) {
                        task.end = task.start;
                    }
                }
                if (field === 'end' && task.type !== 'milestone') {
                    if (this.dateUtils.parse(task.start) > this.dateUtils.parse(task.end)) {
                        task.start = task.end;
                    }
                }

                this.renderAll();
            }
        },

        // --- EVENT LISTENERS E HANDLERS ---
        setupToolbarActions: function() {
            winEl.querySelector(`#addTaskBtn_${uniqueSuffix}`).onclick = () => this.addTask();
            winEl.querySelector(`#addMilestoneBtn_${uniqueSuffix}`).onclick = () => this.addTask(true);
            winEl.querySelector(`#zoomInBtn_${uniqueSuffix}`).onclick = () => { this.state.timeline.unitWidth = Math.min(100, this.state.timeline.unitWidth + 10); this.renderAll(); };
            winEl.querySelector(`#zoomOutBtn_${uniqueSuffix}`).onclick = () => { this.state.timeline.unitWidth = Math.max(20, this.state.timeline.unitWidth - 10); this.renderAll(); };
            winEl.querySelector(`#todayBtn_${uniqueSuffix}`).onclick = () => this.goToToday();
            this.ui.undoBtn.onclick = () => this.undo();
            this.ui.redoBtn.onclick = () => this.redo();
            this.ui.criticalPathBtn.onclick = () => {
                this.state.showCriticalPath = !this.state.showCriticalPath;
                this.ui.criticalPathBtn.classList.toggle('active', this.state.showCriticalPath);
                this.updateCriticalPath();
            };
        },
        setupEventListeners: function() {
            this.ui.sidebarBody.addEventListener('change', this.handleSidebarInput.bind(this));
            this.ui.sidebarBody.addEventListener('click', this.handleSidebarClick.bind(this));
            this.ui.sidebarBody.addEventListener('contextmenu', this.handleSidebarContextMenu.bind(this));
            this.ui.chartViewport.addEventListener('scroll', this.syncScroll.bind(this));
            this.ui.sidebarBody.addEventListener('scroll', this.syncScroll.bind(this));
            this.ui.chartContent.addEventListener('mousedown', this.handleBarInteraction.bind(this));
            this.ui.chartContent.addEventListener('mouseover', this.handleBarMouseOver.bind(this));
            this.ui.chartContent.addEventListener('mouseout', () => this.hideTooltip());
            
            document.addEventListener('click', () => this.hideContextMenu());
            this.setupSplitter();

            winEl.addEventListener('keydown', (e) => {
                if(e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); }
                if(e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
            });
        },
        handleSidebarInput: function(e) {
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = e.target.dataset.field;
            if (taskId && field) {
                // Defer pushing state until 'blur' or similar event for text inputs might be better, but for now this is fine.
                this.updateTask(taskId, field, e.target.value);
            }
        },
        handleSidebarClick: function(e) {
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;

            const newSelectedId = row.dataset.taskId;
            if (this.state.selectedTaskId !== newSelectedId) {
                this.state.selectedTaskId = newSelectedId;
                this.renderAll(); // Re-render to show selection highlight
            }

            const expander = e.target.closest('.task-expander');
            if(expander && expander.children.length > 0) {
                const task = this.tasks.find(t => t.id === this.state.selectedTaskId);
                if (task && task.type === 'parent') {
                    this.pushState('toggle collapse');
                    task.collapsed = !task.collapsed;
                    this.renderAll();
                }
            }
        },
        handleBarInteraction: function(e) {
            const depHandle = e.target.closest('.gantt-dependency-handle');
            if (depHandle) {
                e.stopPropagation();
                this.state.isConnecting = true;
                this.state.connectionStartTask = depHandle.closest('.gantt-bar-container').dataset.taskId;
                
                const onConnectMove = (moveE) => {
                    const startBar = this.ui.chartContent.querySelector(`.gantt-bar-container[data-task-id="${this.state.connectionStartTask}"]`);
                    const startTask = this.tasks.find(t => t.id === this.state.connectionStartTask);
                    const startY = this.state.flatTaskOrder.indexOf(startTask.id) * 40 + 20;
                    const startX = startBar.offsetLeft + startBar.offsetWidth;
                    
                    const rect = this.ui.svgOverlay.getBoundingClientRect();
                    const endX = moveE.clientX - rect.left + this.ui.chartViewport.scrollLeft;
                    const endY = moveE.clientY - rect.top + this.ui.chartViewport.scrollTop;
                    this.ui.connectionLine.setAttribute('d', `M ${startX} ${startY} L ${endX} ${endY}`);
                };
                
                const onConnectUp = (upE) => {
                    this.state.isConnecting = false;
                    this.ui.connectionLine.setAttribute('d', '');
                    document.removeEventListener('mousemove', onConnectMove);
                    document.removeEventListener('mouseup', onConnectUp);

                    const endTarget = upE.target.closest('.gantt-bar, .gantt-milestone');
                    if(endTarget) {
                        const endTaskId = endTarget.closest('.gantt-bar-container').dataset.taskId;
                        const endTask = this.tasks.find(t => t.id === endTaskId);
                        if (endTask && endTask.id !== this.state.connectionStartTask) {
                            this.pushState('add dependency');
                            const deps = endTask.dependencies ? endTask.dependencies.split(',') : [];
                            if (!deps.includes(this.state.connectionStartTask)) {
                                deps.push(this.state.connectionStartTask);
                                endTask.dependencies = deps.join(',');
                                this.renderAll();
                            }
                        }
                    }
                };

                document.addEventListener('mousemove', onConnectMove);
                document.addEventListener('mouseup', onConnectUp);
                return;
            }

            const bar = e.target.closest('.gantt-bar, .gantt-milestone');
            if (!bar) return;

            const container = bar.closest('.gantt-bar-container');
            const taskId = container.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if (!task || task.type === 'parent') return;

            this.hideTooltip();
            const initialX = e.clientX;
            const initialStart = this.dateUtils.parse(task.start);
            const initialEnd = this.dateUtils.parse(task.end);
            const handle = e.target.classList.contains('gantt-bar-handle') ? e.target.className.includes('left') ? 'left' : 'right' : null;
            
            let moved = false;
            const onMouseMove = (moveE) => {
                if (!moved) {
                   this.pushState('drag task'); // Push state only on first move
                   moved = true;
                }
                const deltaX = moveE.clientX - initialX;
                const deltaDays = Math.round(deltaX / this.state.timeline.unitWidth);

                if (handle === 'left') {
                    const newStart = this.dateUtils.addDays(initialStart, deltaDays);
                    if (newStart <= initialEnd) this.updateTask(taskId, 'start', this.dateUtils.format(newStart), true);
                } else if (handle === 'right') {
                    const newEnd = this.dateUtils.addDays(initialEnd, deltaDays);
                    if (newEnd >= this.dateUtils.parse(task.start)) this.updateTask(taskId, 'end', this.dateUtils.format(newEnd), true);
                } else { 
                    this.updateTask(taskId, 'start', this.dateUtils.format(this.dateUtils.addDays(initialStart, deltaDays)), true);
                    this.updateTask(taskId, 'end', this.dateUtils.format(this.dateUtils.addDays(initialEnd, deltaDays)), true);
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        handleBarMouseOver: function(e) {
            if (this.state.isConnecting) return;
            const barContainer = e.target.closest('.gantt-bar-container');
            if (barContainer) {
                const taskId = barContainer.dataset.taskId;
                const task = this.tasks.find(t => t.id === taskId);
                if (task) this.showTooltip(e, task);
            }
        },

        // --- FUNÇÕES UTILITÁRIAS E DE UI ---
        syncScroll: function(e) {
            if (!this.ui.chartViewport || !this.ui.sidebarBody) return;
            if (e.target === this.ui.chartViewport) {
                this.ui.sidebarBody.scrollTop = this.ui.chartViewport.scrollTop;
                this.ui.headerContainer.scrollLeft = this.ui.chartViewport.scrollLeft;
            } else if (e.target === this.ui.sidebarBody) {
                this.ui.chartViewport.scrollTop = this.ui.sidebarBody.scrollTop;
            }
        },
        goToToday: function() {
            const { startDate, unitWidth } = this.state.timeline;
            if(!startDate) return;
            const todayOffset = this.dateUtils.daysBetween(this.dateUtils.format(startDate), this.dateUtils.format(new Date())) * unitWidth;
            this.ui.chartViewport.scrollLeft = todayOffset - this.ui.chartViewport.offsetWidth / 2;
        },
        showTooltip: function(e, task) {
             const duration = task.type === 'milestone' ? 0 : this.dateUtils.daysBetween(task.start, task.end) + 1;
            this.ui.tooltipEl.innerHTML = `
                <div class="gantt-tooltip-title">${task.name}</div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Início:</span><span>${new Date(task.start+'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Fim:</span><span>${new Date(task.end+'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Duração:</span><span>${duration} dia${duration !== 1 ? 's' : ''}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Progresso:</span><span>${task.progress || 0}%</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Responsável:</span><span>${task.assignee || '-'}</span></div>
            `;
            const rect = winBody.getBoundingClientRect();
            this.ui.tooltipEl.style.left = `${e.clientX - rect.left + 15}px`;
            this.ui.tooltipEl.style.top = `${e.clientY - rect.top + 15}px`;
            this.ui.tooltipEl.classList.add('visible');
        },
        hideTooltip: function() { this.ui.tooltipEl.classList.remove('visible'); },
        handleSidebarContextMenu: function(e) {
            e.preventDefault();
            this.hideContextMenu(); // Hide any existing menu
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;

            const taskId = row.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if(!task) return;

            const colors = ['#4a6cf7', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#0dcaf0', 'var(--gantt-parent-bar-color)'];
            const colorPaletteHTML = colors.map(c => `<div class="gantt-color-swatch" style="background-color:${c}" data-color="${c}"></div>`).join('');

            this.ui.contextMenuEl.innerHTML = `
                ${task.type !== 'milestone' ? `<div class="gantt-context-menu-item" data-action="add-subtask"><i class="fas fa-plus fa-fw"></i> Adicionar Sub-tarefa</div>` : ''}
                <div class="gantt-context-menu-item danger" data-action="delete"><i class="fas fa-trash fa-fw"></i> Excluir Tarefa</div>
                ${task.type !== 'parent' ? `<div class="gantt-context-menu-separator"></div><div class="gantt-color-palette">${colorPaletteHTML}</div>` : ''}
            `;
            const rect = winBody.getBoundingClientRect();
            this.ui.contextMenuEl.style.left = `${e.clientX - rect.left}px`;
            this.ui.contextMenuEl.style.top = `${e.clientY - rect.top}px`;
            this.ui.contextMenuEl.classList.add('visible');
            
            this.ui.contextMenuEl.onclick = (menuE) => {
                menuE.stopPropagation();
                const actionTarget = menuE.target.closest('[data-action]');
                const colorTarget = menuE.target.closest('[data-color]');
                
                if (actionTarget) {
                    const action = actionTarget.dataset.action;
                    if(action === 'add-subtask') this.addTask(false, taskId);
                    if(action === 'delete') this.deleteTask(taskId);
                } else if(colorTarget) {
                    this.updateTask(taskId, 'color', colorTarget.dataset.color);
                }

                this.hideContextMenu();
            };
        },
        hideContextMenu: function() { this.ui.contextMenuEl.classList.remove('visible'); },
        generateAvatar: function(name) {
            if (!name || name.trim() === '') return `<div class="avatar" style="background-color: #ccc;" title="Não atribuído"></div>`;
            const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            const colors = ['#4a6cf7', '#28a745', '#ffc107', '#dc3545', '#6a11cb', '#fd7e14', '#0dcaf0'];
            const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const color = colors[charCodeSum % colors.length];
            return `<div class="avatar" style="background-color: ${color};" title="${name}">${initials}</div>`;
        },
        getFlatTaskOrder: function() {
            const order = [];
            const processNode = (task) => {
                order.push(task.id);
                if ((task.type === 'parent' || this.tasks.some(t => t.parentId === task.id)) && !task.collapsed) {
                    this.tasks.filter(t => t.parentId === task.id)
                        .sort((a,b) => this.dateUtils.parse(a.start) - this.dateUtils.parse(b.start))
                        .forEach(processNode);
                }
            };
            this.tasks.filter(t => !t.parentId)
                .sort((a,b) => this.dateUtils.parse(a.start) - this.dateUtils.parse(b.start))
                .forEach(processNode);
            return order;
        },
        setupSplitter: function() {
            const splitter = this.ui.splitter;
            const sidebar = splitter.previousElementSibling;
            let isDragging = false;
            splitter.addEventListener('mousedown', (e) => {
                isDragging = true;
                splitter.classList.add('dragging');
                winBody.style.cursor = 'col-resize';
                e.preventDefault();
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            const onMouseMove = (e) => {
                if (!isDragging) return;
                const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
                if (newWidth > 300 && newWidth < window.innerWidth - 300) {
                    sidebar.style.width = `${newWidth}px`;
                }
            };
            const onMouseUp = () => {
                isDragging = false;
                splitter.classList.remove('dragging');
                winBody.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
        },
        
        cleanup: function() {
             // Limpeza futura, se necessário
        }
    };

    initializeFileState(appState, "Roadmap do Projeto", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
