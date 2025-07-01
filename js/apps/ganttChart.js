import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openGanttChart() {
    const uniqueSuffix = generateId('gantt');
    const winId = window.windowManager.createWindow('Roadmap do Projeto (Gantt 2.0)', '', { 
        width: '90vw', 
        height: '85vh', 
        appType: 'gantt-chart',
        minWidth: 360,
        minHeight: 500
    });

    const content = `
        <style>
            /* --- Variáveis Globais --- */
            :root {
                --gantt-header-height: 64px;
                --gantt-row-height: 40px;
                --gantt-parent-bar-color: #5D6D7E;
                --gantt-milestone-color: #A569BD;
                --critical-color: #e74c3c;
                --focus-dim-opacity: 0.2;
            }
            
            /* --- Container Principal --- */
            .gantt-chart-app-container { 
                padding: 0 !important; 
                background-color: var(--background); 
                font-family: 'Inter', sans-serif;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }
            
            .gantt-v2-container { 
                display: flex; 
                flex-grow: 1;
                width: 100%;
                overflow: hidden;
            }
            
            /* --- Barra de Ferramentas --- */
            .app-toolbar { 
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 8px 12px;
                background-color: var(--toolbar-bg);
                border-bottom: 1px solid var(--separator-color);
            }
            
            .app-button {
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                border-radius: 4px;
                background-color: var(--button-bg);
                color: var(--text-color);
                border: 1px solid var(--button-border);
                cursor: pointer;
                transition: background-color 0.2s, color 0.2s, border-color 0.2s;
                font-size: 0.9em;
                margin: 0;
            }

            .app-button.active {
                background-color: var(--accent-color);
                color: white;
                border-color: var(--accent-color);
            }
            
            .app-button:hover:not(.active) { background-color: var(--button-hover-bg); }
            .app-button i { margin-right: 6px; }
            .toolbar-separator { border-left: 1px solid var(--separator-color); margin: 0 8px; height: 20px; align-self: center; }
            .toolbar-group { display: flex; flex-wrap: nowrap; gap: 6px; margin: 0; }

            /* --- Barra de Pesquisa e Filtros --- */
            .gantt-search-bar {
                padding: 8px 12px;
                background-color: var(--toolbar-bg);
                border-bottom: 1px solid var(--separator-color);
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;
            }
            
            .gantt-filter-group { display: flex; gap: 8px; align-items: center; }
            .gantt-filter-label { font-size: 0.85em; color: var(--secondary-text-color); white-space: nowrap; }
            .gantt-filter-select, .app-input {
                background: var(--input-bg);
                border: 1px solid var(--button-border);
                border-radius: 4px;
                padding: 6px 8px;
                color: var(--text-color);
                font-size: 0.9em;
            }
            .app-input { flex: 1 1 150px; min-width: 150px; }
            
            /* --- Painel da Tabela (Sidebar) --- */
            .gantt-sidebar { 
                width: 45%; 
                min-width: 350px; 
                max-width: 70%; 
                background-color: var(--window-bg); 
                display: flex; 
                flex-direction: column; 
                border-right: 1px solid var(--separator-color);
                overflow: hidden;
            }
            
            .gantt-sidebar-header, .gantt-task-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 80px 80px 140px 110px 110px 50px;
                gap: 10px;
                align-items: center;
                padding: 0 10px;
                box-sizing: border-box;
            }
            
            .gantt-sidebar-header { 
                padding: 10px; font-size: 0.75em; font-weight: 600; color: var(--secondary-text-color); 
                border-bottom: 1px solid var(--separator-color); text-transform: uppercase;
                background-color: var(--window-bg); z-index: 2; flex-shrink: 0;
            }
            
            .gantt-sidebar-body { flex-grow: 1; overflow-y: auto; position: relative; -webkit-overflow-scrolling: touch; }
            .gantt-task-row { height: var(--gantt-row-height); border-bottom: 1px solid var(--separator-color); cursor: pointer; user-select: none; transition: background-color 0.2s, opacity 0.3s; }
            .gantt-task-row:hover { background-color: var(--hover-highlight-color); }
            .gantt-task-row.selected { background-color: var(--selection-color); }
            .gantt-task-row.drag-over-top { border-top: 2px solid var(--accent-color); }
            .gantt-task-row.drag-over-bottom { border-bottom: 2px solid var(--accent-color); }
            .gantt-task-row.dimmed, .gantt-bar-container.dimmed { opacity: var(--focus-dim-opacity); }
            .gantt-task-row.dimmed:hover, .gantt-bar-container.dimmed:hover { opacity: 0.6; }
            
            .task-cell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; height: 100%; }
            .task-cell input, .task-cell select { 
                width: 100%; background: transparent; border: none; color: var(--text-color); 
                padding: 5px; border-radius: 4px; box-sizing: border-box; font-size: 0.9em; height: 100%;
            }
            .task-cell input:focus, .task-cell select:focus { background: var(--input-bg); outline: 1px solid var(--accent-color); }
            .task-name-cell { gap: 5px; }
            .task-expander { width: 20px; text-align: center; cursor: pointer; color: var(--secondary-text-color); transition: transform 0.2s; flex-shrink: 0; }
            .task-expander.collapsed { transform: rotate(-90deg); }
            .task-icon { margin: 0 4px; flex-shrink: 0; }
            .avatar { width: 24px; height: 24px; border-radius: 50%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 600; margin-right: 8px; flex-shrink: 0; }
            .task-actions { display: flex; justify-content: center; gap: 5px; }
            .action-btn { padding: 4px; border-radius: 4px; cursor: pointer; color: var(--secondary-text-color); background: transparent; border: none; }
            .action-btn:hover { background-color: var(--hover-highlight-color); color: var(--text-color); }
            
            /* --- Divisor Redimensionável --- */
            .gantt-splitter { width: 5px; background: var(--separator-color); cursor: col-resize; transition: background-color 0.2s; flex-shrink: 0; }
            .gantt-splitter:hover, .gantt-splitter.dragging { background: var(--accent-color); }

            /* --- Área do Gráfico --- */
            .gantt-chart-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
            .gantt-chart-header-container { flex-shrink: 0; z-index: 4; background-color: var(--toolbar-bg); overflow: hidden; }
            .gantt-timeline-header { white-space: nowrap; border-bottom: 1px solid var(--separator-color); display: flex; flex-direction: column; min-width: fit-content; }
            .gantt-timeline-upper, .gantt-timeline-lower { display: flex; }
            .gantt-timeline-unit { text-align: center; color: var(--secondary-text-color); font-size: 0.8em; border-right: 1px solid var(--separator-color); box-sizing: border-box; flex-shrink: 0; }
            .gantt-timeline-unit.upper { font-weight: 600; padding: 5px 0; border-top: 1px solid var(--separator-color); }
            .gantt-timeline-unit.lower { padding: 8px 0; }
            
            .gantt-chart-viewport { flex-grow: 1; overflow: auto; position: relative; -webkit-overflow-scrolling: touch; }
            .gantt-chart-content { position: relative; }
            .gantt-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
            .gantt-grid-line, .gantt-row-line, .gantt-grid-weekend { position: absolute; }
            .gantt-today-marker { position: absolute; top: 0; width: 2px; height: 100%; background-color: var(--danger-color); z-index: 2; opacity: 0.9; }
            .gantt-grid-line { top: 0; width: 1px; height: 100%; background-color: var(--separator-color); opacity: 0.5; }
            .gantt-row-line { left: 0; height: 1px; width: 100%; background-color: var(--separator-color); }
            .gantt-grid-weekend { top: 0; height: 100%; background-color: var(--separator-color); opacity: 0.1; }

            .gantt-bar-container { position: absolute; height: var(--gantt-row-height); display: flex; align-items: center; z-index: 1; transition: opacity 0.3s; }
            .gantt-bar { position: relative; height: 28px; background-color: var(--accent-color); border-radius: 6px; display: flex; align-items: center; color: white; font-size: 0.85em; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: grab; transition: filter 0.2s, transform 0.1s linear; }
            .gantt-bar:active { cursor: grabbing; }
            .gantt-bar:hover { filter: brightness(1.1); }
            .gantt-bar-progress { position: absolute; top: 0; left: 0; height: 100%; background: rgba(0,0,0,0.25); border-radius: 6px; pointer-events: none; }
            .gantt-bar-handle { position: absolute; top: 0; width: 8px; height: 100%; z-index: 2; }
            .gantt-bar-handle.left { left: 0; cursor: ew-resize; }
            .gantt-bar-handle.right { right: 0; cursor: ew-resize; }
            .gantt-bar-parent { background-color: var(--gantt-parent-bar-color); border-radius: 2px; height: 12px; }
            .gantt-bar-parent .gantt-bar-progress { background-color: rgba(255,255,255,0.4); }
            .gantt-milestone { position: absolute; width: 24px; height: 24px; background: var(--gantt-milestone-color); transform: rotate(45deg); top: 8px; border-radius: 3px; cursor: move; transition: transform 0.2s; }
            .gantt-milestone:hover { transform: rotate(45deg) scale(1.1); }
            .gantt-bar-label { z-index: 1; padding: 0 8px; pointer-events: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            
            .status-todo { background-color: #a9a9a9; } .status-inprogress { background-color: #4a6cf7; }
            .status-done { background-color: #28a745; } .status-blocked { background-color: #dc3545; }
            .gantt-bar.critical { border: 2px solid var(--critical-color); box-sizing: border-box; }

            #ganttSvgOverlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            .gantt-dependency-path { stroke: var(--secondary-text-color); stroke-width: 1.5; fill: none; opacity: 0.8; marker-end: url(#arrowhead_${uniqueSuffix}); transition: opacity 0.3s; }
            .gantt-critical-path { stroke: var(--critical-color) !important; stroke-width: 2.5 !important; opacity: 1 !important; }
            .gantt-dependency-path.dimmed { opacity: calc(var(--focus-dim-opacity) * 0.5); }

            /* --- Tooltip & Context Menu --- */
            .gantt-tooltip { position: fixed; background: var(--context-menu-bg); color: var(--text-color); border: 1px solid var(--separator-color); border-radius: 8px; padding: 10px; z-index: 10000; font-size: 0.9em; box-shadow: 0 5px 15px rgba(0,0,0,0.2); pointer-events: none; opacity: 0; transition: opacity 0.2s; max-width: 300px; }
            .gantt-tooltip.visible { opacity: 1; }
            .gantt-tooltip-title { font-weight: 600; margin-bottom: 8px; color: var(--accent-color); }
            .gantt-tooltip-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .gantt-tooltip-label { color: var(--secondary-text-color); margin-right: 15px; }
            .gantt-context-menu { position: fixed; background: var(--context-menu-bg); border: 1px solid var(--separator-color); border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 1000; min-width: 180px; }
            .gantt-context-menu-item { padding: 8px 16px; cursor: pointer; font-size: 0.9em; display: flex; align-items: center; }
            .gantt-context-menu-item:hover { background-color: var(--hover-highlight-color); }
            .gantt-context-menu-item i { margin-right: 8px; width: 16px; text-align: center; }

            /* --- Mobile Responsiveness --- */
            @media (max-width: 800px) {
                .toolbar-separator { display: none; }
                .gantt-v2-container {
                    flex-direction: column; /* Stack panes vertically */
                }
                .gantt-sidebar {
                    width: 100%; max-width: 100%;
                    flex: 1; /* Allow flexible height */
                    min-height: 300px; /* Prevent it from becoming too small */
                    border-right: none;
                    border-bottom: 2px solid var(--separator-color);
                }
                .gantt-chart-area {
                    flex: 1; /* Allow flexible height */
                    min-height: 300px;
                }
                .gantt-splitter { display: none; }
                .gantt-sidebar-header { display: none; }
                .gantt-task-row {
                    height: auto; min-height: var(--gantt-row-height);
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: auto auto auto auto;
                    gap: 8px 10px; padding: 10px;
                    align-items: flex-start;
                }
                .task-cell {
                    height: auto; grid-column: span 1; white-space: normal;
                    display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
                }
                 .task-cell::before {
                    content: attr(data-label); font-size: 0.7em; font-weight: 600;
                    color: var(--secondary-text-color); text-transform: uppercase; margin-bottom: 2px;
                }
                .task-cell.task-name-cell, .task-cell.task-actions { grid-column: 1 / -1; }
                .task-name-cell { font-weight: bold; flex-direction: row; align-items: center; }
                .task-name-cell::before { content: ''; margin-bottom: 0; }
                .task-cell.task-actions { flex-direction: row; justify-content: flex-end; }
                .task-cell.task-actions::before { content: ''; }
            }
            @media (max-width: 600px) {
                .app-button span { display: none; } /* Hide text on small buttons */
                .app-button i { margin-right: 0; }
                .app-button { padding: 8px 10px; }
            }
        </style>

        <div class="gantt-chart-app-container">
            <div class="app-toolbar">
                ${getStandardAppToolbarHTML()}
                <div class="toolbar-group">
                    <button id="addTaskBtn_${uniqueSuffix}" class="app-button" title="Adicionar Tarefa"><i class="fas fa-plus-circle"></i> <span>Tarefa</span></button>
                    <button id="addMilestoneBtn_${uniqueSuffix}" class="app-button" title="Adicionar Marco"><i class="fas fa-gem"></i> <span>Marco</span></button>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group" id="viewModeGroup_${uniqueSuffix}">
                    <button data-view="day" class="app-button active" title="Visão Diária"><i class="fas fa-calendar-day"></i> <span>Dia</span></button>
                    <button data-view="week" class="app-button" title="Visão Semanal"><i class="fas fa-calendar-week"></i> <span>Semana</span></button>
                    <button data-view="month" class="app-button" title="Visão Mensal"><i class="fas fa-calendar-alt"></i> <span>Mês</span></button>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <button id="zoomOutBtn_${uniqueSuffix}" class="app-button" title="Reduzir Zoom"><i class="fas fa-search-minus"></i></button>
                    <button id="zoomInBtn_${uniqueSuffix}" class="app-button" title="Aumentar Zoom"><i class="fas fa-search-plus"></i></button>
                    <button id="todayBtn_${uniqueSuffix}" class="app-button" title="Ir para Hoje"><i class="fas fa-calendar-check"></i></button>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <button id="linkTasksBtn_${uniqueSuffix}" class="app-button" title="Vincular Tarefas"><i class="fas fa-link"></i></button>
                    <button id="criticalPathBtn_${uniqueSuffix}" class="app-button" title="Mostrar Caminho Crítico"><i class="fas fa-bolt"></i></button>
                    <button id="focusBtn_${uniqueSuffix}" class="app-button" title="Modo Foco"><i class="fas fa-crosshairs"></i></button>
                </div>
            </div>
            
            <div class="gantt-search-bar">
                <input type="text" id="ganttSearch_${uniqueSuffix}" placeholder="Pesquisar tarefas..." class="app-input">
                <div class="gantt-filter-group">
                    <span class="gantt-filter-label">Status:</span>
                    <select id="statusFilter_${uniqueSuffix}" class="gantt-filter-select">
                        <option value="all">Todos</option>
                        <option value="todo">A Fazer</option>
                        <option value="inprogress">Em Progresso</option>
                        <option value="done">Concluído</option>
                        <option value="blocked">Bloqueado</option>
                    </select>
                </div>
                <div class="gantt-filter-group">
                    <span class="gantt-filter-label">Responsável:</span>
                    <select id="assigneeFilter_${uniqueSuffix}" class="gantt-filter-select">
                        <option value="all">Todos</option>
                    </select>
                </div>
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
                        <span>Ações</span>
                    </div>
                    <div class="gantt-sidebar-body" id="ganttSidebarBody_${uniqueSuffix}"></div>
                </div>
                <div class="gantt-splitter" id="ganttSplitter_${uniqueSuffix}"></div>
                <div class="gantt-chart-area">
                    <div class="gantt-chart-header-container" id="ganttHeaderContainer_${uniqueSuffix}"></div>
                    <div class="gantt-chart-viewport" id="ganttChartViewport_${uniqueSuffix}">
                        <div class="gantt-chart-content" id="ganttChartContent_${uniqueSuffix}">
                             <svg id="ganttSvgOverlay" width="100%" height="100%">
                               <defs>
                                 <marker id="arrowhead_${uniqueSuffix}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                   <path d="M 0 0 L 10 5 L 0 10 z" opacity="0.8" fill="var(--secondary-text-color)"/>
                                 </marker>
                               </defs>
                            </svg>
                            <div class="gantt-grid" id="ganttGrid_${uniqueSuffix}"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="gantt-tooltip" id="ganttTooltip_${uniqueSuffix}"></div>
        </div>
    `;
    
    const winData = window.windowManager.windows.get(winId);
    if (!winData) return winId;
    const winEl = winData.element;
    winEl.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId, 
        tasks: [], 
        appDataType: 'gantt-chart',
        selectedTaskId: null,
        showCriticalPath: false,
        isFocusMode: false,
        
        sidebarBody: winEl.querySelector(`#ganttSidebarBody_${uniqueSuffix}`),
        headerContainer: winEl.querySelector(`#ganttHeaderContainer_${uniqueSuffix}`),
        chartViewport: winEl.querySelector(`#ganttChartViewport_${uniqueSuffix}`),
        chartContent: winEl.querySelector(`#ganttChartContent_${uniqueSuffix}`),
        gridEl: winEl.querySelector(`#ganttGrid_${uniqueSuffix}`),
        svgOverlay: winEl.querySelector(`#ganttSvgOverlay`),
        tooltipEl: winEl.querySelector(`#ganttTooltip_${uniqueSuffix}`),
        splitter: winEl.querySelector(`#ganttSplitter_${uniqueSuffix}`),
        
        timeline: { 
            startDate: null, 
            endDate: null, 
            viewMode: 'day',
            unitWidths: { day: 40, week: 140, month: 300 },
            get unitWidth() { return this.unitWidths[this.viewMode]; },
            set unitWidth(val) { 
                const min = { day: 20, week: 70, month: 150 };
                const max = { day: 150, week: 400, month: 800 };
                this.unitWidths[this.viewMode] = Math.max(min[this.viewMode], Math.min(max[this.viewMode], val));
            },
            totalWidth: 0 
        },
        flatTaskOrder: [],
        filteredTasks: [],
        domNodeMap: new Map(),
        debouncedRenderAll: null,

        getData: function() { return JSON.stringify(this.tasks, null, 2); },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString); 
                this.tasks = Array.isArray(data) ? data : (data.tasks || []); 
                this.fileId = fileMeta.id; 
                this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
            } catch (e) { 
                showNotification("Erro ao ler arquivo Gantt.", 3000, 'error'); 
                console.error("Gantt Load Error:", e);
            } 
        },
        
        init: function() {
            // Debouncer for input handling
            this.debouncedRenderAll = this.debounce(() => this.renderAll(), 400);

            setupAppToolbarActions(this);
            
            // Toolbar Buttons
            winEl.querySelector(`#addTaskBtn_${uniqueSuffix}`).onclick = () => this.addTask();
            winEl.querySelector(`#addMilestoneBtn_${uniqueSuffix}`).onclick = () => this.addTask(true);
            winEl.querySelector(`#zoomOutBtn_${uniqueSuffix}`).onclick = () => this.zoomOut();
            winEl.querySelector(`#zoomInBtn_${uniqueSuffix}`).onclick = () => this.zoomIn();
            winEl.querySelector(`#todayBtn_${uniqueSuffix}`).onclick = () => this.goToToday();
            winEl.querySelector(`#linkTasksBtn_${uniqueSuffix}`).onclick = () => this.promptForDependency(this.selectedTaskId);
            winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`).onclick = () => this.toggleCriticalPath();
            winEl.querySelector(`#focusBtn_${uniqueSuffix}`).onclick = () => this.toggleFocusMode();

            // View Mode Buttons
            winEl.querySelector(`#viewModeGroup_${uniqueSuffix}`).addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (button && button.dataset.view) {
                    this.timeline.viewMode = button.dataset.view;
                    this.renderAll();
                }
            });

            // Event Listeners
            this.sidebarBody.addEventListener('input', (e) => this.handleSidebarInput(e));
            this.sidebarBody.addEventListener('click', (e) => this.handleSidebarClick(e));
            this.chartViewport.addEventListener('scroll', this.syncScroll.bind(this));
            this.sidebarBody.addEventListener('scroll', this.syncScroll.bind(this));

            const chartInteractionTarget = this.chartContent;
            chartInteractionTarget.addEventListener('mousedown', (e) => this.handleBarInteractionStart(e));
            chartInteractionTarget.addEventListener('touchstart', (e) => this.handleBarInteractionStart(e), { passive: false });
            chartInteractionTarget.addEventListener('mouseover', (e) => this.handleBarMouseOver(e));
            chartInteractionTarget.addEventListener('mouseout', () => this.hideTooltip());
            chartInteractionTarget.addEventListener('contextmenu', (e) => this.showContextMenu(e));
            
            this.setupSplitter();
            this.initFilters();
            this.initKeyboardShortcuts();
            this.initLongPressContextMenu();

            if (!this.fileId) {
                this.tasks = this.getSampleData();
            }

            this.renderAll();
            this.updateAssigneeFilter();
        },

        renderAll: function(partial = false) {
            if (!partial) {
                winEl.querySelectorAll(`#viewModeGroup_${uniqueSuffix} button`).forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.view === this.timeline.viewMode);
                });
                winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`).classList.toggle('active', this.showCriticalPath);
                winEl.querySelector(`#focusBtn_${uniqueSuffix}`).classList.toggle('active', this.isFocusMode);

                this.applyFilters();
                this.updateParentTasks();
                this.calculateTimeline();
            }
            
            if (this.showCriticalPath) {
                this.calculateCriticalPath();
            }

            this.flatTaskOrder = this.getFlatTaskOrder();
            
            this.renderSidebar();
            this.renderChart();
            this.renderDependencies();
        },
        
        // --- Date Helper Functions (UTC-safe) ---
        parseDate: (dateStr) => new Date(dateStr + 'T00:00:00Z'),
        addDays: (date, days) => {
            const result = new Date(date);
            result.setUTCDate(result.getUTCDate() + days);
            return result;
        },
        daysBetween: (d1, d2) => {
            const msPerDay = 1000 * 60 * 60 * 24;
            // Use Math.floor to prevent partial day issues from timezone shifts if not careful
            return Math.floor((d2.getTime() - d1.getTime()) / msPerDay);
        },
        formatDate: (date) => date.toISOString().split('T')[0],
        formatDateLocale: (date) => date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        debounce: function(func, wait) {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        },

        // --- Timeline & View Modes ---
        calculateTimeline: function() {
            if (this.tasks.length === 0) {
                const today = new Date(); today.setUTCHours(0, 0, 0, 0);
                this.timeline.startDate = this.addDays(today, -30);
                this.timeline.endDate = this.addDays(today, 60);
                return;
            }
            
            let minDate = null, maxDate = null;
            this.tasks.forEach(t => {
                const start = this.parseDate(t.start);
                const end = t.end ? this.parseDate(t.end) : start;
                if (!minDate || start < minDate) minDate = start;
                if (!maxDate || end > maxDate) maxDate = end;
            });
            
            const bufferDays = this.timeline.viewMode === 'day' ? 15 : (this.timeline.viewMode === 'week' ? 30 : 90);
            this.timeline.startDate = this.addDays(minDate, -bufferDays);
            this.timeline.endDate = this.addDays(maxDate, bufferDays);
        },
        
        zoomIn: function() { this.timeline.unitWidth *= 1.25; this.renderChart(); this.renderDependencies(); },
        zoomOut: function() { this.timeline.unitWidth /= 1.25; this.renderChart(); this.renderDependencies(); },

        // NEW: Accurate positioning function, the core of the layout fix
        dateToPosition: function(date) {
            const { startDate, viewMode, unitWidth } = this.timeline;
            if (!startDate || !date) return 0;
            
            const dayWidth = viewMode === 'day' ? unitWidth : 
                             viewMode === 'week' ? unitWidth / 7 :
                             0; // Month is handled differently

            if (viewMode === 'day' || viewMode === 'week') {
                return this.daysBetween(startDate, date) * dayWidth;
            }

            if (viewMode === 'month') {
                let totalWidth = 0;
                let current = new Date(startDate);
                const targetTime = date.getTime();

                // Calculate width of the first partial month
                const nextMonth = new Date(current.getUTCFullYear(), current.getUTCMonth() + 1, 1);
                const daysInFirstMonth = this.daysBetween(current, nextMonth);
                totalWidth += (this.daysBetween(startDate, date) < daysInFirstMonth)
                    ? (this.daysBetween(startDate, date) / daysInFirstMonth) * unitWidth
                    : (this.daysBetween(startDate, nextMonth) / daysInFirstMonth) * unitWidth;
                current = nextMonth;
                
                // Add full months
                while (current.getTime() < targetTime) {
                    const monthStart = new Date(current);
                    const monthEnd = new Date(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1);
                    if (monthEnd.getTime() <= targetTime) {
                        totalWidth += unitWidth;
                        current = monthEnd;
                    } else {
                        break;
                    }
                }

                // Add last partial month
                if (current.getTime() < targetTime) {
                    const monthStart = new Date(current);
                    const nextMonthStart = new Date(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1);
                    const daysInMonth = this.daysBetween(monthStart, nextMonthStart);
                    const daysIntoMonth = this.daysBetween(monthStart, date);
                    totalWidth += (daysIntoMonth / daysInMonth) * unitWidth;
                }
                
                return totalWidth;
            }
            return 0; // Fallback
        },

        goToToday: function() {
            const today = new Date(); today.setUTCHours(0,0,0,0);
            const todayOffset = this.dateToPosition(today);
            this.chartViewport.scrollLeft = todayOffset - this.chartViewport.offsetWidth / 2;
        },
        
        toggleCriticalPath: function() { this.showCriticalPath = !this.showCriticalPath; this.renderAll(); },
        toggleFocusMode: function() { this.isFocusMode = !this.isFocusMode; this.renderAll(); },

        renderSidebar: function() {
            this.sidebarBody.innerHTML = ''; // Clear previous content completely before re-render
            this.domNodeMap.clear(); // Clear the map as we are rebuilding DOM
            const fragment = document.createDocumentFragment();

            let focusedTaskIds = new Set();
            if (this.isFocusMode && this.selectedTaskId) {
                const selectedTask = this.tasks.find(t => t.id === this.selectedTaskId);
                if (selectedTask) {
                    focusedTaskIds.add(selectedTask.id);
                    // Add predecessors
                    const deps = (selectedTask.dependencies || '').split(',').filter(Boolean);
                    deps.forEach(id => focusedTaskIds.add(id));
                    // Add successors
                    this.tasks.forEach(t => {
                        if ((t.dependencies || '').split(',').includes(selectedTask.id)) {
                            focusedTaskIds.add(t.id);
                        }
                    });
                }
            }
            
            const renderTaskNode = (task, level) => {
                const row = document.createElement('div');
                this.domNodeMap.set(task.id, row);
                const isDimmed = this.isFocusMode && focusedTaskIds.size > 0 && !focusedTaskIds.has(task.id);
                row.className = `gantt-task-row ${this.selectedTaskId === task.id ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`;
                row.dataset.taskId = task.id;

                const isParent = task.type === 'parent';
                const expanderHTML = isParent ? `<span class="task-expander ${task.collapsed ? 'collapsed' : ''}"><i class="fas fa-angle-down"></i></span>` : '<span class="task-expander"></span>';
                const icon = task.type === 'milestone' ? 'fa-gem' : isParent ? 'fa-folder' : 'fa-tasks';
                const duration = isParent ? '-' : (this.daysBetween(this.parseDate(task.start), this.parseDate(task.end)) + 1) + 'd';

                row.innerHTML = `
                    <div class="task-cell task-name-cell" data-label="Tarefa" style="padding-left: ${level * 25 + 5}px;">
                        ${expanderHTML}
                        <i class="fas ${icon} task-icon"></i>
                        <input type="text" value="${task.name}" data-field="name" title="${task.name}">
                    </div>
                    <div class="task-cell" data-label="Duração"><span>${duration}</span></div>
                    <div class="task-cell" data-label="Prog. %">
                        <input type="number" min="0" max="100" value="${task.progress || 0}" data-field="progress">
                    </div>
                    <div class="task-cell" data-label="Responsável" title="${task.assignee || ''}">
                        ${this.generateAvatar(task.assignee)}
                        <input type="text" value="${task.assignee || ''}" data-field="assignee" placeholder="-">
                    </div>
                    <div class="task-cell" data-label="Início">
                        <input type="date" value="${task.start}" data-field="start">
                    </div>
                    <div class="task-cell" data-label="Fim">
                        <input type="date" value="${task.end || task.start}" data-field="end" ${task.type === 'milestone' ? 'readonly' : ''}>
                    </div>
                    <div class="task-cell task-actions">
                        <button class="action-btn" data-action="remove" title="Remover"><i class="fas fa-trash"></i></button>
                        <button class="action-btn" data-action="add-child" title="Adicionar Subtarefa"><i class="fas fa-plus"></i></button>
                    </div>
                `;
                fragment.appendChild(row);

                if (isParent && !task.collapsed) {
                    this.tasks.filter(t => t.parentId === task.id)
                        .sort((a,b) => this.parseDate(a.start) - this.parseDate(b.start))
                        .forEach(child => renderTaskNode(child, level + 1));
                }
            };
            
            this.flatTaskOrder.forEach(taskId => {
                const task = this.tasks.find(t => t.id === taskId);
                if (task && !task.parentId) { // Only render root nodes, recursion handles children
                     renderTaskNode(task, 0);
                }
            });

            this.sidebarBody.appendChild(fragment);
        },
        
        renderChart: function() {
            if (!this.timeline.startDate) return;

            this.headerContainer.innerHTML = '';
            this.gridEl.innerHTML = '';
            this.chartContent.querySelectorAll('.gantt-bar-container, .gantt-today-marker').forEach(el => el.remove());

            this.renderTimelineHeader();

            let focusedTaskIds = new Set();
            if (this.isFocusMode && this.selectedTaskId) {
                 const selectedTask = this.tasks.find(t => t.id === this.selectedTaskId);
                if (selectedTask) {
                    focusedTaskIds.add(selectedTask.id);
                    (selectedTask.dependencies || '').split(',').filter(Boolean).forEach(id => focusedTaskIds.add(id));
                    this.tasks.forEach(t => {
                        if ((t.dependencies || '').split(',').includes(selectedTask.id)) focusedTaskIds.add(t.id);
                    });
                }
            }

            this.flatTaskOrder.forEach((taskId, index) => {
                const task = this.tasks.find(t => t.id === taskId);
                if (!task) return;

                const isDimmed = this.isFocusMode && focusedTaskIds.size > 0 && !focusedTaskIds.has(task.id);

                const rowLine = document.createElement('div');
                rowLine.className = `gantt-row-line ${isDimmed ? 'dimmed' : ''}`;
                rowLine.style.top = `${index * 40 + 39}px`;
                this.gridEl.appendChild(rowLine);

                const taskStart = this.parseDate(task.start);
                const left = this.dateToPosition(taskStart);

                const barContainer = document.createElement('div');
                barContainer.className = `gantt-bar-container ${isDimmed ? 'dimmed' : ''}`;
                barContainer.style.top = `${index * 40}px`;
                barContainer.dataset.taskId = task.id;

                if (task.type === 'milestone') {
                    barContainer.style.left = `${left - 12}px`; // Center milestone
                    barContainer.innerHTML = `<div class="gantt-milestone"></div>`;
                } else {
                    const taskEnd = this.addDays(this.parseDate(task.end || task.start), 1); // Add 1 day to end for width calc
                    const width = this.dateToPosition(taskEnd) - left;
                    
                    barContainer.style.left = `${left}px`;
                    barContainer.style.width = `${Math.max(width, 2)}px`;

                    const barClass = task.type === 'parent' ? 'gantt-bar-parent' : `status-${task.status || 'todo'}`;
                    const progress = task.progress || 0;
                    const isCritical = this.showCriticalPath && task._isCritical;

                    barContainer.innerHTML = `
                        <div class="gantt-bar ${barClass} ${isCritical ? 'critical' : ''}">
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle left"></div>' : ''}
                            <div class="gantt-bar-progress" style="width: ${progress}%"></div>
                            <span class="gantt-bar-label">${task.name}</span>
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle right"></div>' : ''}
                        </div>
                    `;
                }
                this.chartContent.appendChild(barContainer);
            });
            
            const today = new Date(); today.setUTCHours(0,0,0,0);
            if (today >= this.timeline.startDate && today <= this.timeline.endDate) {
                const todayOffset = this.dateToPosition(today);
                const todayMarker = document.createElement('div');
                todayMarker.className = 'gantt-today-marker';
                todayMarker.style.left = `${todayOffset}px`;
                todayMarker.style.height = `${this.flatTaskOrder.length * 40}px`;
                this.chartContent.appendChild(todayMarker);
            }

            const contentHeight = this.flatTaskOrder.length * 40;
            this.chartContent.style.width = `${this.timeline.totalWidth}px`;
            this.chartContent.style.height = `${contentHeight}px`;
            this.svgOverlay.setAttribute('width', this.timeline.totalWidth);
            this.svgOverlay.setAttribute('height', contentHeight);
        },

        renderTimelineHeader: function() {
            const { startDate, endDate, viewMode, unitWidth } = this.timeline;
            const headerEl = document.createElement('div');
            headerEl.className = 'gantt-timeline-header';
            const upperRow = document.createElement('div'); upperRow.className = 'gantt-timeline-upper';
            const lowerRow = document.createElement('div'); lowerRow.className = 'gantt-timeline-lower';
            
            let totalWidth = 0;
            let currentDate = new Date(startDate.getTime()); currentDate.setUTCHours(0,0,0,0);

            const addUnit = (parent, text, width, className = '') => {
                const el = document.createElement('div');
                el.className = `gantt-timeline-unit ${className}`;
                el.textContent = text;
                el.style.width = `${width}px`;
                parent.appendChild(el); return el;
            };
            const addGridLine = (left) => {
                const gridLine = document.createElement('div');
                gridLine.className = 'gantt-grid-line';
                gridLine.style.left = `${left - 1}px`;
                this.gridEl.appendChild(gridLine);
            };

            let lastMajorUnitText = '';
            let majorUnitEl = null;
            let majorUnitWidth = 0;
            
            while(currentDate <= endDate) {
                let lowerUnitText, currentUnitWidth, nextDate, majorUnitText;

                switch(viewMode) {
                    case 'month':
                        majorUnitText = currentDate.getUTCFullYear().toString();
                        lowerUnitText = currentDate.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
                        currentUnitWidth = unitWidth;
                        nextDate = new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1);
                        break;
                    case 'week':
                        majorUnitText = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                        const weekStart = currentDate.getUTCDate();
                        const weekEnd = this.addDays(currentDate, 6).getUTCDate();
                        lowerUnitText = `${weekStart} - ${weekEnd}`;
                        currentUnitWidth = unitWidth;
                        nextDate = this.addDays(currentDate, 7);
                        break;
                    default: // 'day'
                        majorUnitText = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                        lowerUnitText = currentDate.getUTCDate().toString();
                        currentUnitWidth = unitWidth;
                        const dayOfWeek = currentDate.getUTCDay();
                        if (dayOfWeek === 0 || dayOfWeek === 6) {
                            const weekendEl = document.createElement('div');
                            weekendEl.className = 'gantt-grid-weekend';
                            weekendEl.style.left = `${totalWidth}px`;
                            weekendEl.style.width = `${currentUnitWidth}px`;
                            this.gridEl.appendChild(weekendEl);
                        }
                        nextDate = this.addDays(currentDate, 1);
                        break;
                }

                if (majorUnitText !== lastMajorUnitText) {
                    if (majorUnitEl) majorUnitEl.style.width = `${majorUnitWidth}px`;
                    majorUnitEl = addUnit(upperRow, majorUnitText, 0, 'upper');
                    majorUnitWidth = 0;
                    lastMajorUnitText = majorUnitText;
                }
                
                addUnit(lowerRow, lowerUnitText, currentUnitWidth, 'lower');
                addGridLine(totalWidth);
                majorUnitWidth += currentUnitWidth;
                totalWidth += currentUnitWidth;
                currentDate = nextDate;
            }

            if (majorUnitEl) majorUnitEl.style.width = `${majorUnitWidth}px`;
            addGridLine(totalWidth); // Final grid line
            
            this.timeline.totalWidth = totalWidth;
            headerEl.appendChild(upperRow);
            headerEl.appendChild(lowerRow);
            this.headerContainer.appendChild(headerEl);
        },

        renderDependencies: function() {
            this.svgOverlay.innerHTML = this.svgOverlay.querySelector('defs').outerHTML; // Clear paths, keep defs
            
            const getTaskRect = (taskId) => {
                const el = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${taskId}"]`);
                const task = this.tasks.find(t => t.id === taskId);
                const index = this.flatTaskOrder.indexOf(taskId);
                if (!el || !task || index === -1) return null;

                const y = index * 40 + 20;
                const isMilestone = task.type === 'milestone';
                return {
                    x_start: el.offsetLeft + (isMilestone ? 12 : 0),
                    x_end: el.offsetLeft + (isMilestone ? 12 : el.offsetWidth),
                    y: y
                };
            };

            let focusedTaskIds = new Set();
            if (this.isFocusMode && this.selectedTaskId) {
                 const selectedTask = this.tasks.find(t => t.id === this.selectedTaskId);
                if (selectedTask) {
                    focusedTaskIds.add(selectedTask.id);
                    (selectedTask.dependencies || '').split(',').filter(Boolean).forEach(id => focusedTaskIds.add(id));
                    this.tasks.forEach(t => { if ((t.dependencies || '').split(',').includes(selectedTask.id)) focusedTaskIds.add(t.id); });
                }
            }

            this.tasks.forEach(task => {
                if(task.dependencies) {
                    const deps = task.dependencies.split(',').map(d => d.trim()).filter(Boolean);
                    deps.forEach(depId => {
                        const fromRect = getTaskRect(depId);
                        const toRect = getTaskRect(task.id);
                        if(!fromRect || !toRect) return;
                        
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        const isCritical = this.showCriticalPath && this.tasks.find(t=>t.id===depId)?._isCritical && task._isCritical;
                        const isDimmed = this.isFocusMode && focusedTaskIds.size > 0 && !(focusedTaskIds.has(task.id) && focusedTaskIds.has(depId));
                        
                        path.setAttribute('class', `gantt-dependency-path ${isCritical ? 'gantt-critical-path' : ''} ${isDimmed ? 'dimmed' : ''}`);
                        
                        const d = `M ${fromRect.x_end} ${fromRect.y} L ${fromRect.x_end + 15} ${fromRect.y} L ${fromRect.x_end + 15} ${toRect.y} L ${toRect.x_start} ${toRect.y}`;
                        path.setAttribute('d', d);
                        this.svgOverlay.appendChild(path);
                    });
                }
            });
        },
        
        calculateCriticalPath: function() {
            // Simplified CPM implementation
            const tasks = this.tasks.filter(t => t.type !== 'parent');
            if (tasks.length === 0) return;

            tasks.forEach(t => {
                t.duration = this.daysBetween(this.parseDate(t.start), this.parseDate(t.end)) + 1;
                t._isCritical = false; // Reset
            });

            const taskMap = new Map(tasks.map(t => [t.id, t]));
            const successors = new Map(tasks.map(t => [t.id, []]));
            tasks.forEach(t => {
                (t.dependencies || '').split(',').map(d => d.trim()).filter(Boolean).forEach(depId => {
                    if (taskMap.has(depId)) successors.get(depId).push(t.id);
                });
            });

            // Forward pass
            tasks.forEach(t => t.earlyFinish = 0);
            const calculateEarlyFinish = (taskId) => {
                const task = taskMap.get(taskId);
                if (task.earlyFinish > 0) return task.earlyFinish;

                const predFinish = Math.max(0, ...(t.dependencies || '').split(',').map(d => d.trim()).filter(Boolean).map(id => calculateEarlyFinish(id)));
                task.earlyFinish = predFinish + task.duration;
                return task.earlyFinish;
            };
            tasks.forEach(t => calculateEarlyFinish(t.id));

            const maxEF = Math.max(0, ...tasks.map(t => t.earlyFinish));
            
            // Backward pass
            tasks.forEach(t => t.lateFinish = maxEF);
            const endNodes = tasks.filter(t => successors.get(t.id).length === 0);
            const q = [...endNodes];
            const visited = new Set(q.map(t => t.id));

            while(q.length > 0) {
                const current = q.shift();
                current.lateStart = current.lateFinish - current.duration;
                if(Math.abs(current.lateStart - (current.earlyFinish - current.duration)) < 1) {
                    current._isCritical = true;
                }

                this.tasks.forEach(pred => {
                    if((pred.dependencies || '').split(',').includes(current.id)) {
                        const predTask = taskMap.get(pred.id);
                        if(predTask) {
                            predTask.lateFinish = Math.min(predTask.lateFinish, current.lateStart);
                            if (!visited.has(pred.id)) {
                                q.push(predTask);
                                visited.add(pred.id);
                            }
                        }
                    }
                });
                 // Also check tasks that depend on current
                tasks.forEach(p => {
                    if ((p.dependencies || '').split(',').includes(current.id)) {
                        const pred = taskMap.get(p.id);
                        if (pred) {
                            pred.lateFinish = Math.min(pred.lateFinish, current.lateStart);
                        }
                    }
                });
            }
        },
        
        addTask: function(isMilestone = false, parentId = null) {
            const today = new Date();
            const start = this.formatDate(today);
            const end = this.formatDate(this.addDays(today, isMilestone ? 0 : 4));

            const newTask = {
                id: generateId(isMilestone ? 'mile' : 'task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start, end,
                assignee: '', status: 'todo', progress: 0, dependencies: '',
                type: isMilestone ? 'milestone' : 'task',
                parentId: parentId || (this.selectedTaskId && this.tasks.find(t=>t.id===this.selectedTaskId)?.type === 'parent' ? this.selectedTaskId : null)
            };
            
            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
            this.updateAssigneeFilter();
        },
        
        removeTask: function(taskId) {
            const idsToRemove = new Set([taskId]);
            const findChildren = (pId) => {
                this.tasks.filter(t => t.parentId === pId).forEach(child => {
                    idsToRemove.add(child.id);
                    findChildren(child.id);
                });
            };
            findChildren(taskId);
        
            this.tasks = this.tasks.filter(t => !idsToRemove.has(t.id));
            this.tasks.forEach(t => {
                if (t.dependencies) {
                    t.dependencies = t.dependencies.split(',').map(d => d.trim()).filter(d => !idsToRemove.has(d)).join(',');
                }
            });
        
            if (this.selectedTaskId === taskId) this.selectedTaskId = null;
            this.markDirty();
            this.renderAll();
        },

        updateParentTasks: function() {
            const processNode = (task) => {
                const children = this.tasks.filter(c => c.parentId === task.id);
                if (children.length > 0) {
                    task.type = 'parent'; // Ensure it's a parent
                    children.forEach(processNode);
                    if (!task.collapsed) {
                        const startDates = children.map(c => this.parseDate(c.start).getTime());
                        const endDates = children.map(c => this.parseDate(c.end || c.start).getTime());
                        task.start = this.formatDate(new Date(Math.min(...startDates)));
                        task.end = this.formatDate(new Date(Math.max(...endDates)));
                        const totalProgress = children.reduce((sum, c) => sum + (Number(c.progress) || 0), 0);
                        task.progress = Math.round(totalProgress / children.length);
                    }
                }
            };
            this.tasks.filter(t => !t.parentId).forEach(p => {
                if (this.tasks.some(c => c.parentId === p.id)) processNode(p);
            });
        },

        // --- Event Handlers ---
        handleSidebarInput: function(e) {
            const input = e.target;
            const row = input.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = input.dataset.field;
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            task[field] = input.value;
            this.markDirty();

            // Perform cheap, immediate visual updates without full re-render
            if (field === 'name') {
                const barLabel = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${taskId}"] .gantt-bar-label`);
                if (barLabel) barLabel.textContent = input.value;
            } else if (field === 'progress') {
                const progressBar = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${taskId}"] .gantt-bar-progress`);
                if (progressBar) progressBar.style.width = `${input.value}%`;
            }

            // Schedule a full re-render for changes that affect layout/dependencies
            if (field === 'start' || field === 'end' || field === 'assignee') {
                if (field === 'assignee') this.updateAssigneeFilter();
                this.debouncedRenderAll();
            }
        },

        handleSidebarClick: function(e) {
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;

            const taskId = row.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            if (e.target.closest('.task-expander') && task.type === 'parent') {
                task.collapsed = !task.collapsed;
                this.markDirty();
                this.renderAll();
                return;
            }

            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                if (action === 'remove') this.removeTask(taskId);
                if (action === 'add-child') this.addTask(false, taskId);
                return;
            }
            
            if (e.target.tagName !== 'INPUT' && this.selectedTaskId !== taskId) {
                this.selectedTaskId = taskId;
                // A partial render is enough for selection change
                this.renderAll(true);
            }
        },
        
        getEventCoords: (e) => {
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY, pageX: e.touches[0].pageX, pageY: e.touches[0].pageY };
            }
            return { x: e.clientX, y: e.clientY, pageX: e.pageX, pageY: e.pageY };
        },

        handleBarInteractionStart: function(e) {
            const target = e.target;
            const bar = target.closest('.gantt-bar, .gantt-milestone');
            if (!bar) return;
            if (e.type === 'touchstart') e.preventDefault();

            const container = bar.closest('.gantt-bar-container');
            const taskId = container.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if (!task || task.type === 'parent') return;

            this.selectedTaskId = taskId;
            this.renderAll(true);
            
            const coords = this.getEventCoords(e);
            const startX = coords.pageX;
            const initialStart = this.parseDate(task.start);
            const handle = target.classList.contains('gantt-bar-handle') ? (target.classList.contains('left') ? 'left' : 'right') : null;

            const onMove = (moveE) => {
                const moveCoords = this.getEventCoords(moveE);
                const deltaX = moveCoords.pageX - startX;
                
                const posToDate = (pixel) => {
                    const days = this.daysBetween(this.timeline.startDate, new Date(0)) + pixel / this.timeline.unitWidths.day;
                    return this.addDays(new Date(0), days);
                }
                const dayWidth = this.timeline.unitWidths.day; // Simplification for now

                if (handle === 'left') {
                    const newStart = this.addDays(initialStart, Math.round(deltaX / dayWidth));
                    const newEnd = this.parseDate(task.end);
                    if (newStart <= newEnd) task.start = this.formatDate(newStart);
                } else if (handle === 'right') {
                    const initialEnd = this.parseDate(task.end);
                    const newEnd = this.addDays(initialEnd, Math.round(deltaX / dayWidth));
                     if (newEnd >= this.parseDate(task.start)) task.end = this.formatDate(newEnd);
                } else { // Move
                    const newStart = this.addDays(initialStart, Math.round(deltaX / dayWidth));
                    const duration = this.daysBetween(this.parseDate(task.start), this.parseDate(task.end));
                    const newEnd = this.addDays(newStart, duration);
                    task.start = this.formatDate(newStart);
                    task.end = this.formatDate(newEnd);
                }
                this.renderAll(true);
            };

            const onEnd = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
                this.markDirty();
                this.renderAll(); // Final full render
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        },

        handleBarMouseOver: function(e) {
            const barContainer = e.target.closest('.gantt-bar-container');
            if (barContainer && !document.querySelector('.gantt-splitter.dragging')) {
                const taskId = barContainer.dataset.taskId;
                const task = this.tasks.find(t => t.id === taskId);
                if (task) this.showTooltip(this.getEventCoords(e), task);
            }
        },

        syncScroll: function(e) {
            if (this.isSyncingScroll) return;
            this.isSyncingScroll = true;
            const target = e.target;
            if (target === this.chartViewport) {
                this.sidebarBody.scrollTop = target.scrollTop;
                this.headerContainer.scrollLeft = target.scrollLeft;
            } else if (target === this.sidebarBody) {
                this.chartViewport.scrollTop = target.scrollTop;
            }
            requestAnimationFrame(() => { this.isSyncingScroll = false; });
        },
        
        showContextMenu: function(e) {
            e.preventDefault();
            const coords = this.getEventCoords(e);
            const barContainer = e.target.closest('.gantt-bar-container, .gantt-task-row');
            if (!barContainer) return;
            const taskId = barContainer.dataset.taskId;
            
            this.selectedTaskId = taskId;
            this.renderAll(true);
            
            const existingMenu = document.querySelector('.gantt-context-menu');
            if (existingMenu) existingMenu.remove();
            
            const menu = document.createElement('div');
            menu.className = 'gantt-context-menu';

            menu.innerHTML = `
                <div class="gantt-context-menu-item" data-action="delete"><i class="fas fa-trash"></i> Remover Tarefa</div>
                <div class="gantt-context-menu-item" data-action="add-dependency"><i class="fas fa-link"></i> Adicionar Dependência</div>
                <div class="gantt-context-menu-item" data-action="mark-done"><i class="fas fa-check-circle"></i> Marcar como Concluída</div>
            `;
            document.body.appendChild(menu);

            // Position menu intelligently
            const menuRect = menu.getBoundingClientRect();
            let x = coords.pageX;
            let y = coords.pageY;
            if (x + menuRect.width > window.innerWidth) x = window.innerWidth - menuRect.width - 5;
            if (y + menuRect.height > window.innerHeight) y = window.innerHeight - menuRect.height - 5;
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            
            const closeMenu = (evt) => {
                if (!menu.contains(evt.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu, { capture: true });
                    document.removeEventListener('touchstart', closeMenu, { capture: true });
                }
            };
            
            setTimeout(() => { 
                document.addEventListener('click', closeMenu, { capture: true });
                document.addEventListener('touchstart', closeMenu, { capture: true });
            }, 0);
            
            menu.addEventListener('click', (evt) => {
                evt.stopPropagation();
                const item = evt.target.closest('.gantt-context-menu-item');
                if(!item) return;

                const action = item.dataset.action;
                const task = this.tasks.find(t => t.id === taskId);
                
                if (action === 'delete') this.removeTask(taskId);
                if (action === 'add-dependency') this.promptForDependency(taskId);
                if (action === 'mark-done' && task) {
                    task.status = 'done'; task.progress = 100;
                    this.markDirty(); this.renderAll();
                }
                menu.remove();
                document.removeEventListener('click', closeMenu, { capture: true });
                document.removeEventListener('touchstart', closeMenu, { capture: true });
            });
        },
        
        promptForDependency: function(taskId) {
            if(!taskId) { showNotification("Selecione uma tarefa de destino primeiro.", 3000, 'warning'); return; }
            const predecessorId = prompt("Digite o ID da tarefa predecessora (a que deve vir antes):");
            if (!predecessorId) return;

            const task = this.tasks.find(t => t.id === taskId);
            const predecessor = this.tasks.find(t => t.id === predecessorId);
            
            if (!predecessor) { showNotification(`Tarefa com ID "${predecessorId}" não encontrada.`, 3000, 'error'); return; }
            if (predecessorId === taskId) { showNotification(`Uma tarefa não pode depender de si mesma.`, 3000, 'error'); return; }
            
            const deps = task.dependencies ? task.dependencies.split(',') : [];
            if (!deps.includes(predecessorId)) {
                deps.push(predecessorId);
                task.dependencies = deps.join(',');
                this.markDirty(); this.renderAll();
                showNotification("Dependência adicionada!", 2000);
            }
        },

        // --- Utility & Setup Functions ---
        showTooltip: function(coords, task) {
            const duration = task.type === 'milestone' ? 0 : this.daysBetween(this.parseDate(task.start), this.parseDate(task.end)) + 1;
            this.tooltipEl.innerHTML = `
                <div class="gantt-tooltip-title">${task.name}</div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Início:</span><span>${this.formatDateLocale(this.parseDate(task.start))}</span></div>
                ${task.type !== 'milestone' ? `<div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Fim:</span><span>${this.formatDateLocale(this.parseDate(task.end))}</span></div>` : ''}
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Duração:</span><span>${duration} dia${duration !== 1 ? 's' : ''}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Progresso:</span><span>${task.progress || 0}%</span></div>
            `;
            this.tooltipEl.style.left = `${coords.x + 15}px`;
            this.tooltipEl.style.top = `${coords.y + 15}px`;
            this.tooltipEl.classList.add('visible');
        },
        
        hideTooltip: function() { this.tooltipEl.classList.remove('visible'); },
        
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
            const processed = new Set();
            const tasksToProcess = this.filteredTasks.filter(t => !t.parentId || !this.filteredTasks.some(p => p.id === t.parentId));
            tasksToProcess.sort((a,b) => this.parseDate(a.start) - this.parseDate(b.start));

            const addNode = (task) => {
                if (processed.has(task.id)) return;
                order.push(task.id);
                processed.add(task.id);
                if (task.type === 'parent' && !task.collapsed) {
                    this.tasks.filter(t => t.parentId === task.id)
                        .sort((a,b) => this.parseDate(a.start) - this.parseDate(b.start))
                        .forEach(addNode);
                }
            };
            tasksToProcess.forEach(addNode);
            return order;
        },

        setupSplitter: function() {
            let isDragging = false;
            let startX, startWidth;

            const onDown = (e) => {
                e.preventDefault(); isDragging = true;
                this.splitter.classList.add('dragging'); document.body.style.cursor = 'col-resize';
                const coords = this.getEventCoords(e);
                startX = coords.x;
                startWidth = this.splitter.previousElementSibling.offsetWidth;
                document.addEventListener('mousemove', onMove); document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('mouseup', onUp); document.addEventListener('touchend', onUp);
            };
            const onMove = (e) => {
                if (!isDragging) return; e.preventDefault();
                const coords = this.getEventCoords(e);
                const newWidth = startWidth + (coords.x - startX);
                if (newWidth > 200 && newWidth < winEl.offsetWidth - 200) {
                    this.splitter.previousElementSibling.style.width = `${newWidth}px`;
                }
            };
            const onUp = () => {
                isDragging = false; this.splitter.classList.remove('dragging'); document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMove); document.removeEventListener('touchmove', onMove);
                document.removeEventListener('mouseup', onUp); document.removeEventListener('touchend', onUp);
            };
            this.splitter.addEventListener('mousedown', onDown);
            this.splitter.addEventListener('touchstart', onDown, { passive: false });
        },
        
        initFilters: function() {
            const searchInput = winEl.querySelector(`#ganttSearch_${uniqueSuffix}`);
            const statusFilter = winEl.querySelector(`#statusFilter_${uniqueSuffix}`);
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            
            const debouncedRender = this.debounce(() => this.renderAll(), 250);
            
            searchInput.addEventListener('input', debouncedRender);
            statusFilter.addEventListener('change', () => this.renderAll());
            assigneeFilter.addEventListener('change', () => this.renderAll());
        },

        applyFilters: function() {
            const searchTerm = winEl.querySelector(`#ganttSearch_${uniqueSuffix}`).value.toLowerCase();
            const status = winEl.querySelector(`#statusFilter_${uniqueSuffix}`).value;
            const assignee = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`).value;
            
            const parentIdsToShow = new Set();
            const matches = this.tasks.filter(task => {
                const nameMatch = searchTerm === '' || task.name.toLowerCase().includes(searchTerm);
                const statusMatch = status === 'all' || task.status === status || task.type === 'parent' || task.type === 'milestone';
                const assigneeMatch = assignee === 'all' || task.assignee === assignee || !task.assignee;
                const taskMatches = nameMatch && statusMatch && assigneeMatch;
                
                if (taskMatches && task.parentId) {
                    let pId = task.parentId;
                    while(pId) {
                       parentIdsToShow.add(pId);
                       pId = this.tasks.find(t => t.id === pId)?.parentId;
                    }
                }
                return taskMatches;
            });
            this.filteredTasks = this.tasks.filter(task => matches.includes(task) || parentIdsToShow.has(task.id));
        },
        
        updateAssigneeFilter: function() {
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            const currentVal = assigneeFilter.value;
            const allAssignees = [...new Set(this.tasks.map(t => t.assignee).filter(Boolean))].sort();
            
            assigneeFilter.innerHTML = '<option value="all">Todos</option>';
            allAssignees.forEach(name => {
                assigneeFilter.innerHTML += `<option value="${name}">${name}</option>`;
            });
            assigneeFilter.value = allAssignees.includes(currentVal) ? currentVal : 'all';
        },
        
        initLongPressContextMenu: function() {
            let pressTimer;
            const startPress = (e) => {
                const targetEl = e.target.closest('.gantt-bar-container, .gantt-task-row');
                if (!targetEl) return;
                pressTimer = setTimeout(() => { e.preventDefault(); this.showContextMenu(e); }, 500);
            };
            const cancelPress = () => clearTimeout(pressTimer);
            const interactionArea = winEl.querySelector('.gantt-v2-container');
            interactionArea.addEventListener('touchstart', startPress, { passive: true });
            interactionArea.addEventListener('touchend', cancelPress);
            interactionArea.addEventListener('touchmove', cancelPress);
        },
        
        initKeyboardShortcuts: function() {
            winEl.addEventListener('keydown', e => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
                if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedTaskId) { e.preventDefault(); this.removeTask(this.selectedTaskId); }
                if (e.ctrlKey && e.key === 's') { e.preventDefault(); this.saveFile(); }
            });
        },

        getSampleData: function() {
            const today = new Date(); today.setUTCHours(0,0,0,0);
            const d = (days) => this.formatDate(this.addDays(today, days));
            return [
                {id:"parent1",name:"Fase de Planejamento",start:d(0),end:d(8),progress:0,status:"inprogress",type:"parent",collapsed:false,dependencies:"",assignee:""},
                {id:"task1",name:"Reunião de Kick-off",start:d(0),end:d(0),progress:100,status:"done",type:"milestone",parentId:"parent1",dependencies:"",assignee:"Ana"},
                {id:"task2",name:"Definição de Escopo e Requisitos",start:d(1),end:d(5),progress:80,status:"inprogress",type:"task",parentId:"parent1",dependencies:"task1",assignee:"Bruno"},
                {id:"task3",name:"Alocação de Recursos",start:d(6),end:d(8),progress:70,status:"inprogress",type:"task",parentId:"parent1",dependencies:"task2",assignee:"Ana"},
                {id:"parent2",name:"Fase de Design",start:d(9),end:d(19),progress:0,status:"todo",type:"parent",collapsed:false,dependencies:"",assignee:""},
                {id:"task4",name:"Design de UI/UX",start:d(9),end:d(16),progress:20,status:"todo",type:"task",parentId:"parent2",dependencies:"task3",assignee:"Carlos"},
                {id:"task5",name:"Revisão do Design",start:d(17),end:d(18),progress:0,status:"todo",type:"task",parentId:"parent2",dependencies:"task4",assignee:"Equipe"},
                {id:"task6",name:"Aprovação Final do Design",start:d(19),end:d(19),progress:0,status:"todo",type:"milestone",parentId:"parent2",dependencies:"task5",assignee:"Cliente"}
            ];
        },
        
        cleanup: () => {
            this.domNodeMap.clear();
            if (this.debouncedRenderAll) {
                // Clear any pending debounced calls
                clearTimeout(this.debouncedRenderAll.timeoutId);
            }
        }
    };

    initializeFileState(appState, "Novo Roadmap", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
