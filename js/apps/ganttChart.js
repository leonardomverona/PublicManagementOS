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
                padding: 10px; 
                font-size: 0.75em; 
                font-weight: 600; 
                color: var(--secondary-text-color); 
                border-bottom: 1px solid var(--separator-color); 
                text-transform: uppercase;
                background-color: var(--window-bg);
                z-index: 2;
            }
            
            .gantt-sidebar-body { 
                flex-grow: 1; 
                overflow-y: auto; 
                position: relative;
                -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
            }
            
            .gantt-task-row { 
                height: var(--gantt-row-height);
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
                height: 100%;
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
            .gantt-bar { position: relative; height: 28px; background-color: var(--accent-color); border-radius: 6px; display: flex; align-items: center; color: white; font-size: 0.85em; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: move; cursor: grab; transition: filter 0.2s, transform 0.1s linear, width 0.1s linear, left 0.1s linear; }
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
                .toolbar-separator { display: none; }
                .gantt-v2-container {
                    flex-direction: column;
                    height: auto; /* Let content determine height */
                }
                .gantt-sidebar {
                    width: 100%;
                    max-width: 100%;
                    height: 45vh; /* Adjusted height for mobile */
                    border-right: none;
                    border-bottom: 2px solid var(--separator-color);
                }
                .gantt-chart-area {
                    height: 55vh; /* Adjusted height for chart */
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
                    gap: 8px 10px;
                    padding: 10px;
                    align-items: flex-start;
                }
                .task-cell {
                    height: auto;
                    grid-column: span 1;
                    white-space: normal;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 2px;
                }
                 .task-cell::before {
                    content: attr(data-label);
                    font-size: 0.7em;
                    font-weight: 600;
                    color: var(--secondary-text-color);
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .task-cell.task-name-cell, .task-cell.task-actions {
                     grid-column: 1 / -1; /* Full width */
                }
                .task-name-cell {
                    font-weight: bold;
                    flex-direction: row;
                    align-items: center;
                }
                .task-name-cell::before { content: ''; margin-bottom: 0; }
                .task-cell.task-actions {
                    flex-direction: row;
                    justify-content: flex-end;
                }
                .task-cell.task-actions::before { content: ''; }

                .app-button span { display: none; } /* Hide text on buttons */
                .app-button i { margin-right: 0; } /* Remove margin when text is hidden */
                .app-button { padding: 8px 10px; } /* More touch-friendly */
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
                    <button data-view="day" class="app-button active" title="Visão Diária"><i class="fas fa-calendar-day"></i> <span>Dia</span></button>
                    <button data-view="week" class="app-button" title="Visão Semanal"><i class="fas fa-calendar-week"></i> <span>Semana</span></button>
                    <button data-view="month" class="app-button" title="Visão Mensal"><i class="fas fa-calendar-alt"></i> <span>Mês</span></button>
                    <button data-view="quarter" class="app-button" title="Visão Trimestral"><i class="fas fa-chart-bar"></i> <span>Trimestre</span></button>
                    <button data-view="year" class="app-button" title="Visão Anual"><i class="fas fa-flag"></i> <span>Ano</span></button>
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
            viewMode: 'day', // 'day', 'week', 'month', 'quarter', 'year'
            unitWidths: { day: 40, week: 100, month: 200, quarter: 300, year: 500 },
            get unitWidth() { return this.unitWidths[this.viewMode]; },
            totalWidth: 0 
        },
        flatTaskOrder: [],
        filteredTasks: [],
        domNodeMap: new Map(),

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

                this.applyFilters();
                this.updateParentTasks();
                this.calculateTimeline();
            }

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
                today.setUTCHours(0, 0, 0, 0);
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

            // Add buffer
            const bufferDays = this.timeline.viewMode === 'day' ? 15 : (this.timeline.viewMode === 'week' ? 30 : 90);
            this.timeline.startDate = this.addDays(minDate, -bufferDays);
            this.timeline.endDate = this.addDays(maxDate, bufferDays);
        },
        
        zoomIn: function() { 
            this.timeline.unitWidths[this.timeline.viewMode] = Math.min(800, this.timeline.unitWidths[this.timeline.viewMode] * 1.2); 
            this.renderChart(); 
            this.renderDependencies();
        },
        
        zoomOut: function() { 
            const minWidth = { day: 20, week: 50, month: 80, quarter: 100, year: 150 };
            this.timeline.unitWidths[this.timeline.viewMode] = Math.max(minWidth[this.timeline.viewMode], this.timeline.unitWidths[this.timeline.viewMode] / 1.2);
            this.renderChart(); 
            this.renderDependencies();
        },

        getUnitOffset: function(date) {
            const startDate = this.timeline.startDate;
            switch(this.timeline.viewMode) {
                case 'year':
                    return (date.getUTCFullYear() - startDate.getUTCFullYear());
                case 'quarter':
                     return (date.getUTCFullYear() - startDate.getUTCFullYear()) * 4 + (Math.floor(date.getUTCMonth() / 3) - Math.floor(startDate.getUTCMonth() / 3));
                case 'month':
                    return (date.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + (date.getUTCMonth() - startDate.getUTCMonth());
                case 'week':
                    // Use Monday as the start of the week for consistent calculations
                    const startOfWeek = (d) => {
                        const day = d.getUTCDay();
                        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                        return new Date(d.setUTCDate(diff));
                    };
                    return this.daysBetween(startOfWeek(startDate), startOfWeek(date)) / 7;
                default: // day
                    return this.daysBetween(startDate, date);
            }
        },

        goToToday: function() {
            const today = new Date();
            today.setUTCHours(0,0,0,0);
            const todayOffset = this.getUnitOffset(today) * this.timeline.unitWidth;
            this.chartViewport.scrollLeft = todayOffset - this.chartViewport.offsetWidth / 2;
        },
        
        toggleCriticalPath: function() {
            this.showCriticalPath = !this.showCriticalPath;
            winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`).classList.toggle('active', this.showCriticalPath);
            this.renderAll();
        },

        renderSidebar: function() {
            const fragment = document.createDocumentFragment();
            const existingIds = new Set();
            
            const renderTaskNode = (task, level) => {
                existingIds.add(task.id);
                const isParent = task.type === 'parent';
                let row = this.domNodeMap.get(task.id);
        
                if (row) { // Update existing row
                    // Update classes, styles, and simple content
                    row.className = `gantt-task-row ${this.selectedTaskId === task.id ? 'selected' : ''}`;
                    row.querySelector('.task-name-cell').style.paddingLeft = `${level * 25 + 5}px`;
                    if(isParent) row.querySelector('.task-expander').className = `task-expander ${task.collapsed ? 'collapsed' : ''}`;
                    
                    // Update potentially changed values without replacing input elements
                    row.querySelector('.task-cell span').textContent = isParent ? '-' : (this.daysBetween(this.parseDate(task.start), this.parseDate(task.end)) + 1) + 'd';
                    row.querySelector('input[data-field="name"]').value = task.name;
                    row.querySelector('input[data-field="progress"]').value = task.progress || 0;
                    row.querySelector('input[data-field="assignee"]').value = task.assignee || '';
                    row.querySelector('.avatar').outerHTML = this.generateAvatar(task.assignee); // Avatar is simple enough to replace
                    row.querySelector('input[data-field="start"]').value = task.start;
                    row.querySelector('input[data-field="end"]').value = task.end;

                } else { // Create new row
                    row = document.createElement('div');
                    this.domNodeMap.set(task.id, row);
                    row.className = 'gantt-task-row';
                     if (this.selectedTaskId === task.id) row.classList.add('selected');
                    row.dataset.taskId = task.id;

                    const children = this.tasks.filter(t => t.parentId === task.id);
                    task.type = (isParent || children.length > 0) ? 'parent' : task.type;

                    const expanderHTML = task.type === 'parent' ? `<span class="task-expander ${task.collapsed ? 'collapsed' : ''}"><i class="fas fa-angle-down"></i></span>` : '<span class="task-expander"></span>';
                    const icon = task.type === 'milestone' ? 'fa-gem' : task.type === 'parent' ? 'fa-folder' : 'fa-tasks';
                    const duration = task.type === 'parent' ? '-' : (this.daysBetween(this.parseDate(task.start), this.parseDate(task.end)) + 1) + 'd';

                    row.innerHTML = `
                        <div class="task-cell task-name-cell" style="padding-left: ${level * 25 + 5}px;">
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
                            <input type="date" value="${task.end}" data-field="end" ${task.type === 'milestone' ? 'readonly' : ''}>
                        </div>
                        <div class="task-cell task-actions">
                            <button class="action-btn" data-action="remove" title="Remover"><i class="fas fa-trash"></i></button>
                            <button class="action-btn" data-action="add-child" title="Adicionar Subtarefa"><i class="fas fa-plus"></i></button>
                        </div>
                    `;
                }

                fragment.appendChild(row);

                if (task.type === 'parent' && !task.collapsed) {
                    this.tasks.filter(t => t.parentId === task.id)
                        .sort((a,b) => this.parseDate(a.start) - this.parseDate(b.start))
                        .forEach(child => renderTaskNode(child, level + 1));
                }
            };
            
            const rootTasks = this.tasks.filter(t => !t.parentId && this.flatTaskOrder.includes(t.id));
            rootTasks.sort((a,b) => this.parseDate(a.start) - this.parseDate(b.start))
                     .forEach(task => renderTaskNode(task, 0));

            // Remove nodes for deleted tasks
            this.domNodeMap.forEach((node, taskId) => {
                if (!existingIds.has(taskId)) {
                    node.remove();
                    this.domNodeMap.delete(taskId);
                }
            });

            this.sidebarBody.appendChild(fragment);
        },
        
        renderChart: function() {
            if (!this.timeline.startDate) return;

            // Clear previous content
            this.headerContainer.innerHTML = '';
            this.gridEl.innerHTML = '';
            this.chartContent.querySelectorAll('.gantt-bar-container, .gantt-today-marker').forEach(el => el.remove());

            this.renderTimelineHeader();

            this.flatTaskOrder.forEach((taskId, index) => {
                const task = this.tasks.find(t => t.id === taskId);
                if (!task || (task.parentId && this.tasks.find(p => p.id === task.parentId)?.collapsed)) return;

                const rowLine = document.createElement('div');
                rowLine.className = 'gantt-row-line';
                rowLine.style.top = `${index * 40 + 39}px`;
                this.gridEl.appendChild(rowLine);

                const taskStart = this.parseDate(task.start);
                const left = this.getUnitOffset(taskStart) * this.timeline.unitWidth;

                const barContainer = document.createElement('div');
                barContainer.className = 'gantt-bar-container';
                barContainer.style.top = `${index * 40}px`;
                barContainer.dataset.taskId = task.id;
                if (task.id === this.selectedTaskId) barContainer.classList.add('selected');

                if (task.type === 'milestone') {
                    barContainer.style.left = `${left}px`;
                    barContainer.innerHTML = `<div class="gantt-milestone"></div>`;
                } else {
                    const taskEnd = this.parseDate(task.end);
                    const durationInDays = this.daysBetween(taskStart, taskEnd) + 1;
                    let width;
                    switch(this.timeline.viewMode) {
                        case 'year': width = (durationInDays / 365.25) * this.timeline.unitWidth; break;
                        case 'quarter': width = (durationInDays / (365.25 / 4)) * this.timeline.unitWidth; break;
                        case 'month': width = (durationInDays / (365.25 / 12)) * this.timeline.unitWidth; break; // More precise
                        case 'week': width = (durationInDays / 7) * this.timeline.unitWidth; break;
                        default: width = durationInDays * this.timeline.unitWidth;
                    }

                    barContainer.style.left = `${left}px`;
                    barContainer.style.width = `${Math.max(width, 2)}px`;

                    const barClass = task.type === 'parent' ? 'gantt-bar-parent' : `status-${task.status || 'todo'}`;
                    const progress = task.type === 'parent' ? (task.progress || 0) : (task.status === 'done' ? 100 : (task.progress || 0));
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
            
            const today = new Date();
            today.setUTCHours(0,0,0,0);
            if (today >= this.timeline.startDate && today <= this.timeline.endDate) {
                const todayOffset = this.getUnitOffset(today) * this.timeline.unitWidth;
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

            let totalUnits = 0;
            let currentDate = new Date(startDate.getTime());
            currentDate.setUTCHours(0,0,0,0);

            const addUnit = (parent, text, width, className = '') => {
                const el = document.createElement('div');
                el.className = `gantt-timeline-unit ${className}`;
                el.textContent = text;
                el.style.width = `${width}px`;
                parent.appendChild(el);
                return el;
            };

            const addGridLine = (left) => {
                const gridLine = document.createElement('div');
                gridLine.className = 'gantt-grid-line';
                gridLine.style.left = `${left}px`;
                this.gridEl.appendChild(gridLine);
            };

            if (viewMode === 'day') {
                let currentMonth = -1;
                let monthUnitEl = null;
                let daysInMonth = 0;
                while (currentDate <= endDate) {
                    if (currentDate.getUTCMonth() !== currentMonth) {
                        if (monthUnitEl) monthUnitEl.style.width = `${daysInMonth * unitWidth}px`;
                        currentMonth = currentDate.getUTCMonth();
                        const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                        monthUnitEl = addUnit(upperRow, monthName.charAt(0).toUpperCase() + monthName.slice(1), 0, 'upper');
                        daysInMonth = 0;
                    }

                    addUnit(lowerRow, currentDate.getUTCDate(), unitWidth, 'lower');
                    const dayOfWeek = currentDate.getUTCDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
                        const weekendEl = document.createElement('div');
                        weekendEl.className = 'gantt-grid-weekend';
                        weekendEl.style.left = `${totalUnits * unitWidth}px`;
                        weekendEl.style.width = `${unitWidth}px`;
                        this.gridEl.appendChild(weekendEl);
                    }
                    addGridLine(totalUnits * unitWidth);

                    currentDate = this.addDays(currentDate, 1);
                    totalUnits++;
                    daysInMonth++;
                }
                if (monthUnitEl) monthUnitEl.style.width = `${daysInMonth * unitWidth}px`;

            } else {
                let currentMajorUnit = -1;
                let majorUnitEl = null;
                let unitsInMajor = 0;

                while (currentDate <= endDate) {
                    let newMajorUnit = false;
                    let majorUnitText = '';
                    let lowerUnitText = '';
                    let nextDate = new Date(currentDate.getTime());

                    if (viewMode === 'week') {
                        const week = Math.ceil((this.daysBetween(new Date(`${currentDate.getUTCFullYear()}-01-01T00:00:00Z`), currentDate) + 1) / 7);
                        if(currentDate.getUTCMonth() !== currentMajorUnit) {
                           currentMajorUnit = currentDate.getUTCMonth();
                           newMajorUnit = true;
                        }
                        majorUnitText = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
                        lowerUnitText = `Semana ${week}`;
                        nextDate = this.addDays(currentDate, 7);
                    } else if (viewMode === 'month') {
                        if(currentDate.getUTCFullYear() !== currentMajorUnit) {
                           currentMajorUnit = currentDate.getUTCFullYear();
                           newMajorUnit = true;
                        }
                        majorUnitText = currentMajorUnit;
                        lowerUnitText = currentDate.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
                        nextDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                    } else if (viewMode === 'quarter') {
                         if(currentDate.getUTCFullYear() !== currentMajorUnit) {
                           currentMajorUnit = currentDate.getUTCFullYear();
                           newMajorUnit = true;
                        }
                        majorUnitText = currentMajorUnit;
                        const quarter = Math.floor(currentDate.getUTCMonth() / 3) + 1;
                        lowerUnitText = `T${quarter}`;
                        nextDate.setUTCMonth(currentDate.getUTCMonth() + 3);
                    } else if (viewMode === 'year') {
                        newMajorUnit = true; // Every year is a new unit
                        majorUnitText = '';
                        lowerUnitText = currentDate.getUTCFullYear();
                        nextDate.setUTCFullYear(currentDate.getUTCFullYear() + 1);
                    }

                    if (newMajorUnit && viewMode !== 'year') {
                        if (majorUnitEl) majorUnitEl.style.width = `${unitsInMajor * unitWidth}px`;
                        majorUnitEl = addUnit(upperRow, majorUnitText, 0, 'upper');
                        unitsInMajor = 0;
                    }

                    addUnit(lowerRow, lowerUnitText, unitWidth, 'lower');
                    addGridLine(totalUnits * unitWidth);
                    
                    currentDate = nextDate;
                    totalUnits++;
                    unitsInMajor++;
                }
                if (majorUnitEl) majorUnitEl.style.width = `${unitsInMajor * unitWidth}px`;
            }

            this.timeline.totalWidth = totalUnits * unitWidth;
            headerEl.appendChild(upperRow);
            headerEl.appendChild(lowerRow);
            this.headerContainer.appendChild(headerEl);
        },

        renderDependencies: function() {
            const svgNS = 'http://www.w3.org/2000/svg';
            // Reuse or clear existing paths
            const existingPaths = new Map();
            this.svgOverlay.querySelectorAll('path').forEach(p => {
                const key = `${p.dataset.fromId}-${p.dataset.toId}`;
                existingPaths.set(key, p);
            });
            const renderedPaths = new Set();
            
            const barElements = {};
            this.chartContent.querySelectorAll('.gantt-bar-container').forEach(b => { 
                barElements[b.dataset.taskId] = b; 
            });
            
            const getTaskIndex = (taskId) => this.flatTaskOrder.indexOf(taskId);

            this.tasks.forEach(task => {
                if(task.dependencies) {
                    const deps = task.dependencies.split(',').map(d => d.trim()).filter(Boolean);
                    deps.forEach(depId => {
                        const predecessor = this.tasks.find(t => t.id === depId);
                        if(!predecessor || !barElements[task.id] || !barElements[predecessor.id]) return;

                        const fromEl = barElements[predecessor.id];
                        const toEl = barElements[task.id];
                        
                        const fromIndex = getTaskIndex(predecessor.id);
                        const toIndex = getTaskIndex(task.id);
                        if (fromIndex === -1 || toIndex === -1) return;

                        const fromX = fromEl.offsetLeft + (predecessor.type === 'milestone' ? 12 : fromEl.offsetWidth);
                        const fromY = fromIndex * 40 + 20;
                        const toX = toEl.offsetLeft + (task.type === 'milestone' ? 12 : 0);
                        const toY = toIndex * 40 + 20;
                        
                        const pathKey = `${predecessor.id}-${task.id}`;
                        renderedPaths.add(pathKey);
                        const path = existingPaths.get(pathKey) || document.createElementNS(svgNS, 'path');
                        
                        const d = `M ${fromX} ${fromY} L ${fromX + 15} ${fromY} L ${fromX + 15} ${toY} L ${toX} ${toY}`;
                        path.setAttribute('d', d);
                        
                        const isCritical = this.showCriticalPath && predecessor._isCritical && task._isCritical;
                        path.setAttribute('class', `gantt-dependency-path ${isCritical ? 'gantt-critical-path' : ''}`);

                        if (!existingPaths.has(pathKey)) {
                            path.dataset.fromId = predecessor.id;
                            path.dataset.toId = task.id;
                            this.svgOverlay.appendChild(path);
                        }
                    });
                }
            });

            // Remove old paths that are no longer valid
            existingPaths.forEach((path, key) => {
                if (!renderedPaths.has(key)) {
                    path.remove();
                }
            });
        },
        
        calculateAndDrawCriticalPath: function() {
            const tasks = this.tasks.filter(t => t.type !== 'parent');
            if (tasks.length === 0) return;

            tasks.forEach(t => {
                t.earlyStart = 0;
                t.earlyFinish = 0;
                t.lateStart = Infinity;
                t.lateFinish = Infinity;
                t.duration = this.daysBetween(this.parseDate(t.start), this.parseDate(t.end)) + 1;
                t._isCritical = false; // Reset critical status
            });

            const taskMap = new Map(tasks.map(t => [t.id, t]));
            const adj = new Map(tasks.map(t => [t.id, []]));
            const revAdj = new Map(tasks.map(t => [t.id, []]));
            
            tasks.forEach(t => {
                const deps = (t.dependencies || '').split(',').map(d => d.trim()).filter(Boolean);
                if (deps.length > 0) {
                    deps.forEach(depId => {
                        if (taskMap.has(depId)) {
                            adj.get(depId).push(t.id);
                            revAdj.get(t.id).push(depId);
                        }
                    });
                }
            });

            // Forward Pass
            const calcEarly = (taskId) => {
                const task = taskMap.get(taskId);
                if(task.earlyFinish > 0) return; // Already calculated
                
                let maxPredFinish = 0;
                const deps = (task.dependencies || '').split(',').map(d => d.trim()).filter(Boolean);
                deps.forEach(depId => {
                    if(!taskMap.has(depId)) return;
                    calcEarly(depId);
                    maxPredFinish = Math.max(maxPredFinish, taskMap.get(depId).earlyFinish);
                });
                task.earlyStart = maxPredFinish;
                task.earlyFinish = task.earlyStart + task.duration;
            };
            tasks.forEach(t => calcEarly(t.id));

            const projectFinishTime = Math.max(0, ...tasks.map(t => t.earlyFinish));
            tasks.forEach(t => t.lateFinish = projectFinishTime);

            // Backward Pass
            const calcLate = (taskId) => {
                const task = taskMap.get(taskId);
                 if(task.lateStart < Infinity) return; // Already calculated
                
                let minSuccStart = projectFinishTime;
                (adj.get(taskId) || []).forEach(succId => {
                    const succ = taskMap.get(succId);
                    calcLate(succId);
                    minSuccStart = Math.min(minSuccStart, succ.lateStart);
                });
                task.lateFinish = minSuccStart;
                task.lateStart = task.lateFinish - task.duration;
            };
            tasks.forEach(t => calcLate(t.id));
            
            tasks.forEach(t => {
                const slack = t.lateStart - t.earlyStart;
                if (slack < 0.01) { // Using a small tolerance for float issues
                    t._isCritical = true;
                }
            });
            // Drawing is handled in renderChart and renderDependencies now
        },
        
        addTask: function(isMilestone = false) {
            const today = new Date();
            const start = this.formatDate(today);
            const end = this.formatDate(this.addDays(today, isMilestone ? 0 : 4));

            const newTask = {
                id: generateId('task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start, end,
                assignee: '', status: 'todo', progress: 0, dependencies: '',
                type: isMilestone ? 'milestone' : 'task',
                parentId: this.selectedTaskId || null
            };
            
            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
        },
        
        addParentTask: function() {
            const today = new Date();
            const start = this.formatDate(today);
            const end = this.formatDate(this.addDays(today, 7));

            const newTask = {
                id: generateId('parent'),
                name: 'Novo Grupo',
                start, end,
                assignee: '', status: 'todo', progress: 0, dependencies: '',
                type: 'parent',
                collapsed: false,
                parentId: null
            };

            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
        },
        
        removeTask: function(taskId) {
            const taskToRemove = this.tasks.find(t => t.id === taskId);
            if (!taskToRemove) return;
        
            const childrenIds = this.tasks.filter(t => t.parentId === taskId).map(t => t.id);
            const idsToRemove = new Set([taskId, ...childrenIds]);
        
            this.tasks = this.tasks.filter(t => !idsToRemove.has(t.id));
        
            this.tasks.forEach(t => {
                if (t.dependencies) {
                    t.dependencies = t.dependencies.split(',')
                        .map(d => d.trim())
                        .filter(d => !idsToRemove.has(d))
                        .join(',');
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
                    children.forEach(processNode);
                    if (!task.collapsed) {
                        const startDates = children.map(c => this.parseDate(c.start).getTime());
                        const endDates = children.map(c => this.parseDate(c.end).getTime());
                        task.start = this.formatDate(new Date(Math.min(...startDates)));
                        task.end = this.formatDate(new Date(Math.max(...endDates)));
                        const totalProgress = children.reduce((sum, c) => sum + (Number(c.progress) || 0), 0);
                        task.progress = Math.round(totalProgress / children.length);
                    }
                }
            };
            this.tasks.filter(t => t.type === 'parent' && !t.parentId).forEach(processNode);
        },

        // --- Event Handlers ---
        handleSidebarLiveInput: function(e) {
            const input = e.target;
            const row = input.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = input.dataset.field;
            const task = this.tasks.find(t => t.id === taskId);

            if (task) {
                // No full re-render here, just update the data model and mark as dirty.
                // The input value is already in the DOM.
                task[field] = input.value;
                this.markDirty();
                
                // Partial DOM update for linked elements (like bar label)
                if (field === 'name') {
                    const barLabel = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${taskId}"] .gantt-bar-label`);
                    if (barLabel) barLabel.textContent = input.value;
                } else if (field === 'progress') {
                    const progressBar = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${taskId}"] .gantt-bar-progress`);
                    if (progressBar) progressBar.style.width = `${input.value}%`;
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
                task[field] = input.value;
                this.markDirty();
                
                // A full re-render is justified for changes that affect layout/dependencies
                if (field === 'start' || field === 'end' || field === 'assignee') {
                    if (field === 'assignee') this.updateAssigneeFilter();
                    this.renderAll();
                }
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
                if (action === 'add-child') {
                    this.selectedTaskId = taskId;
                    this.addTask();
                }
                return;
            }
            
            if (e.target.tagName !== 'INPUT' && this.selectedTaskId !== taskId) {
                this.selectedTaskId = taskId;
                this.renderSidebar(); // Just re-render sidebar for selection change
                this.renderChart(); // And chart for selection highlight
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

            if (this.selectedTaskId !== taskId) {
                this.selectedTaskId = taskId;
                this.renderSidebar();
            }
            
            const coords = this.getEventCoords(e);
            const startX = coords.x;
            const initialStart = this.parseDate(task.start);
            const initialEnd = task.end ? this.parseDate(task.end) : initialStart;
            const handle = target.classList.contains('gantt-bar-handle') ? (target.classList.contains('left') ? 'left' : 'right') : null;

            const initialLeft = container.offsetLeft;
            const initialWidth = container.offsetWidth;

            const onMove = (moveE) => {
                const moveCoords = this.getEventCoords(moveE);
                const deltaX = moveCoords.x - startX;
                
                if (handle === 'left') {
                    const newWidth = Math.max(this.timeline.unitWidth, initialWidth - deltaX);
                    const newLeft = initialLeft + deltaX;
                    container.style.width = `${newWidth}px`;
                    container.style.left = `${newLeft}px`;
                } else if (handle === 'right') {
                    const newWidth = Math.max(this.timeline.unitWidth, initialWidth + deltaX);
                    container.style.width = `${newWidth}px`;
                } else { // Move
                    container.style.left = `${initialLeft + deltaX}px`;
                }
                this.renderDependencies(); // Update dependencies visually while dragging
            };

            const onEnd = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);

                const finalLeft = container.offsetLeft;
                const finalWidth = container.offsetWidth;
                const leftInUnits = finalLeft / this.timeline.unitWidth;
                
                let startOffsetDays, durationDays;
                switch(this.timeline.viewMode) {
                    case 'year': startOffsetDays = leftInUnits * 365.25; durationDays = (finalWidth / this.timeline.unitWidth) * 365.25; break;
                    case 'quarter': startOffsetDays = leftInUnits * (365.25 / 4); durationDays = (finalWidth / this.timeline.unitWidth) * (365.25 / 4); break;
                    case 'month': startOffsetDays = leftInUnits * (365.25 / 12); durationDays = (finalWidth / this.timeline.unitWidth) * (365.25 / 12); break;
                    case 'week': startOffsetDays = leftInUnits * 7; durationDays = (finalWidth / this.timeline.unitWidth) * 7; break;
                    default: startOffsetDays = leftInUnits; durationDays = finalWidth / this.timeline.unitWidth;
                }

                const newStart = this.addDays(this.timeline.startDate, Math.round(startOffsetDays));
                task.start = this.formatDate(newStart);

                if (task.type !== 'milestone') {
                    const newEnd = this.addDays(newStart, Math.max(0, Math.round(durationDays) - 1));
                    task.end = this.formatDate(newEnd);
                } else {
                    task.end = task.start;
                }
                
                this.markDirty();
                this.renderAll();
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

            const targetElement = document.elementFromPoint(coords.x, coords.y);
            const barContainer = targetElement?.closest('.gantt-bar-container');
            if (!barContainer) return;

            const taskId = barContainer.dataset.taskId;
            this.selectedTaskId = taskId;
            this.renderAll(true); // Partial render
            
            const existingMenu = document.querySelector('.gantt-context-menu');
            if (existingMenu) existingMenu.remove();
            
            const menu = document.createElement('div');
            menu.className = 'gantt-context-menu';
            menu.style.left = `${coords.pageX}px`;
            menu.style.top = `${coords.pageY}px`;
            
            menu.innerHTML = `
                <div class="gantt-context-menu-item" data-action="delete"><i class="fas fa-trash"></i> Remover Tarefa</div>
                <div class="gantt-context-menu-item" data-action="add-dependency"><i class="fas fa-link"></i> Adicionar Dependência</div>
                <div class="gantt-context-menu-item" data-action="mark-done"><i class="fas fa-check-circle"></i> Marcar como Concluída</div>
            `;
            
            document.body.appendChild(menu);
            
            const closeMenu = (evt) => {
                if (!menu.contains(evt.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu, { capture: true });
                    document.removeEventListener('touchstart', closeMenu, { capture: true });
                }
            };
            
            setTimeout(() => { // Allow current event to finish before attaching listeners
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
                    task.status = 'done';
                    task.progress = 100;
                    this.markDirty();
                    this.renderAll();
                }
                menu.remove();
                document.removeEventListener('click', closeMenu, { capture: true });
                document.removeEventListener('touchstart', closeMenu, { capture: true });
            });
        },
        
        promptForDependency: function(taskId) {
            if(!taskId) {
                showNotification("Selecione uma tarefa de destino primeiro.", 3000, 'warning');
                return;
            }
            const predecessorId = prompt("Digite o ID da tarefa predecessora (a que deve vir antes):");
            if (!predecessorId) return;

            const task = this.tasks.find(t => t.id === taskId);
            const predecessor = this.tasks.find(t => t.id === predecessorId);
            
            if (!predecessor) {
                showNotification(`Tarefa com ID "${predecessorId}" não encontrada.`, 3000, 'error');
                return;
            }
            
            const deps = task.dependencies ? task.dependencies.split(',') : [];
            if (!deps.includes(predecessorId)) {
                deps.push(predecessorId);
                task.dependencies = deps.join(',');
                this.markDirty();
                this.renderAll();
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
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Responsável:</span><span>${task.assignee || '-'}</span></div>
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
            const tasksToProcess = this.filteredTasks;
            const processed = new Set();
        
            const processNode = (task) => {
                if (processed.has(task.id)) return;
                processed.add(task.id);
                order.push(task.id);
        
                if (task.type === 'parent' && !task.collapsed) {
                    const children = this.tasks.filter(t => t.parentId === task.id);
                    children.sort((a, b) => this.parseDate(a.start).getTime() - this.parseDate(b.start).getTime());
                    children.forEach(processNode);
                }
            };
        
            const rootTasks = tasksToProcess.filter(t => !t.parentId || !tasksToProcess.some(p => p.id === t.parentId));
            rootTasks.sort((a, b) => this.parseDate(a.start).getTime() - this.parseDate(b.start).getTime());
            rootTasks.forEach(processNode);
            
            return order;
        },

        setupSplitter: function() {
            let isDragging = false;
            let startX, startWidth;

            const onDown = (e) => {
                e.preventDefault();
                isDragging = true;
                this.splitter.classList.add('dragging');
                document.body.style.cursor = 'col-resize';
                const coords = this.getEventCoords(e);
                startX = coords.x;
                startWidth = this.splitter.previousElementSibling.offsetWidth;
                document.addEventListener('mousemove', onMove);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('mouseup', onUp);
                document.addEventListener('touchend', onUp);
            };

            const onMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                const coords = this.getEventCoords(e);
                const newWidth = startWidth + (coords.x - startX);
                if (newWidth > 200 && newWidth < winEl.offsetWidth - 200) {
                    this.splitter.previousElementSibling.style.width = `${newWidth}px`;
                }
            };

            const onUp = () => {
                isDragging = false;
                this.splitter.classList.remove('dragging');
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchend', onUp);
            };

            this.splitter.addEventListener('mousedown', onDown);
            this.splitter.addEventListener('touchstart', onDown, { passive: false });
        },
        
        initFilters: function() {
            const searchInput = winEl.querySelector(`#ganttSearch_${uniqueSuffix}`);
            const statusFilter = winEl.querySelector(`#statusFilter_${uniqueSuffix}`);
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            
            const debounceRender = (delay = 150) => {
                let timeout;
                return () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.renderAll(), delay);
                };
            };
            const debouncedRender = debounceRender();
            
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
            allAssignees.forEach(assignee => {
                const option = document.createElement('option');
                option.value = assignee;
                option.textContent = assignee;
                assigneeFilter.appendChild(option);
            });
            assigneeFilter.value = allAssignees.includes(currentVal) ? currentVal : 'all';
        },
        
        initLongPressContextMenu: function() {
            let pressTimer;
            const startPress = (e) => {
                // Ensure it's a direct touch on a bar, not general chart area
                const bar = e.target.closest('.gantt-bar-container');
                if (!bar) return;
                
                pressTimer = setTimeout(() => {
                    e.preventDefault(); // Prevent firing other events
                    this.showContextMenu(e);
                }, 500);
            };
            const cancelPress = () => clearTimeout(pressTimer);

            this.chartContent.addEventListener('touchstart', startPress, { passive: true });
            this.chartContent.addEventListener('touchend', cancelPress);
            this.chartContent.addEventListener('touchmove', cancelPress);
        },
        
        initKeyboardShortcuts: function() {
            winEl.addEventListener('keydown', e => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
                if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedTaskId) {
                    e.preventDefault();
                    this.removeTask(this.selectedTaskId);
                }
                if (e.ctrlKey && e.key === 's') { e.preventDefault(); this.saveFile(); }
            });
        },

        getSampleData: function() {
            const today = new Date();
            today.setUTCHours(0,0,0,0);
            const d = (days) => this.formatDate(this.addDays(today, days));
            return [
                {id:"parent1",name:"Fase de Planejamento",start:d(0),end:d(15),progress:58,status:"inprogress",type:"parent",collapsed:false,dependencies:"",assignee:""},
                {id:"task1",name:"Reunião de Kick-off",start:d(0),end:d(0),progress:100,status:"done",type:"milestone",parentId:"parent1",dependencies:"",assignee:"Ana"},
                {id:"task2",name:"Definição de Escopo e Requisitos",start:d(1),end:d(5),progress:80,status:"inprogress",type:"task",parentId:"parent1",dependencies:"task1",assignee:"Bruno"},
                {id:"task3",name:"Alocação de Recursos",start:d(6),end:d(8),progress:70,status:"inprogress",type:"task",parentId:"parent1",dependencies:"task2",assignee:"Ana"},
                {id:"parent2",name:"Fase de Design",start:d(9),end:d(20),progress:10,status:"todo",type:"parent",collapsed:false,dependencies:"",assignee:""},
                {id:"task4",name:"Design de UI/UX",start:d(9),end:d(16),progress:20,status:"todo",type:"task",parentId:"parent2",dependencies:"task3",assignee:"Carlos"},
                {id:"task5",name:"Revisão do Design",start:d(17),end:d(18),progress:0,status:"todo",type:"task",parentId:"parent2",dependencies:"task4",assignee:"Equipe"},
                {id:"task6",name:"Aprovação Final do Design",start:d(19),end:d(19),progress:0,status:"todo",type:"milestone",parentId:"parent2",dependencies:"task5",assignee:"Cliente"}
            ];
        },
        
        cleanup: () => {
            this.domNodeMap.clear();
        }
    };

    initializeFileState(appState, "Novo Roadmap", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
