import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openGanttChart() {
    const uniqueSuffix = generateId('gantt');
    const winId = window.windowManager.createWindow('Roadmap do Projeto (Gantt 2.0)', '', {
        width: '90vw',
        height: '85vh',
        appType: 'gantt-chart',
        minWidth: 360, // Smaller min-width for mobile
        minHeight: 500
    });

    const content = `
        <style>
            :root {
                --gantt-header-height: 64px;
                --gantt-row-height: 40px;
                --gantt-parent-bar-color: #5D6D7E;
                --gantt-milestone-color: #A569BD;
                --critical-color: #e74c3c;
            }

            .gantt-chart-app-container {
                padding: 0 !important;
                background-color: var(--background);
                font-family: 'Inter', sans-serif;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden; /* Prevent body scroll */
            }

            .gantt-v2-container {
                display: flex;
                flex-grow: 1; /* Make it fill remaining space */
                width: 100%;
                overflow: hidden;
            }

            /* --- Barra de Ferramentas --- */
            .app-toolbar {
                display: flex;
                flex-wrap: wrap; /* Allow wrapping on small screens */
                gap: 6px;
                padding: 8px 12px;
                background-color: var(--toolbar-bg);
                border-bottom: 1px solid var(--separator-color);
                align-items: center; /* Align items vertically */
                flex-shrink: 0; /* Prevent toolbar from shrinking */
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
                white-space: nowrap; /* Prevent text from wrapping */
            }

            .app-button.active {
                background-color: var(--accent-color);
                color: white;
                border-color: var(--accent-color);
            }

            .app-button:hover:not(.active) {
                background-color: var(--button-hover-bg);
            }

            .app-button i {
                margin-right: 6px;
            }

            .toolbar-separator {
                border-left: 1px solid var(--separator-color);
                margin: 0 8px;
                height: 20px;
                align-self: center;
            }

            .toolbar-group {
                display: flex;
                flex-wrap: nowrap; /* Prevent groups from breaking */
                gap: 6px;
                margin: 0;
                align-items: center; /* Align items within the group */
            }

            /* --- Barra de Pesquisa e Filtros --- */
            .gantt-search-bar {
                padding: 8px 12px;
                background-color: var(--toolbar-bg);
                border-bottom: 1px solid var(--separator-color);
                display: flex;
                flex-wrap: wrap; /* Allow filters to wrap */
                gap: 10px;
                align-items: center;
                flex-shrink: 0; /* Prevent search bar from shrinking */
            }

            .gantt-filter-group {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .gantt-filter-label {
                font-size: 0.85em;
                color: var(--secondary-text-color);
                white-space: nowrap;
            }

            .gantt-filter-select, .app-input {
                background: var(--input-bg);
                border: 1px solid var(--button-border);
                border-radius: 4px;
                padding: 6px 8px;
                color: var(--text-color);
                font-size: 0.9em;
                box-sizing: border-box; /* Ensure padding doesn't increase width */
            }

            .app-input {
                flex: 1 1 150px; /* Allow input to grow and shrink */
                min-width: 150px;
            }

            .dependency-creation {
                stroke: var(--accent-color);
                stroke-width: 2;
                stroke-dasharray: 5,5;
            }

            .focus-mode-banner {
                background: var(--accent-color);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 10px;
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 10;
            }

            /* --- Painel da Tabela (Sidebar) --- */
            .gantt-sidebar {
                width: 45%;
                min-width: 350px;
                max-width: 70%;
                background-color: var(--window-bg);
                display: flex;
                flex-direction: column;
                border-right: 1px solid var(--separator-color);
                overflow: hidden; /* Important for containing children */
                flex-shrink: 0; /* Prevent sidebar from shrinking */
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
                padding: 10px;
                font-size: 0.75em;
                font-weight: 600;
                color: var(--secondary-text-color);
                border-bottom: 1px solid var(--separator-color);
                text-transform: uppercase;
                background-color: var(--window-bg);
                z-index: 2;
                flex-shrink: 0; /* Prevent header from shrinking */
            }

            .gantt-sidebar-body {
                flex-grow: 1;
                overflow-y: auto;
                position: relative;
                -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
            }

            .gantt-task-row {
                height: var(--gantt-row-height); /* Use height instead of min-height */
                border-bottom: 1px solid var(--separator-color);
                cursor: pointer;
                user-select: none;
                transition: background-color 0.2s;
            }

            .gantt-task-row:hover {
                background-color: var(--hover-highlight-color);
            }

            .gantt-task-row.selected {
                background-color: var(--selection-color);
            }

            .gantt-task-row.drag-over-top {
                border-top: 2px solid var(--accent-color);
            }

            .gantt-task-row.drag-over-bottom {
                border-bottom: 2px solid var(--accent-color);
            }

            .task-cell {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;
                align-items: center;
                height: 100%;
                box-sizing: border-box; /* Ensure padding is included */
            }

            .task-cell input, .task-cell select {
                width: 100%;
                background: transparent;
                border: none;
                color: var(--text-color);
                padding: 5px;
                border-radius: 4px;
                box-sizing: border-box;
                font-size: 0.9em;
                height: 100%; /* Make input fill the cell height */
            }

            .task-cell input[type="date"] {
                padding-right: 20px; /* Space for calendar icon */
            }
            .task-cell input[type="date"]::-webkit-calendar-picker-indicator {
                cursor: pointer;
                opacity: 0.7;
            }

            .task-cell input:focus, .task-cell select:focus {
                background: var(--input-bg);
                outline: 1px solid var(--accent-color);
            }

            .task-name-cell { gap: 5px; }
            .task-expander { width: 20px; text-align: center; cursor: pointer; color: var(--secondary-text-color); transition: transform 0.2s; flex-shrink: 0; }
            .task-expander.collapsed { transform: rotate(-90deg); }
            .task-icon { margin: 0 4px; flex-shrink: 0; }

            .avatar { width: 24px; height: 24px; border-radius: 50%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 600; margin-right: 8px; flex-shrink: 0; }

            .task-actions { display: flex; justify-content: center; gap: 5px; }
            .action-btn { padding: 4px; border-radius: 4px; cursor: pointer; color: var(--secondary-text-color); background: transparent; border: none; }
            .action-btn:hover { background-color: var(--hover-highlight-color); color: var(--text-color); }

            /* --- Divisor Redimensionável --- */
            .gantt-splitter {
                width: 5px;
                background: var(--separator-color);
                cursor: col-resize;
                transition: background-color 0.2s;
                flex-shrink: 0; /* Prevent splitter from shrinking */
            }

            .gantt-splitter:hover, .gantt-splitter.dragging {
                background: var(--accent-color);
            }

            /* --- Área do Gráfico --- */
            .gantt-chart-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
            .gantt-chart-header-container { flex-shrink: 0; z-index: 4; background-color: var(--toolbar-bg); overflow: hidden; }
            .gantt-timeline-header { white-space: nowrap; border-bottom: 1px solid var(--separator-color); display: flex; flex-direction: column; min-width: fit-content; }
            .gantt-timeline-upper, .gantt-timeline-lower { display: flex; }
            .gantt-timeline-unit { text-align: center; color: var(--secondary-text-color); font-size: 0.8em; border-right: 1px solid var(--separator-color); box-sizing: border-box; flex-shrink: 0; }
            .gantt-timeline-unit.upper { font-weight: 600; padding: 5px 0; border-top: 1px solid var(--separator-color); }
            .gantt-timeline-unit.lower { padding: 8px 0; }

            .gantt-chart-viewport {
                flex-grow: 1;
                overflow: auto;
                position: relative;
                -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
            }
            .gantt-chart-content { position: relative; }
            .gantt-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
            .gantt-grid-line, .gantt-row-line, .gantt-grid-weekend { position: absolute; }
            .gantt-today-marker { position: absolute; top: 0; width: 2px; height: 100%; background-color: var(--danger-color); z-index: 2; opacity: 0.9; }
            .gantt-grid-line { top: 0; width: 1px; height: 100%; background-color: var(--separator-color); opacity: 0.5; }
            .gantt-row-line { left: 0; height: 1px; width: 100%; background-color: var(--separator-color); }
            .gantt-grid-weekend { top: 0; height: 100%; background-color: var(--separator-color); opacity: 0.1; }

            .gantt-bar-container { position: absolute; height: var(--gantt-row-height); display: flex; align-items: center; z-index: 1; }
            .gantt-bar { position: relative; height: 28px; background-color: var(--accent-color); border-radius: 6px; display: flex; align-items: center; color: white; font-size: 0.85em; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: move; cursor: grab; transition: filter 0.2s; }
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

            .status-todo { background-color: #a9a9a9; }
            .status-inprogress { background-color: #4a6cf7; }
            .status-done { background-color: #28a745; }
            .status-blocked { background-color: #dc3545; }
            .gantt-bar.critical { border: 2px solid var(--critical-color); }

            #ganttSvgOverlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            .gantt-dependency-path { stroke: var(--secondary-text-color); stroke-width: 1.5; fill: none; opacity: 0.8; marker-end: url(#arrowhead_${uniqueSuffix}); }
            .gantt-critical-path { stroke: var(--critical-color) !important; stroke-width: 2.5 !important; opacity: 1 !important; }

            /* --- Tooltip, Context Menu, Status --- */
            .gantt-tooltip { position: fixed; background: var(--context-menu-bg); color: var(--text-color); border: 1px solid var(--separator-color); border-radius: 8px; padding: 10px; z-index: 10000; font-size: 0.9em; box-shadow: 0 5px 15px rgba(0,0,0,0.2); pointer-events: none; opacity: 0; transition: opacity 0.2s; max-width: 300px; }
            .gantt-tooltip.visible { opacity: 1; }
            .gantt-tooltip-title { font-weight: 600; margin-bottom: 8px; color: var(--accent-color); }
            .gantt-tooltip-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .gantt-tooltip-label { color: var(--secondary-text-color); margin-right: 15px; }
            .gantt-context-menu { position: absolute; background: var(--context-menu-bg); border: 1px solid var(--separator-color); border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 1000; min-width: 180px; }
            .gantt-context-menu-item { padding: 8px 16px; cursor: pointer; font-size: 0.9em; display: flex; align-items: center; }
            .gantt-context-menu-item:hover { background-color: var(--hover-highlight-color); }
            .gantt-context-menu-item i { margin-right: 8px; width: 16px; text-align: center; }
            .status-indicator { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }

            /* --- Responsive Design for Mobile --- */
            @media (max-width: 800px) {
                .app-toolbar {
                    flex-wrap: wrap; /* Allow buttons to wrap */
                    justify-content: space-between; /* Distribute items */
                }
                .app-toolbar .toolbar-group:not(:last-child) {
                    margin-bottom: 10px; /* Add spacing between wrapped groups */
                    width: 100%; /* Make groups take full width */
                    justify-content: space-around; /* Center items within the group */
                }
                .app-toolbar .toolbar-group:last-child {
                    width: 100%;
                    justify-content: center; /* Center the last group */
                }
                .toolbar-separator { display: none; }
                .gantt-v2-container {
                    flex-direction: column;
                    height: auto; /* Let content determine height */
                }
                .gantt-sidebar {
                    width: 100%;
                    max-width: 100%;
                    height: 40vh; /* Reduced height for mobile */
                    border-right: none;
                    border-bottom: 2px solid var(--separator-color);
                }
                .gantt-chart-area {
                    height: 60vh; /* Increased height for chart */
                }
                .gantt-splitter {
                    display: none;
                }
                .gantt-sidebar-header {
                    display: none; /* Hide rigid header on mobile */
                }
                .gantt-task-row {
                    height: auto; /* Allow rows to grow */
                    min-height: var(--gantt-row-height);
                    grid-template-columns: 1fr 1fr; /* Two column layout */
                    grid-template-rows: auto auto auto auto;
                    gap: 5px 10px;
                    padding: 10px;
                }
                .task-cell {
                    grid-column: span 1; /* Default to half-width */
                    white-space: normal; /* Allow wrapping */
                    height: auto; /* Adjust height automatically */
                    padding: 8px 0; /* Add vertical padding */
                }
                .task-name-cell {
                    grid-column: 1 / -1; /* Name cell spans full width */
                    font-weight: bold;
                }
                .task-cell.task-actions {
                    grid-column: 1 / -1;
                    justify-content: flex-end;
                }
                .app-button span { display: none; } /* Hide text on buttons */
                .app-button i { margin-right: 0; } /* Remove margin when text is hidden */
                .app-button { padding: 8px 10px; } /* More touch-friendly */

                .gantt-search-bar {
                    flex-direction: column;
                    align-items: stretch;
                }
                .gantt-filter-group {
                    width: 100%;
                    justify-content: space-between;
                }
                .gantt-filter-label {
                    flex-shrink: 0; /* Prevent label from shrinking */
                }
                .gantt-filter-select, .app-input {
                    width: auto; /* Allow select/input to take available space */
                    flex-grow: 1;
                }
            }
        </style>

        <div class="gantt-chart-app-container">
            <div class="app-toolbar">
                ${getStandardAppToolbarHTML()}
                <div class="toolbar-group">
                    <button id="addTaskBtn_${uniqueSuffix}" class="app-button" title="Adicionar Tarefa"><i class="fas fa-plus-circle"></i> <span>Tarefa</span></button>
                    <button id="addMilestoneBtn_${uniqueSuffix}" class="app-button" title="Adicionar Marco"><i class="fas fa-gem"></i> <span>Marco</span></button>
                    <button id="addParentBtn_${uniqueSuffix}" class="app-button" title="Adicionar Grupo"><i class="fas fa-folder"></i> <span>Grupo</span></button>
                </div>

                <div class="toolbar-separator"></div>

                <div class="toolbar-group" id="viewModeGroup_${uniqueSuffix}">
                    <button data-view="day" class="app-button" title="Visão Diária"><i class="fas fa-calendar-day"></i> <span>Dia</span></button>
                    <button data-view="week" class="app-button" title="Visão Semanal"><i class="fas fa-calendar-week"></i> <span>Semana</span></button>
                    <button data-view="month" class="app-button" title="Visão Mensal"><i class="fas fa-calendar-alt"></i> <span>Mês</span></button>
                </div>

                <div class="toolbar-separator"></div>

                <div class="toolbar-group">
                    <button id="zoomOutBtn_${uniqueSuffix}" class="app-button" title="Reduzir Zoom"><i class="fas fa-search-minus"></i></button>
                    <button id="zoomInBtn_${uniqueSuffix}" class="app-button" title="Aumentar Zoom"><i class="fas fa-search-plus"></i></button>
                    <button id="todayBtn_${uniqueSuffix}" class="app-button" title="Ir para Hoje"><i class="fas fa-calendar-day"></i></button>
                </div>

                <div class="toolbar-separator"></div>

                <div class="toolbar-group">
                    <button id="linkTasksBtn_${uniqueSuffix}" class="app-button" title="Vincular Tarefas"><i class="fas fa-link"></i></button>
                    <button id="criticalPathBtn_${uniqueSuffix}" class="app-button" title="Mostrar Caminho Crítico"><i class="fas fa-bolt"></i></button>
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
        showCriticalPath: true,
        isSyncingScroll: false, // Flag to prevent scroll feedback loop

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
            viewMode: 'day', // 'day', 'week', 'month'
            unitWidths: { day: 40, week: 100, month: 200 },
            get unitWidth() { return this.unitWidths[this.viewMode]; },
            totalWidth: 0
        },
        flatTaskOrder: [],
        filteredTasks: [],

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
            setupAppToolbarActions(this);

            // Toolbar Buttons
            winEl.querySelector(`#addTaskBtn_${uniqueSuffix}`).onclick = () => this.addTask();
            winEl.querySelector(`#addMilestoneBtn_${uniqueSuffix}`).onclick = () => this.addTask(true);
            winEl.querySelector(`#addParentBtn_${uniqueSuffix}`).onclick = () => this.addParentTask();
            winEl.querySelector(`#zoomOutBtn_${uniqueSuffix}`).onclick = () => this.zoomOut();
            winEl.querySelector(`#zoomInBtn_${uniqueSuffix}`).onclick = () => this.zoomIn();
            winEl.querySelector(`#todayBtn_${uniqueSuffix}`).onclick = () => this.goToToday();
            winEl.querySelector(`#linkTasksBtn_${uniqueSuffix}`).onclick = () => this.promptForDependency(this.selectedTaskId);
            winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`).onclick = () => this.toggleCriticalPath();

            // View Mode Buttons
            winEl.querySelector(`#viewModeGroup_${uniqueSuffix}`).addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (button && button.dataset.view) {
                    this.timeline.viewMode = button.dataset.view;
                    this.renderAll();
                }
            });

            // Event Listeners
            // ** FIX for input bug: Use separate events for live typing and final changes **
            this.sidebarBody.addEventListener('input', (e) => this.handleSidebarLiveInput(e));
            this.sidebarBody.addEventListener('change', (e) => this.handleSidebarFinalInput(e));

            this.sidebarBody.addEventListener('click', (e) => this.handleSidebarClick(e));
            this.chartViewport.addEventListener('scroll', this.syncScroll.bind(this));
            this.sidebarBody.addEventListener('scroll', this.syncScroll.bind(this));

            // Touch & Mouse event handling for chart interactions
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

            // Load some sample data if it's a new file
            if (!this.fileId) {
                this.tasks = this.getSampleData();
            }

            this.renderAll();
            this.updateAssigneeFilter();
        },

        renderAll: function() {
            // Update view mode button states
            winEl.querySelectorAll(`#viewModeGroup_${uniqueSuffix} button`).forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === this.timeline.viewMode);
            });
            winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`).classList.toggle('active', this.showCriticalPath);

            this.applyFilters();
            this.updateParentTasks();
            this.calculateTimeline();
            this.flatTaskOrder = this.getFlatTaskOrder();

            this.renderSidebar();
            this.renderChart();
            this.renderDependencies();
            if (this.showCriticalPath) {
                this.calculateAndDrawCriticalPath();
            }
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
            return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
        },
        formatDate: (date) => date.toISOString().split('T')[0],
        formatDateLocale: (date) => date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),

        // --- Timeline & View Modes ---
        calculateTimeline: function() {
            if (this.tasks.length === 0) {
                const today = new Date();
                this.timeline.startDate = this.addDays(today, -30);
                this.timeline.endDate = this.addDays(today, 60);
                return;
            }

            let minDate = null, maxDate = null;
            this.tasks.forEach(t => {
                if (t.type === 'parent' && t.collapsed) return;
                const start = this.parseDate(t.start);
                const end = t.end ? this.parseDate(t.end) : start;
                if (!minDate || start < minDate) minDate = start;
                if (!maxDate || end > maxDate) maxDate = end;
            });

            // Ensure minDate and maxDate are valid before proceeding
            if (!minDate || !maxDate) {
                const today = new Date();
                this.timeline.startDate = this.addDays(today, -30);
                this.timeline.endDate = this.addDays(today, 60);
                return;
            }

            this.timeline.startDate = this.addDays(minDate, -7);
            this.timeline.endDate = this.addDays(maxDate, 30);
        },

        zoomIn: function() {
            this.timeline.unitWidths[this.timeline.viewMode] = Math.min(500, this.timeline.unitWidths[this.timeline.viewMode] + 10);
            this.renderChart();
        },

        zoomOut: function() {
            const minWidth = { day: 20, week: 50, month: 80 };
            this.timeline.unitWidths[this.timeline.viewMode] = Math.max(minWidth[this.timeline.viewMode], this.timeline.unitWidths[this.timeline.viewMode] - 10);
            this.renderChart();
        },

        getUnitOffset: function(date) {
            const startDate = this.timeline.startDate;
            switch(this.timeline.viewMode) {
                case 'week':
                    return this.daysBetween(startDate, date) / 7;
                case 'month':
                    // Calculate month difference carefully, handling year changes
                    const startYear = startDate.getUTCFullYear();
                    const startMonth = startDate.getUTCMonth();
                    const dateYear = date.getUTCFullYear();
                    const dateMonth = date.getUTCMonth();
                    return (dateYear - startYear) * 12 + (dateMonth - startMonth);
                default: // day
                    return this.daysBetween(startDate, date);
            }
        },

        goToToday: function() {
            const today = new Date();
            const todayOffset = this.getUnitOffset(today) * this.timeline.unitWidth;
            this.chartViewport.scrollLeft = todayOffset - this.chartViewport.offsetWidth / 2;
        },

        toggleCriticalPath: function() {
            this.showCriticalPath = !this.showCriticalPath;
            winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`).classList.toggle('active', this.showCriticalPath);
            this.renderAll();
        },

        renderSidebar: function() {
            let editingState = null;
            if (document.activeElement && document.activeElement.closest('.gantt-sidebar-body')) {
                const input = document.activeElement;
                const row = input.closest('.gantt-task-row');
                if (row) {
                    editingState = {
                        taskId: row.dataset.taskId,
                        field: input.dataset.field,
                        selectionStart: input.selectionStart,
                        selectionEnd: input.selectionEnd,
                    };
                }
            }

            this.sidebarBody.innerHTML = '';
            const renderTaskNode = (task, level) => {
                const row = document.createElement('div');
                row.className = 'gantt-task-row';
                if (this.selectedTaskId === task.id) row.classList.add('selected');
                row.dataset.taskId = task.id;

                const children = this.tasks.filter(t => t.parentId === task.id);
                const isParent = task.type === 'parent' || children.length > 0;
                // Ensure type is correctly set for rendering
                if (isParent && task.type !== 'parent') {
                    task.type = 'parent';
                } else if (!isParent && task.type === 'parent') {
                    task.type = 'task'; // Reset if it was a parent but has no children
                }

                const expanderHTML = isParent ? `<span class="task-expander ${task.collapsed ? 'collapsed' : ''}"><i class="fas fa-angle-down"></i></span>` : '<span class="task-expander"></span>';
                const icon = task.type === 'milestone' ? 'fa-gem' : isParent ? 'fa-folder' : 'fa-tasks';
                const duration = isParent ? '-' : (this.daysBetween(this.parseDate(task.start), this.parseDate(task.end)) + 1) + 'd';

                // Ensure progress is a number between 0 and 100
                const safeProgress = Math.max(0, Math.min(100, parseInt(task.progress) || 0));
                task.progress = safeProgress; // Update task object to ensure consistency

                row.innerHTML = `
                    <div class="task-cell task-name-cell" style="padding-left: ${level * 25 + 5}px;">
                        ${expanderHTML}
                        <i class="fas ${icon} task-icon"></i>
                        <input type="text" value="${task.name}" data-field="name" title="${task.name}">
                    </div>
                    <div class="task-cell"><span>${duration}</span></div>
                    <div class="task-cell">
                        <input type="number" min="0" max="100" value="${safeProgress}" data-field="progress">
                    </div>
                    <div class="task-cell" title="${task.assignee || ''}">
                        ${this.generateAvatar(task.assignee)}
                        <input type="text" value="${task.assignee || ''}" data-field="assignee" placeholder="-">
                    </div>
                    <div class="task-cell">
                        <input type="date" value="${task.start}" data-field="start">
                    </div>
                    <div class="task-cell">
                        <input type="date" value="${task.end}" data-field="end" ${task.type === 'milestone' ? 'readonly' : ''}>
                    </div>
                    <div class="task-cell task-actions">
                        <button class="action-btn" data-action="remove" title="Remover"><i class="fas fa-trash"></i></button>
                        <button class="action-btn" data-action="add-child" title="Adicionar Subtarefa"><i class="fas fa-plus"></i></button>
                    </div>
                `;
                this.sidebarBody.appendChild(row);

                if (isParent && !task.collapsed) {
                    // Sort children by start date before rendering
                    children.sort((a,b) => this.parseDate(a.start) - this.parseDate(b.start))
                        .forEach(child => renderTaskNode(child, level + 1));
                }
            };

            // Get root tasks based on filtered list and ensure correct order
            const rootTasks = this.filteredTasks.length > 0
                ? this.filteredTasks.filter(t => !t.parentId)
                : this.tasks.filter(t => !t.parentId);

            // Sort root tasks by start date before rendering
            rootTasks.sort((a,b) => this.parseDate(a.start) - this.parseDate(b.start));

            rootTasks.forEach(task => renderTaskNode(task, 0));

            if (editingState) this.restoreEditingState(editingState);
        },

        renderChart: function() {
            if (!this.timeline.startDate) return;

            // Clear previous content
            this.headerContainer.innerHTML = '';
            this.gridEl.innerHTML = '';
            this.chartContent.querySelectorAll('.gantt-bar-container, .gantt-today-marker').forEach(el => el.remove());

            // 1. Render Header and Grid based on ViewMode
            this.renderTimelineHeader();

            // 2. Render Bars
            this.flatTaskOrder.forEach((taskId, index) => {
                const task = this.tasks.find(t => t.id === taskId);
                // Skip rendering if task is not found or its parent is collapsed
                if (!task || (task.parentId && this.tasks.find(p => p.id === task.parentId)?.collapsed)) return;

                const rowLine = document.createElement('div');
                rowLine.className = 'gantt-row-line';
                rowLine.style.top = `${index * 40 + 39}px`; // +39 to align with bottom of header row
                this.gridEl.appendChild(rowLine);

                const taskStart = this.parseDate(task.start);
                const left = this.getUnitOffset(taskStart) * this.timeline.unitWidth;

                const barContainer = document.createElement('div');
                barContainer.className = 'gantt-bar-container';
                barContainer.style.top = `${index * 40}px`; // Align with sidebar row top
                barContainer.dataset.taskId = task.id;
                if (task.id === this.selectedTaskId) barContainer.classList.add('selected');

                if (task.type === 'milestone') {
                    // Center milestone visually
                    const milestoneLeft = left - 12; // Half of milestone width (24px)
                    barContainer.style.left = `${milestoneLeft}px`;
                    barContainer.style.width = '24px'; // Fixed width for milestone
                    barContainer.innerHTML = `<div class="gantt-milestone"></div>`;
                } else {
                    const taskEnd = this.parseDate(task.end);
                    const durationInDays = this.daysBetween(taskStart, taskEnd) + 1;
                    let width;
                    switch(this.timeline.viewMode) {
                        case 'week': width = (durationInDays / 7) * this.timeline.unitWidth; break;
                        case 'month': width = (durationInDays / 30.4) * this.timeline.unitWidth; break; // Approx. month length
                        default: width = durationInDays * this.timeline.unitWidth;
                    }

                    barContainer.style.left = `${left}px`;
                    barContainer.style.width = `${Math.max(width, 2)}px`; // Min width for visibility

                    const barClass = task.type === 'parent' ? 'gantt-bar-parent' : `status-${task.status || 'todo'}`;
                    // Ensure progress is a number between 0 and 100 for rendering
                    const safeProgress = Math.max(0, Math.min(100, parseInt(task.progress) || 0));

                    barContainer.innerHTML = `
                        <div class="gantt-bar ${barClass}">
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle left"></div>' : ''}
                            <div class="gantt-bar-progress" style="width: ${safeProgress}%"></div>
                            <span class="gantt-bar-label">${task.name}</span>
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle right"></div>' : ''}
                        </div>
                    `;
                }
                this.chartContent.appendChild(barContainer);
            });

            // 3. Render Today Marker
            const today = new Date();
            if (today >= this.timeline.startDate && today <= this.timeline.endDate) {
                const todayOffset = this.getUnitOffset(today) * this.timeline.unitWidth;
                const todayMarker = document.createElement('div');
                todayMarker.className = 'gantt-today-marker';
                todayMarker.style.left = `${todayOffset}px`;
                // Set height to encompass all rendered rows
                todayMarker.style.height = `${this.flatTaskOrder.length * 40}px`;
                this.chartContent.appendChild(todayMarker);
            }

            // 4. Adjust content size
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

            let totalUnits = 0;
            let currentDate = new Date(startDate);

            const addUnit = (parent, text, width, className) => {
                const el = document.createElement('div');
                el.className = `gantt-timeline-unit ${className}`;
                el.textContent = text;
                el.style.width = `${width}px`;
                parent.appendChild(el);
            };

            if (viewMode === 'day') {
                let currentMonth = -1;
                let monthUnit = null;
                let dayCountInMonth = 0;
                let currentYear = -1;

                while (currentDate <= endDate) {
                    const month = currentDate.getUTCMonth();
                    const year = currentDate.getUTCFullYear();

                    if (year !== currentYear) {
                        if (monthUnit) monthUnit.style.width = `${dayCountInMonth * unitWidth}px`;
                        currentYear = year;
                        currentMonth = -1; // Reset month for the new year
                        monthUnit = null;
                        dayCountInMonth = 0;
                    }

                    if (month !== currentMonth) {
                        if (monthUnit) monthUnit.style.width = `${dayCountInMonth * unitWidth}px`;
                        currentMonth = month;
                        const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                        monthUnit = document.createElement('div');
                        monthUnit.className = 'gantt-timeline-unit upper';
                        monthUnit.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                        upperRow.appendChild(monthUnit);
                        dayCountInMonth = 0;
                    }

                    addUnit(lowerRow, currentDate.getUTCDate(), unitWidth, 'lower');
                    const dayOfWeek = currentDate.getUTCDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
                        const weekendEl = document.createElement('div');
                        weekendEl.className = 'gantt-grid-weekend';
                        weekendEl.style.left = `${totalUnits * unitWidth}px`;
                        weekendEl.style.width = `${unitWidth}px`;
                        this.gridEl.appendChild(weekendEl);
                    }
                    const gridLine = document.createElement('div');
                    gridLine.className = 'gantt-grid-line';
                    gridLine.style.left = `${totalUnits * unitWidth}px`;
                    this.gridEl.appendChild(gridLine);

                    currentDate = this.addDays(currentDate, 1);
                    totalUnits++;
                    dayCountInMonth++;
                }
                // Set width for the last month
                if (monthUnit) monthUnit.style.width = `${dayCountInMonth * unitWidth}px`;

            } else if (viewMode === 'week') {
                // Logic for Week View Header
                let currentYear = startDate.getUTCFullYear();
                while (currentDate <= endDate) {
                    // Simple week numbering - might not be perfectly accurate for ISO weeks
                    const week = Math.ceil((this.daysBetween(new Date(`${currentYear}-01-01T00:00:00Z`), currentDate) + 1) / 7);
                    addUnit(upperRow, currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }), unitWidth, 'upper');
                    addUnit(lowerRow, `Semana ${week}`, unitWidth, 'lower');
                    const gridLine = document.createElement('div');
                    gridLine.className = 'gantt-grid-line';
                    gridLine.style.left = `${totalUnits * unitWidth}px`;
                    this.gridEl.appendChild(gridLine);
                    currentDate = this.addDays(currentDate, 7);
                    totalUnits++;
                    if (currentDate.getUTCFullYear() > currentYear) {
                         currentYear = currentDate.getUTCFullYear();
                    }
                }
            } else if (viewMode === 'month') {
                // Logic for Month View Header
                 let currentYear = startDate.getUTCFullYear();
                 while (currentDate <= endDate) {
                    // Display year if it changes
                    if (currentDate.getUTCFullYear() !== currentYear) {
                        currentYear = currentDate.getUTCFullYear();
                        addUnit(upperRow, currentYear, unitWidth, 'upper');
                    } else if (upperRow.children.length === 0) {
                        // Ensure year is shown if it's the only month
                         addUnit(upperRow, currentYear, unitWidth, 'upper');
                    }
                    addUnit(lowerRow, currentDate.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' }), unitWidth, 'lower');
                    const gridLine = document.createElement('div');
                    gridLine.className = 'gantt-grid-line';
                    gridLine.style.left = `${totalUnits * unitWidth}px`;
                    this.gridEl.appendChild(gridLine);
                    currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                    totalUnits++;
                }
            }

            this.timeline.totalWidth = totalUnits * unitWidth;
            headerEl.appendChild(upperRow);
            headerEl.appendChild(lowerRow);
            this.headerContainer.appendChild(headerEl);
        },

        renderDependencies: function() {
            const svgNS = 'http://www.w3.org/2000/svg';
            // Clear previous dependency paths
            this.svgOverlay.querySelectorAll('path').forEach(p => p.remove());

            const barElements = {}; // Cache bar element positions
            this.chartContent.querySelectorAll('.gantt-bar-container').forEach(b => {
                barElements[b.dataset.taskId] = b;
            });

            const getTaskIndex = (taskId) => this.flatTaskOrder.indexOf(taskId);

            this.tasks.forEach(task => {
                if(task.dependencies) {
                    const deps = task.dependencies.split(',').map(d => d.trim()).filter(Boolean);
                    deps.forEach(depId => {
                        const predecessor = this.tasks.find(t => t.id === depId);
                        // Ensure both predecessor and successor bars exist and are visible
                        if(!predecessor || !barElements[task.id] || !barElements[predecessor.id]) return;

                        const fromEl = barElements[predecessor.id];
                        const toEl = barElements[task.id];

                        const fromIndex = getTaskIndex(predecessor.id);
                        const toIndex = getTaskIndex(task.id);
                        // Ensure tasks are in the current flat order (not collapsed parents)
                        if (fromIndex === -1 || toIndex === -1) return;

                        // Calculate connection points
                        const fromX = fromEl.offsetLeft + (predecessor.type === 'milestone' ? 12 : fromEl.offsetWidth); // End of predecessor bar/milestone
                        const fromY = fromIndex * 40 + 20; // Center of the predecessor row
                        const toX = toEl.offsetLeft + (task.type === 'milestone' ? 12 : 0); // Start of successor bar/milestone
                        const toY = toIndex * 40 + 20; // Center of the successor row

                        // Create SVG path for dependency line
                        const path = document.createElementNS(svgNS, 'path');
                        // Bezier curve for smoother lines, adjusted for better visualization
                        const cx1 = fromX + Math.abs(toX - fromX) * 0.3;
                        const cy1 = fromY;
                        const cx2 = toX - Math.abs(toX - fromX) * 0.3;
                        const cy2 = toY;
                        const d = `M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`;
                        path.setAttribute('d', d);
                        path.setAttribute('class', 'gantt-dependency-path');
                        path.dataset.fromId = predecessor.id;
                        path.dataset.toId = task.id;
                        this.svgOverlay.appendChild(path);
                    });
                }
            });
        },

        calculateAndDrawCriticalPath: function() {
            // Filter out parent tasks for critical path calculation
            const tasks = this.tasks.filter(t => t.type !== 'parent');
            if (tasks.length === 0) return;

            // Initialize task properties for calculation
            tasks.forEach(t => {
                t.earlyStart = 0;
                t.earlyFinish = 0;
                t.lateStart = Infinity;
                t.lateFinish = Infinity;
                // Calculate duration in days
                t.duration = this.daysBetween(this.parseDate(t.start), this.parseDate(t.end)) + 1;
            });

            const taskMap = new Map(tasks.map(t => [t.id, t]));
            // Adjacency lists for graph traversal
            const adj = new Map(tasks.map(t => [t.id, []])); // Successors
            const revAdj = new Map(tasks.map(t => [t.id, []])); // Predecessors

            // Build adjacency lists based on dependencies
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

            // Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
            const forwardPassQueue = tasks.filter(t => !t.dependencies || t.dependencies.trim() === '');
            const processedForward = new Set(); // Track processed tasks for correct queuing

            while(forwardPassQueue.length > 0){
                const u = forwardPassQueue.shift(); // Get task from queue
                if(processedForward.has(u.id)) continue; // Skip if already processed
                processedForward.add(u.id);

                u.earlyFinish = u.earlyStart + u.duration; // EF = ES + Duration

                // Update ES of successors
                (adj.get(u.id) || []).forEach(vId => {
                    const v = taskMap.get(vId);
                    v.earlyStart = Math.max(v.earlyStart, u.earlyFinish); // ES of successor is max EF of predecessors

                    // Check if all predecessors of 'v' have been processed before adding 'v' to queue
                    const allDepsProcessed = (v.dependencies || '')
                        .split(',')
                        .map(d => d.trim())
                        .filter(d => d)
                        .every(depId => processedForward.has(depId));

                    if(allDepsProcessed && !processedForward.has(v.id)) {
                        forwardPassQueue.push(v);
                    }
                });
            }

            // Determine overall project finish time
            const projectFinishTime = Math.max(0, ...tasks.map(t => t.earlyFinish));
            // Initialize Late Finish (LF) for all tasks to project finish time
            tasks.forEach(t => t.lateFinish = projectFinishTime);

            // Backward Pass: Calculate Late Finish (LF) and Late Start (LS)
            // Start with tasks that have no successors
            const backwardPassQueue = tasks.filter(t => !(adj.get(t.id) || []).length);
            const processedBackward = new Set(); // Track processed tasks for correct queuing

            while(backwardPassQueue.length > 0){
                const u = backwardPassQueue.shift(); // Get task from queue
                if(processedBackward.has(u.id)) continue; // Skip if already processed
                processedBackward.add(u.id);

                u.lateStart = u.lateFinish - u.duration; // LS = LF - Duration

                // Update LF of predecessors
                (revAdj.get(u.id) || []).forEach(pId => {
                    const p = taskMap.get(pId);
                    p.lateFinish = Math.min(p.lateFinish, u.lateStart); // LF of predecessor is min LS of successors

                    // Check if all successors of 'p' have been processed before adding 'p' to queue
                    const allSuccsProcessed = (adj.get(p.id) || []).every(succId => processedBackward.has(succId));

                    if(allSuccsProcessed && !processedBackward.has(p.id)) {
                        backwardPassQueue.push(p);
                    }
                });
            }

            // Identify critical path tasks (Slack = LS - ES or LF - EF = 0)
            const criticalPathTaskIds = new Set();
            // Remove existing critical path highlighting
            this.chartContent.querySelectorAll('.gantt-bar.critical').forEach(el => el.classList.remove('critical'));

            tasks.forEach(t => {
                const slack = t.lateStart - t.earlyStart;
                // Tasks with near-zero slack are considered critical
                if (slack < 0.01) {
                    criticalPathTaskIds.add(t.id);
                    const barEl = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${t.id}"] .gantt-bar`);
                    if (barEl) barEl.classList.add('critical');
                }
            });

            // Apply critical path styling to dependency lines
            this.svgOverlay.querySelectorAll('.gantt-dependency-path').forEach(path => {
                const { fromId, toId } = path.dataset;
                // A dependency line is critical if both its predecessor and successor are critical tasks
                if (criticalPathTaskIds.has(fromId) && criticalPathTaskIds.has(toId)) {
                    path.classList.add('gantt-critical-path');
                } else {
                    path.classList.remove('gantt-critical-path');
                }
            });
        },

        addTask: function(isMilestone = false) {
            const today = new Date();
            const start = this.formatDate(today);
            // Set end date based on milestone or task, default to 4 days for tasks
            const end = this.formatDate(this.addDays(today, isMilestone ? 0 : 4));

            const newTask = {
                id: generateId('task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start, end,
                assignee: '',
                status: 'todo',
                progress: 0,
                dependencies: '',
                type: isMilestone ? 'milestone' : 'task',
                parentId: this.selectedTaskId || null // Assign to selected task as parent if any
            };

            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
        },

        addParentTask: function() {
            const today = new Date();
            const start = this.formatDate(today);
            const end = this.formatDate(this.addDays(today, 7)); // Default duration for group

            const newTask = {
                id: generateId('parent'),
                name: 'Novo Grupo',
                start, end,
                assignee: '',
                status: 'todo', // Parents don't usually have status, but setting default
                progress: 0, // Progress for parent is calculated from children
                dependencies: '',
                type: 'parent',
                collapsed: false, // Initially expanded
                parentId: null // Root level group
            };

            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
        },

        removeTask: function(taskId) {
            // Filter out the task and any of its children
            this.tasks = this.tasks.filter(t => t.id !== taskId && t.parentId !== taskId);
            // Remove dependencies pointing to the deleted task
            this.tasks.forEach(t => {
                if (t.dependencies) {
                    t.dependencies = t.dependencies.split(',')
                        .map(d => d.trim())
                        .filter(d => d !== taskId) // Remove the dependency ID
                        .join(',');
                }
            });
            // Deselect if the deleted task was selected
            if (this.selectedTaskId === taskId) this.selectedTaskId = null;
            this.markDirty();
            this.renderAll();
        },

        updateParentTasks: function() {
            // Recursive function to update parent task properties (start, end, progress)
            const processNode = (task) => {
                const children = this.tasks.filter(c => c.parentId === task.id);
                if (children.length > 0) {
                    children.forEach(processNode); // Recursively process children first

                    // Calculate start/end dates and progress from children
                    const startDates = children.map(c => this.parseDate(c.start));
                    const endDates = children.map(c => this.parseDate(c.end));

                    task.start = this.formatDate(new Date(Math.min(...startDates)));
                    task.end = this.formatDate(new Date(Math.max(...endDates)));

                    // Calculate average progress of children, ignoring milestones
                    const taskChildren = children.filter(c => c.type !== 'milestone');
                    if (taskChildren.length > 0) {
                        const totalProgress = taskChildren.reduce((sum, c) => sum + (c.progress || 0), 0);
                        task.progress = Math.round(totalProgress / taskChildren.length);
                    } else {
                        task.progress = 0; // Default to 0 if no progressable children
                    }
                }
            };
            // Process all parent tasks (root level first, then nested)
            this.tasks.filter(t => t.type === 'parent').forEach(processNode);
        },

        // --- Event Handlers (Refactored) ---
        handleSidebarLiveInput: function(e) {
            const input = e.target;
            const row = input.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = input.dataset.field;
            const task = this.tasks.find(t => t.id === taskId);

            if (task && (field === 'name' || field === 'progress' || field === 'assignee')) {
                task[field] = input.value; // Update task object directly
                this.markDirty();

                // Partial DOM update for immediate feedback without full re-render
                if (field === 'name') {
                    const barLabel = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${taskId}"] .gantt-bar-label`);
                    if (barLabel) barLabel.textContent = input.value;
                } else if (field === 'progress') {
                    const progressBar = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${taskId}"] .gantt-bar-progress`);
                    // Ensure progress is clamped between 0 and 100
                    const safeProgress = Math.max(0, Math.min(100, parseInt(input.value) || 0));
                    input.value = safeProgress; // Update input value to reflect clamped value
                    if (progressBar) progressBar.style.width = `${safeProgress}%`;
                }
            }
        },

        handleSidebarFinalInput: function(e) {
            const input = e.target;
            const row = input.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = input.dataset.field;
            const task = this.tasks.find(t => t.id === taskId);

            if (task) {
                // Update task properties, ensuring valid types (e.g., dates)
                if (field === 'start' || field === 'end') {
                    task[field] = this.formatDate(new Date(input.value)); // Reformat to ensure consistency
                } else if (field === 'progress') {
                    task[field] = Math.max(0, Math.min(100, parseInt(input.value) || 0)); // Clamp progress
                } else {
                    task[field] = input.value; // Direct assignment for name, assignee etc.
                }

                this.markDirty();

                // A full re-render is often needed for date changes or assignee updates (affects filters/avatars)
                if (field === 'start' || field === 'end' || field === 'assignee') {
                    if (field === 'assignee') this.updateAssigneeFilter();
                    this.renderAll(); // Re-render everything to reflect changes accurately
                } else {
                    // For other fields like name/progress, a partial update might suffice, but a full render ensures consistency
                    this.renderAll();
                }
            }
        },

        handleSidebarClick: function(e) {
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;

            const taskId = row.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);

            // Handle expander click for parent tasks
            if (e.target.closest('.task-expander') && task && task.type === 'parent') {
                task.collapsed = !task.collapsed;
                this.markDirty();
                this.renderAll(); // Re-render to show/hide children
                return;
            }

            // Handle action button clicks (remove, add-child)
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                if (action === 'remove') {
                    if (confirm(`Tem certeza que deseja remover a tarefa "${task.name}" e todas as suas sub-tarefas?`)) {
                        this.removeTask(taskId);
                    }
                } else if (action === 'add-child') {
                    this.selectedTaskId = taskId; // Set current task as parent for new task
                    this.addTask();
                }
                return; // Prevent row selection if an action button was clicked
            }

            // Handle row selection (if not an input or action button)
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
                this.selectedTaskId = taskId;
                this.renderAll(); // Re-render to update selection highlight
            }
        },

        getEventCoords: (e) => {
            // Helper to get coordinates from mouse or touch events
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY, pageX: e.touches[0].pageX, pageY: e.touches[0].pageY };
            }
            return { x: e.clientX, y: e.clientY, pageX: e.pageX, pageY: e.pageY };
        },

        handleBarInteractionStart: function(e) {
            const bar = e.target.closest('.gantt-bar, .gantt-milestone');
            if (!bar) return; // Ignore clicks not on bars/milestones
            if (e.type === 'touchstart') e.preventDefault(); // Prevent default scroll on touch

            const container = bar.closest('.gantt-bar-container');
            const taskId = container.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if (!task || task.type === 'parent') return; // Cannot drag parent bars

            // Select the task and update sidebar
            this.selectedTaskId = taskId;
            this.renderSidebar(); // Update sidebar to reflect selection

            const coords = this.getEventCoords(e);
            const initialX = coords.x;
            const initialStart = this.parseDate(task.start);
            const initialEnd = this.parseDate(task.end);
            // Determine if a handle (left/right edge) was clicked for resizing
            const handle = e.target.classList.contains('gantt-bar-handle') ? (e.target.classList.contains('left') ? 'left' : 'right') : null;

            // Get initial position of the bar relative to the chart content
            const chartRect = this.chartContent.getBoundingClientRect();
            const initialBarLeft = container.offsetLeft;
            // Store initial bar width for resizing calculations
            const initialBarWidth = container.offsetWidth;

            // Mouse move handler for dragging/resizing
            const onMouseMove = (moveE) => {
                const moveCoords = this.getEventCoords(moveE);
                const deltaX = moveCoords.x - initialX; // Calculate horizontal displacement

                // Convert horizontal displacement back to days based on current zoom level (unitWidth)
                let daysDelta;
                switch(this.timeline.viewMode) {
                    case 'week': daysDelta = Math.round(deltaX / this.timeline.unitWidth * 7); break;
                    case 'month': daysDelta = Math.round(deltaX / this.timeline.unitWidth * 30.4); break; // Approx. month length
                    default: daysDelta = Math.round(deltaX / this.timeline.unitWidth); // Day view
                }

                let newStart = initialStart;
                let newEnd = initialEnd;

                if (handle === 'left') {
                    // Resizing from the left edge
                    newStart = this.addDays(initialStart, daysDelta);
                    // Ensure new start date is not after the end date
                    if (newStart > initialEnd) newStart = initialEnd;
                } else if (handle === 'right') {
                    // Resizing from the right edge
                    newEnd = this.addDays(initialEnd, daysDelta);
                    // Ensure new end date is not before the start date
                    if (newEnd < initialStart) newEnd = initialStart;
                } else {
                    // Moving the entire task
                    const newStartDate = this.addDays(initialStart, daysDelta);
                    const duration = this.daysBetween(initialStart, initialEnd);
                    newStart = newStartDate;
                    newEnd = this.addDays(newStartDate, duration);
                }

                // Update task dates, ensuring they remain valid
                task.start = this.formatDate(newStart);
                task.end = this.formatDate(newEnd);

                this.renderAll(); // Re-render chart and sidebar to reflect changes
            };

            // Mouse up handler to finalize the drag/resize operation
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('touchmove', onMouseMove);
                document.removeEventListener('touchend', onMouseUp);
                this.markDirty(); // Mark the file as modified
            };

            // Attach event listeners for mouse and touch interactions
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchmove', onMouseMove, { passive: false });
            document.addEventListener('touchend', onMouseUp);
        },

        handleBarMouseOver: function(e) {
            const barContainer = e.target.closest('.gantt-bar-container');
            if (barContainer) {
                const taskId = barContainer.dataset.taskId;
                const task = this.tasks.find(t => t.id === taskId);
                if (task) this.showTooltip(this.getEventCoords(e), task); // Show tooltip with task details
            }
        },

        syncScroll: function(e) {
            // Prevent feedback loop: if one container scrolls, update the other.
            // Use a flag to avoid re-triggering the sync from the other container.
            if (this.isSyncingScroll) return;
            this.isSyncingScroll = true;

            const target = e.target;
            if (target === this.chartViewport) {
                // If chart viewport scrolled, sync sidebar scroll and header scroll
                this.sidebarBody.scrollTop = target.scrollTop;
                this.headerContainer.scrollLeft = target.scrollLeft;
            } else if (target === this.sidebarBody) {
                // If sidebar scrolled, sync chart viewport scroll
                this.chartViewport.scrollTop = target.scrollTop;
            }

            // Reset the flag after a short delay or on the next animation frame
            requestAnimationFrame(() => { this.isSyncingScroll = false; });
        },

        showContextMenu: function(e) {
            e.preventDefault(); // Prevent default browser context menu
            const coords = this.getEventCoords(e);

            // Determine which task bar (if any) the click occurred on
            const barContainer = document.elementFromPoint(coords.x, coords.y)?.closest('.gantt-bar-container');
            if (!barContainer) return; // No context menu if not on a bar

            const taskId = barContainer.dataset.taskId;
            this.selectedTaskId = taskId; // Select the task
            this.renderAll(); // Re-render to ensure selection highlight is updated

            // Remove any existing context menu
            const existingMenu = document.querySelector('.gantt-context-menu');
            if (existingMenu) existingMenu.remove();

            // Create and position the context menu
            const menu = document.createElement('div');
            menu.className = 'gantt-context-menu';
            // Position menu relative to the click coordinates
            menu.style.left = `${coords.pageX}px`;
            menu.style.top = `${coords.pageY}px`;

            // Define menu items
            menu.innerHTML = `
                <div class="gantt-context-menu-item" data-action="delete"><i class="fas fa-trash"></i> Remover Tarefa</div>
                <div class="gantt-context-menu-item" data-action="add-dependency"><i class="fas fa-link"></i> Adicionar Dependência</div>
                <div class="gantt-context-menu-item" data-action="mark-done"><i class="fas fa-check-circle"></i> Marcar como Concluída</div>
                <div class="gantt-context-menu-item" data-action="add-subtask"><i class="fas fa-plus"></i> Adicionar Subtarefa</div>
            `;

            document.body.appendChild(menu); // Add menu to the document body

            // Function to close the context menu
            const closeMenu = () => {
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('touchstart', closeMenu);
            };

            // Close menu on outside click or touch
            setTimeout(() => { // Use timeout to allow current event handlers to complete
                document.addEventListener('click', closeMenu);
                document.addEventListener('touchstart', closeMenu);
            }, 0);

            // Handle clicks on context menu items
            menu.addEventListener('click', (evt) => {
                evt.stopPropagation(); // Prevent click from propagating further
                const item = evt.target.closest('.gantt-context-menu-item');
                if(!item) return;

                const action = item.dataset.action;
                const task = this.tasks.find(t => t.id === taskId); // Get the task associated with the menu

                if (action === 'delete') {
                    if (confirm(`Tem certeza que deseja remover a tarefa "${task.name}" e todas as suas sub-tarefas?`)) {
                        this.removeTask(taskId);
                    }
                } else if (action === 'add-dependency') {
                    this.promptForDependency(taskId); // Prompt user for predecessor ID
                } else if (action === 'mark-done' && task) {
                    // Mark task as done and set progress to 100%
                    task.status = 'done';
                    task.progress = 100;
                    this.markDirty();
                    this.renderAll(); // Re-render to reflect status change
                } else if (action === 'add-subtask' && task) {
                    this.selectedTaskId = taskId; // Set current task as parent
                    this.addTask(); // Add a new subtask
                }
                closeMenu(); // Close the menu after action
            });
        },

        promptForDependency: function(taskId) {
            if (!taskId) {
                showNotification("Selecione uma tarefa de origem primeiro.", 3000, 'warning');
                return;
            }
            // Prompt user for the ID of the predecessor task
            const predecessorId = prompt("Digite o ID da tarefa predecessora (a que deve vir antes):");
            if (!predecessorId) return; // User cancelled

            const task = this.tasks.find(t => t.id === taskId);
            const predecessor = this.tasks.find(t => t.id === predecessorId);

            if (!predecessor) {
                showNotification(`Tarefa com ID "${predecessorId}" não encontrada.`, 3000, 'error');
                return;
            }

            // Add the predecessor ID to the task's dependencies if not already present
            const deps = task.dependencies ? task.dependencies.split(',') : [];
            if (!deps.includes(predecessorId)) {
                deps.push(predecessorId);
                task.dependencies = deps.join(',');
                this.markDirty();
                this.renderAll(); // Re-render to show the new dependency line
                showNotification("Dependência adicionada!", 2000);
            } else {
                 showNotification("Esta dependência já existe.", 2000, 'info');
            }
        },

        // --- Utility & Setup Functions ---
        showTooltip: function(coords, task) {
            // Calculate duration for tooltip
            const duration = this.daysBetween(this.parseDate(task.start), this.parseDate(task.end)) + 1;
            // Format dates for readability
            const formattedStart = this.formatDateLocale(this.parseDate(task.start));
            const formattedEnd = this.formatDateLocale(this.parseDate(task.end));

            this.tooltipEl.innerHTML = `
                <div class="gantt-tooltip-title">${task.name}</div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Início:</span><span>${formattedStart}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Fim:</span><span>${formattedEnd}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Duração:</span><span>${duration} dia${duration > 1 ? 's' : ''}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Progresso:</span><span>${task.progress || 0}%</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Responsável:</span><span>${task.assignee || '-'}</span></div>
            `;
            // Position tooltip relative to mouse cursor
            this.tooltipEl.style.left = `${coords.x + 15}px`;
            this.tooltipEl.style.top = `${coords.y + 15}px`;
            this.tooltipEl.classList.add('visible'); // Make tooltip visible
        },

        hideTooltip: function() { this.tooltipEl.classList.remove('visible'); }, // Hide tooltip

        generateAvatar: function(name) {
            // Generate avatar initials and color based on name
            if (!name || name.trim() === '') return `<div class="avatar" style="background-color: #ccc;" title="Não atribuído">?</div>`; // Default avatar for no assignee
            const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); // Get first two initials
            // Predefined colors for avatars
            const colors = ['#4a6cf7', '#28a745', '#ffc107', '#dc3545', '#6a11cb', '#fd7e14', '#0dcaf0'];
            // Use a hash of the name to consistently pick a color
            const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const color = colors[charCodeSum % colors.length];
            return `<div class="avatar" style="background-color: ${color};" title="${name}">${initials}</div>`;
        },

        getFlatTaskOrder: function() {
            // Creates a flat list of task IDs in the order they should be displayed, respecting parent collapsing
            const order = [];
            // Use filteredTasks if available, otherwise use all tasks
            const tasksToProcess = this.filteredTasks.length > 0 ? this.filteredTasks : this.tasks;

            const processNode = (task) => {
                order.push(task.id); // Add current task to the order
                // If it's a parent task and not collapsed, process its children
                if (task.type === 'parent' && !task.collapsed) {
                    // Filter children, sort them by start date, and recursively process
                    tasksToProcess.filter(t => t.parentId === task.id)
                        .sort((a, b) => this.parseDate(a.start) - this.parseDate(b.start))
                        .forEach(processNode);
                }
            };

            // Process root tasks (no parentId), sorted by start date
            tasksToProcess.filter(t => !t.parentId)
                .sort((a, b) => this.parseDate(a.start) - this.parseDate(b.start))
                .forEach(processNode);

            return order;
        },

        restoreEditingState: function(state) {
            // Restore focus and selection in input fields after a re-render
            if (!state) return;
            const row = this.sidebarBody.querySelector(`.gantt-task-row[data-task-id="${state.taskId}"]`);
            if (!row) return;
            const inputToFocus = row.querySelector(`[data-field="${state.field}"]`);
            if (inputToFocus) {
                inputToFocus.focus();
                // Attempt to restore cursor position and selection
                if (typeof inputToFocus.setSelectionRange === 'function') {
                    inputToFocus.setSelectionRange(state.selectionStart, state.selectionEnd);
                }
            }
        },

        setupSplitter: function() {
            // Setup for resizable sidebar-splitter
            let isDragging = false;
            let startX, startWidth;

            // Mouse down event handler
            const onDown = (e) => {
                isDragging = true;
                this.splitter.classList.add('dragging'); // Add visual feedback
                const coords = this.getEventCoords(e);
                startX = coords.x; // Record starting mouse position
                startWidth = this.splitter.previousElementSibling.offsetWidth; // Record initial sidebar width
                e.preventDefault(); // Prevent default drag behavior

                // Attach move and up listeners to the document to handle dragging outside the splitter element
                document.addEventListener('mousemove', onMove);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('mouseup', onUp);
                document.addEventListener('touchend', onUp);
            };

            // Mouse move handler for resizing
            const onMove = (e) => {
                if (!isDragging) return;
                const coords = this.getEventCoords(e);
                // Calculate new sidebar width
                const newWidth = startWidth + (coords.x - startX);
                // Apply width constraint to prevent excessive shrinking/growing
                if (newWidth > 200 && newWidth < winEl.offsetWidth - 200) {
                    this.splitter.previousElementSibling.style.width = `${newWidth}px`;
                }
            };

            // Mouse up handler to finalize drag
            const onUp = () => {
                isDragging = false;
                this.splitter.classList.remove('dragging'); // Remove visual feedback
                // Remove global listeners
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchend', onUp);
                this.renderChart(); // Re-render chart to adjust for new sidebar width
            };

            // Attach initial listeners to the splitter element
            this.splitter.addEventListener('mousedown', onDown);
            this.splitter.addEventListener('touchstart', onDown, { passive: false });
        },

        initFilters: function() {
            // Initialize event listeners for search and filter dropdowns
            const searchInput = winEl.querySelector(`#ganttSearch_${uniqueSuffix}`);
            const statusFilter = winEl.querySelector(`#statusFilter_${uniqueSuffix}`);
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);

            // Re-render the entire Gantt chart whenever filters change
            searchInput.addEventListener('input', () => this.renderAll());
            statusFilter.addEventListener('change', () => this.renderAll());
            assigneeFilter.addEventListener('change', () => this.renderAll());
        },

        applyFilters: function() {
            // Apply the current search term and filter selections
            const searchTerm = winEl.querySelector(`#ganttSearch_${uniqueSuffix}`).value.toLowerCase();
            const status = winEl.querySelector(`#statusFilter_${uniqueSuffix}`).value;
            const assignee = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`).value;

            this.filteredTasks = this.tasks.filter(task => {
                // Skip rendering tasks whose parents are collapsed
                const parent = task.parentId ? this.tasks.find(t => t.id === task.parentId) : null;
                if (parent && parent.collapsed) return false;

                // Check if task matches search term
                const nameMatch = searchTerm === '' || task.name.toLowerCase().includes(searchTerm);
                // Check if task matches status filter (parents are always included)
                const statusMatch = status === 'all' || task.status === status || task.type === 'parent';
                // Check if task matches assignee filter (parents are always included)
                const assigneeMatch = assignee === 'all' || task.assignee === assignee || task.type === 'parent';

                return nameMatch && statusMatch && assigneeMatch; // All conditions must be true
            });
        },

        updateAssigneeFilter: function() {
            // Populate the assignee filter dropdown with unique assignees from tasks
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            const currentVal = assigneeFilter.value; // Preserve current selection
            // Get all unique assignees, excluding empty ones
            const allAssignees = [...new Set(this.tasks.map(t => t.assignee).filter(Boolean))];

            assigneeFilter.innerHTML = '<option value="all">Todos</option>'; // Reset options
            allAssignees.forEach(assignee => {
                const option = document.createElement('option');
                option.value = assignee;
                option.textContent = assignee;
                assigneeFilter.appendChild(option);
            });
            assigneeFilter.value = currentVal; // Restore selection
        },

        initLongPressContextMenu: function() {
            // Enable context menu on touch devices using long press
            let pressTimer;
            this.chartContent.addEventListener('touchstart', (e) => {
                // Start timer for long press detection
                pressTimer = setTimeout(() => {
                    this.showContextMenu(e); // Show context menu on long press
                }, 500); // Adjust duration as needed
            }, { passive: false }); // passive: false is needed to call preventDefault in showContextMenu
            // Clear timer if touch ends before long press duration
            this.chartContent.addEventListener('touchend', () => clearTimeout(pressTimer));
            this.chartContent.addEventListener('touchmove', () => clearTimeout(pressTimer)); // Cancel timer on move
        },

        initKeyboardShortcuts: function() {
            // Add global keyboard shortcuts
            winEl.addEventListener('keydown', e => {
                // Ignore shortcuts if focus is on an input element
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                // Delete key to remove selected task
                if (e.key === 'Delete' && this.selectedTaskId) {
                    const taskToRemove = this.tasks.find(t => t.id === this.selectedTaskId);
                    if (taskToRemove && confirm(`Tem certeza que deseja remover a tarefa "${taskToRemove.name}" e todas as suas sub-tarefas?`)) {
                        this.removeTask(this.selectedTaskId);
                    }
                }
                // Ctrl+S to save file
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault(); // Prevent default browser save behavior
                    this.saveFile();
                }
            });
        },

        getSampleData: function() {
            // Provide some sample data for initial visualization
            const today = new Date();
            const d = (days) => this.formatDate(this.addDays(today, days)); // Helper to format dates relative to today
            return [
                {
                    id: 'task1',
                    name: 'Fase de Planejamento',
                    start: d(0),
                    end: d(14),
                    progress: 30,
                    status: 'inprogress',
                    type: 'parent',
                    collapsed: false
                },
                {
                    id: 'task2',
                    name: 'Reunião de Kick-off',
                    start: d(0),
                    end: d(0),
                    progress: 100,
                    status: 'done',
                    type: 'milestone',
                    parentId: 'task1'
                },
                {
                    id: 'task3',
                    name: 'Definição de Escopo',
                    start: d(1),
                    end: d(7),
                    progress: 70,
                    status: 'inprogress',
                    type: 'task',
                    parentId: 'task1'
                },
                {
                    id: 'task4',
                    name: 'Design de UI/UX',
                    start: d(5),
                    end: d(14),
                    progress: 20,
                    status: 'todo',
                    type: 'task',
                    parentId: 'task1',
                    dependencies: 'task3' // Example dependency
                },
                {
                    id: 'task5',
                    name: 'Fase de Desenvolvimento',
                    start: d(15),
                    end: d(45),
                    progress: 10,
                    status: 'todo',
                    type: 'parent',
                    collapsed: false
                },
                 {
                    id: 'task6',
                    name: 'Implementação do Módulo A',
                    start: d(15),
                    end: d(25),
                    progress: 10,
                    status: 'todo',
                    type: 'task',
                    parentId: 'task5',
                    dependencies: 'task4' // Dependency on Design
                },
                {
                    id: 'task7',
                    name: 'Deploy Inicial',
                    start: d(45),
                    end: d(45),
                    progress: 0,
                    status: 'todo',
                    type: 'milestone',
                    parentId: 'task5'
                }
            ];
        },

        markDirty: function() {
            // Mark the file as modified (implementation depends on broader app context)
            if (this.fileId) {
                 window.fileManager.markFileAsDirty(this.fileId);
            }
        },
        markClean: function() {
            // Mark the file as clean (implementation depends on broader app context)
            if (this.fileId) {
                 window.fileManager.markFileAsClean(this.fileId);
            }
        },

        cleanup: () => {} // Placeholder for cleanup logic if needed
    };

    // Initialize file state management for this app instance
    initializeFileState(appState, "Novo Roadmap", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState; // Store app instance on window data
    appState.init(); // Initialize the Gantt chart application
    return winId;
}
