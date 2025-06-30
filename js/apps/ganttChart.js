import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openGanttChart() {
    const uniqueSuffix = generateId('gantt');
    const winId = window.windowManager.createWindow('Roadmap do Projeto (Gantt 2.0)', '', { 
        width: '90vw', 
        height: '85vh', 
        appType: 'gantt-chart',
        minWidth: 800,
        minHeight: 600
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
            }
            
            .gantt-v2-container { 
                display: flex; 
                height: calc(100% - 80px); 
                width: 100%;
                overflow: hidden;
            }
            
            /* --- Barra de Ferramentas --- */
            .app-toolbar { 
                display: flex;
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
                transition: background-color 0.2s;
                font-size: 0.9em;
                margin: 0 3px;
            }
            
            .app-button:hover {
                background-color: var(--button-hover-bg);
            }
            
            .app-button i { 
                margin-right: 6px; 
            }
            
            .toolbar-separator { 
                border-left: 1px solid var(--separator-color); 
                margin: 0 8px; 
                height: 20px; 
            }
            
            .toolbar-group {
                display: flex;
                margin: 0 5px;
            }

            /* --- Barra de Pesquisa e Filtros --- */
            .gantt-search-bar {
                padding: 8px 12px;
                background-color: var(--toolbar-bg);
                border-bottom: 1px solid var(--separator-color);
                display: flex;
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
            }
            
            .gantt-filter-select {
                background: var(--input-bg);
                border: 1px solid var(--button-border);
                border-radius: 4px;
                padding: 4px 8px;
                color: var(--text-color);
                font-size: 0.85em;
            }
            
            .app-input {
                padding: 6px 10px;
                border-radius: 4px;
                border: 1px solid var(--button-border);
                background: var(--input-bg);
                color: var(--text-color);
                font-size: 0.9em;
                flex: 1;
                max-width: 250px;
            }
            
            .assignee-dropdown {
                position: relative;
                display: inline-block;
            }
            
            .assignee-options {
                position: absolute;
                background: var(--context-menu-bg);
                border: 1px solid var(--separator-color);
                border-radius: 4px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 100;
                width: 100%;
                display: none;
            }
            
            .assignee-option {
                padding: 6px 10px;
                cursor: pointer;
            }
            
            .assignee-option:hover {
                background-color: var(--hover-highlight-color);
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
                min-width: 450px; 
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
                position: sticky;
                top: 0;
                background-color: var(--window-bg);
                z-index: 2;
            }
            
            .gantt-sidebar-body { 
                flex-grow: 1; 
                overflow-y: auto; 
                position: relative;
            }
            
            .gantt-task-row { 
                min-height: var(--gantt-row-height); 
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
                padding: 5px 0; 
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
            
            .task-cell input[type="date"] { 
                padding-right: 0; 
            }
            
            .task-cell input[type="number"] { 
                -moz-appearance: textfield; 
            }
            
            .task-cell input::-webkit-outer-spin-button, 
            .task-cell input::-webkit-inner-spin-button { 
                -webkit-appearance: none; 
                margin: 0; 
            }
            
            .task-name-cell { 
                gap: 5px; 
            }
            
            .task-expander { 
                width: 20px; 
                text-align: center; 
                cursor: pointer; 
                color: var(--secondary-text-color); 
                transition: transform 0.2s; 
                flex-shrink: 0; 
            }
            
            .task-expander.collapsed { 
                transform: rotate(-90deg); 
            }
            
            .task-icon { 
                margin: 0 4px; 
                flex-shrink: 0; 
            }
            
            .avatar { 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                color: white; 
                display: inline-flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 0.75em; 
                font-weight: 600; 
                margin-right: 8px; 
                flex-shrink: 0; 
            }
            
            .task-actions {
                display: flex;
                justify-content: center;
                gap: 5px;
            }
            
            .action-btn {
                padding: 4px;
                border-radius: 4px;
                cursor: pointer;
                color: var(--secondary-text-color);
                background: transparent;
                border: none;
            }
            
            .action-btn:hover {
                background-color: var(--hover-highlight-color);
                color: var(--text-color);
            }
            
            /* --- Divisor Redimensionável --- */
            .gantt-splitter { 
                width: 5px; 
                background: var(--separator-color); 
                cursor: col-resize; 
                transition: background-color 0.2s;
            }
            
            .gantt-splitter:hover, .gantt-splitter.dragging { 
                background: var(--accent-color); 
            }

            /* --- Área do Gráfico --- */
            .gantt-chart-area { 
                flex-grow: 1; 
                display: flex; 
                flex-direction: column; 
                overflow: hidden; 
            }
            
            .gantt-chart-header-container { 
                flex-shrink: 0; 
                position: sticky; 
                top: 0; 
                z-index: 4; 
                background-color: var(--toolbar-bg);
                overflow: hidden;
            }
            
            .gantt-timeline-header { 
                white-space: nowrap; 
                border-bottom: 1px solid var(--separator-color); 
                display: flex; 
                flex-direction: column;
                min-width: fit-content;
            }
            
            .gantt-timeline-months, .gantt-timeline-days { 
                display: flex; 
            }
            
            .gantt-timeline-month, .gantt-timeline-day { 
                text-align: center; 
                color: var(--secondary-text-color); 
                font-size: 0.8em; 
                border-right: 1px solid var(--separator-color); 
                box-sizing: border-box; 
                flex-shrink: 0; 
            }
            
            .gantt-timeline-month { 
                font-weight: 600; 
                padding: 5px 0; 
                border-top: 1px solid var(--separator-color); 
            }
            
            .gantt-timeline-day { 
                padding: 8px 0; 
            }
            
            .gantt-chart-viewport { 
                flex-grow: 1; 
                overflow: auto; 
                position: relative; 
            }
            
            .gantt-chart-content { 
                position: relative; 
            }
            
            .gantt-grid { 
                position: absolute; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                z-index: 0; 
            }
            
            .gantt-grid-line, .gantt-row-line, .gantt-grid-weekend { 
                position: absolute; 
            }
            
            .gantt-today-marker { 
                position: absolute; 
                top: 0; 
                width: 2px; 
                height: 100%; 
                background-color: var(--danger-color); 
                z-index: 2; 
                opacity: 0.9; 
            }
            
            .gantt-grid-line { 
                top: 0; 
                width: 1px; 
                height: 100%; 
                background-color: var(--separator-color); 
                opacity: 0.5; 
            }
            
            .gantt-row-line { 
                left: 0; 
                height: 1px; 
                width: 100%; 
                background-color: var(--separator-color); 
            }
            
            .gantt-grid-weekend { 
                top: 0; 
                height: 100%; 
                background-color: var(--separator-color); 
                opacity: 0.1; 
            }

            .gantt-bar-container { 
                position: absolute; 
                height: var(--gantt-row-height); 
                display: flex; 
                align-items: center; 
                z-index: 1;
            }
            
            .gantt-bar { 
                position: relative; 
                height: 28px; 
                background-color: var(--accent-color); 
                border-radius: 6px; 
                display: flex; 
                align-items: center; 
                color: white; 
                font-size: 0.85em; 
                white-space: nowrap; 
                overflow: hidden; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.2); 
                cursor: move; 
                transition: filter 0.2s; 
            }
            
            .gantt-bar:hover { 
                filter: brightness(1.1); 
            }
            
            .gantt-bar-progress { 
                position: absolute; 
                top: 0; 
                left: 0; 
                height: 100%; 
                background: rgba(0,0,0,0.25); 
                border-radius: 6px; 
                pointer-events: none; 
            }
            
            .gantt-bar-handle { 
                position: absolute; 
                top: 0; 
                width: 8px; 
                height: 100%; 
                z-index: 2; 
            }
            
            .gantt-bar-handle.left { 
                left: 0; 
                cursor: ew-resize; 
            }
            
            .gantt-bar-handle.right { 
                right: 0; 
                cursor: ew-resize; 
            }
            
            .gantt-bar-parent { 
                background-color: var(--gantt-parent-bar-color); 
                border-radius: 2px; 
                height: 12px; 
            }
            
            .gantt-bar-parent .gantt-bar-progress { 
                background-color: rgba(255,255,255,0.4); 
            }
            
            .gantt-milestone { 
                position: absolute; 
                width: 24px; 
                height: 24px; 
                background: var(--gantt-milestone-color); 
                transform: rotate(45deg); 
                top: 8px; 
                border-radius: 3px; 
                cursor: move; 
                transition: transform 0.2s; 
            }
            
            .gantt-milestone:hover { 
                transform: rotate(45deg) scale(1.1); 
            }
            
            .gantt-bar-label {
                z-index: 1;
                padding: 0 8px;
                pointer-events: none;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .status-todo { background-color: #a9a9a9; }
            .status-inprogress { background-color: #4a6cf7; }
            .status-done { background-color: #28a745; }
            .status-blocked { background-color: #dc3545; }
            .gantt-bar.critical { border: 2px solid var(--critical-color); }

            #ganttSvgOverlay { 
                position: absolute; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                pointer-events: none; 
                z-index: 1; 
            }
            
            .gantt-dependency-path { 
                stroke: var(--secondary-text-color); 
                stroke-width: 1.5; 
                fill: none; 
                opacity: 0.8; 
                marker-end: url(#arrowhead); 
            }
            
            .gantt-critical-path { 
                stroke: var(--critical-color) !important; 
                stroke-width: 2.5 !important; 
                opacity: 1 !important; 
            }

            /* --- Tooltip --- */
            .gantt-tooltip { 
                position: fixed; 
                background: var(--context-menu-bg); 
                color: var(--text-color); 
                border: 1px solid var(--separator-color); 
                border-radius: 8px; 
                padding: 10px; 
                z-index: 10000; 
                font-size: 0.9em; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.2); 
                pointer-events: none; 
                opacity: 0; 
                transition: opacity 0.2s; 
                max-width: 300px; 
            }
            
            .gantt-tooltip.visible { 
                opacity: 1; 
            }
            
            .gantt-tooltip-title { 
                font-weight: 600; 
                margin-bottom: 8px; 
                color: var(--accent-color);
            }
            
            .gantt-tooltip-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 4px; 
            }
            
            .gantt-tooltip-label { 
                color: var(--secondary-text-color); 
                margin-right: 15px; 
            }
            
            /* --- Context Menu --- */
            .gantt-context-menu {
                position: absolute;
                background: var(--context-menu-bg);
                border: 1px solid var(--separator-color);
                border-radius: 6px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                min-width: 180px;
            }
            
            .gantt-context-menu-item {
                padding: 8px 16px;
                cursor: pointer;
                font-size: 0.9em;
                display: flex;
                align-items: center;
            }
            
            .gantt-context-menu-item:hover {
                background-color: var(--hover-highlight-color);
            }
            
            .gantt-context-menu-item i {
                margin-right: 8px;
                width: 16px;
                text-align: center;
            }
            
            /* --- Status Indicators --- */
            .status-indicator {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 6px;
            }
        </style>

        <div class="app-toolbar">
            ${getStandardAppToolbarHTML()}
            <div class="toolbar-group">
                <button id="addTaskBtn_${uniqueSuffix}" class="app-button"><i class="fas fa-plus-circle"></i> Tarefa</button>
                <button id="addMilestoneBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-gem"></i> Marco</button>
                <button id="addParentBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-folder"></i> Grupo</button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <div class="toolbar-group">
                <button id="zoomOutBtn_${uniqueSuffix}" class="app-button secondary" title="Reduzir Zoom"><i class="fas fa-search-minus"></i></button>
                <button id="zoomInBtn_${uniqueSuffix}" class="app-button secondary" title="Aumentar Zoom"><i class="fas fa-search-plus"></i></button>
                <button id="todayBtn_${uniqueSuffix}" class="app-button secondary" title="Ir para Hoje"><i class="fas fa-calendar-day"></i></button>
                <button id="fitToScreenBtn_${uniqueSuffix}" class="app-button secondary" title="Ajustar ao Projeto"><i class="fas fa-compress"></i></button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <div class="toolbar-group">
                <button id="linkTasksBtn_${uniqueSuffix}" class="app-button secondary" title="Vincular Tarefas"><i class="fas fa-link"></i></button>
                <button id="criticalPathBtn_${uniqueSuffix}" class="app-button secondary" title="Mostrar Caminho Crítico"><i class="fas fa-bolt"></i></button>
                <button id="focusModeBtn_${uniqueSuffix}" class="app-button secondary" title="Modo de Foco"><i class="fas fa-crosshairs"></i></button>
            </div>
            
            <div style="flex-grow: 1;"></div>
            
            <div class="toolbar-group">
                <button id="exportBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-file-export"></i> Exportar</button>
            </div>
        </div>
        
        <!-- Nova barra de pesquisa e filtros -->
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
                    <!-- Opções serão preenchidas dinamicamente -->
                </select>
            </div>
            
            <button id="clearFiltersBtn_${uniqueSuffix}" class="app-button small">Limpar Filtros</button>
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
                             <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                               <path d="M 0 0 L 10 5 L 0 10 z" opacity="0.8" fill="var(--secondary-text-color)"/>
                             </marker>
                           </defs>
                        </svg>
                        <div class="gantt-grid" id="ganttGrid_${uniqueSuffix}"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Banner de modo foco -->
        <div class="focus-mode-banner" id="focusModeBanner_${uniqueSuffix}" style="display: none;">
            <span>Modo de Foco Ativo</span>
            <button id="exitFocusMode_${uniqueSuffix}" class="app-button small"><i class="fas fa-times"></i> Sair</button>
        </div>
        
        <div class="gantt-tooltip" id="ganttTooltip_${uniqueSuffix}"></div>
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
        editingTaskId: null,
        
        // --- Elementos da UI ---
        sidebarBody: winEl.querySelector(`#ganttSidebarBody_${uniqueSuffix}`),
        headerContainer: winEl.querySelector(`#ganttHeaderContainer_${uniqueSuffix}`),
        chartViewport: winEl.querySelector(`#ganttChartViewport_${uniqueSuffix}`),
        chartContent: winEl.querySelector(`#ganttChartContent_${uniqueSuffix}`),
        gridEl: winEl.querySelector(`#ganttGrid_${uniqueSuffix}`),
        svgOverlay: winEl.querySelector(`#ganttSvgOverlay`),
        tooltipEl: winEl.querySelector(`#ganttTooltip_${uniqueSuffix}`),
        splitter: winEl.querySelector(`#ganttSplitter_${uniqueSuffix}`),
        
        // --- Estado do Aplicativo ---
        timeline: { startDate: null, endDate: null, unitWidth: 40, totalWidth: 0 },
        flatTaskOrder: [],
        draggingState: null,

        // Novas propriedades
        allAssignees: [],
        filteredTasks: [],
        focusModeParentId: null,
        dependencyCreation: { active: false, fromTaskId: null },
        
        // --- Funções de Dados ---
        getData: function() { return this.tasks; },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString); 
                this.tasks = Array.isArray(data) ? data : []; 
                this.fileId = fileMeta.id; 
                this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
            } catch (e) { 
                showNotification("Erro ao ler arquivo Gantt.", 3000, 'error'); 
                console.error("Gantt Load Error:", e);
            } 
        },
        
        // --- Inicialização ---
        init: function() {
            setupAppToolbarActions(this);
            
            // Barra de Ferramentas
            winEl.querySelector(`#addTaskBtn_${uniqueSuffix}`).onclick = () => this.addTask();
            winEl.querySelector(`#addMilestoneBtn_${uniqueSuffix}`).onclick = () => this.addTask(true);
            winEl.querySelector(`#addParentBtn_${uniqueSuffix}`).onclick = () => this.addParentTask();
            winEl.querySelector(`#zoomOutBtn_${uniqueSuffix}`).onclick = () => this.zoomOut();
            winEl.querySelector(`#zoomInBtn_${uniqueSuffix}`).onclick = () => this.zoomIn();
            winEl.querySelector(`#todayBtn_${uniqueSuffix}`).onclick = () => this.goToToday();
            winEl.querySelector(`#fitToScreenBtn_${uniqueSuffix}`).onclick = () => this.fitToScreen();
            winEl.querySelector(`#linkTasksBtn_${uniqueSuffix}`).onclick = () => this.linkSelectedTasks();
            winEl.querySelector(`#criticalPathBtn_${uniqueSuffix}`).onclick = () => this.toggleCriticalPath();
            winEl.querySelector(`#focusModeBtn_${uniqueSuffix}`).onclick = () => this.toggleFocusMode();
            winEl.querySelector(`#exportBtn_${uniqueSuffix}`).onclick = () => this.exportToImage();

            // Eventos
            this.sidebarBody.addEventListener('input', (e) => this.handleSidebarInput(e));
            this.sidebarBody.addEventListener('click', (e) => this.handleSidebarClick(e));
            this.chartViewport.addEventListener('scroll', this.syncScroll.bind(this));
            this.sidebarBody.addEventListener('scroll', this.syncScroll.bind(this));
            this.chartContent.addEventListener('mousedown', (e) => this.handleBarInteraction(e));
            this.chartContent.addEventListener('mouseover', (e) => this.handleBarMouseOver(e));
            this.chartContent.addEventListener('mouseout', () => this.hideTooltip());
            this.chartContent.addEventListener('contextmenu', (e) => this.showContextMenu(e));
            
            this.setupSplitter();
            
            // Novas inicializações
            this.initDragAndDrop();
            this.initScrollZoom();
            this.initBarEditing();
            this.initDependencyCreation();
            this.initFilters();
            this.initFocusMode();
            this.initKeyboardShortcuts();
            
            this.renderAll();
            
            // Inicializar dropdown de responsáveis após o primeiro render
            setTimeout(() => {
                this.updateAssigneeFilter();
            }, 100);
        },

        // --- Lógica de Renderização Principal ---
        renderAll: function() {
            // Salva o estado do campo de edição (foco, cursor) antes de redesenhar
            const editingState = this.saveEditingState();
            
            this.updateParentTasks();
            this.calculateTimeline();
            this.flatTaskOrder = this.getFlatTaskOrder();
            this.renderSidebar();
            this.renderChart();
            this.renderDependencies();
            if (this.showCriticalPath) {
                this.calculateAndDrawCriticalPath();
            }

            // Atualizar banner de modo foco
            const focusBanner = winEl.querySelector(`#focusModeBanner_${uniqueSuffix}`);
            if (this.focusModeParentId) {
                const parentTask = this.tasks.find(t => t.id === this.focusModeParentId);
                if (parentTask) {
                    focusBanner.style.display = 'flex';
                    focusBanner.querySelector('span').textContent = `Modo de Foco: ${parentTask.name}`;
                } else {
                    this.focusModeParentId = null;
                    focusBanner.style.display = 'none';
                }
            } else {
                focusBanner.style.display = 'none';
            }

            // Restaura o foco e o cursor no campo que estava sendo editado
            this.restoreEditingState(editingState);
        },
        
        // --- Funções Auxiliares de Data e Cálculo ---
        daysBetween: (d1, d2) => {
            const date1 = new Date(d1);
            const date2 = new Date(d2);
            date1.setUTCHours(0, 0, 0, 0);
            date2.setUTCHours(0, 0, 0, 0);
            return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
        },
        
        addDays: (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },
        
        formatDate: (dateStr) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),

        // --- Linha do Tempo e Zoom ---
        calculateTimeline: function() {
            if (this.tasks.length === 0) {
                const today = new Date();
                this.timeline.startDate = this.addDays(today, -7);
                this.timeline.endDate = this.addDays(today, 30);
                return;
            }
            
            let minDate = null, maxDate = null;
            this.tasks.forEach(t => {
                if (t.type === 'parent') return;
                const start = new Date(t.start);
                const end = t.end ? new Date(t.end) : new Date(t.start);
                if (!minDate || start < minDate) minDate = start;
                if (!maxDate || end > maxDate) maxDate = end;
            });
            
            this.timeline.startDate = this.addDays(minDate, -7);
            this.timeline.endDate = this.addDays(maxDate, 14);
        },
        
        zoomIn: function() { 
            this.timeline.unitWidth = Math.min(100, this.timeline.unitWidth + 10); 
            this.renderAll(); 
        },
        
        zoomOut: function() { 
            this.timeline.unitWidth = Math.max(20, this.timeline.unitWidth - 10); 
            this.renderAll(); 
        },
        
        goToToday: function() {
            const { startDate, unitWidth } = this.timeline;
            const todayOffset = this.daysBetween(startDate, new Date()) * unitWidth;
            this.chartViewport.scrollLeft = todayOffset - this.chartViewport.offsetWidth / 2;
        },
        
        toggleCriticalPath: function() {
            this.showCriticalPath = !this.showCriticalPath;
            this.renderAll();
        },
        
        fitToScreen: function() {
            if (this.tasks.length === 0) return;
            
            const viewportWidth = this.chartViewport.clientWidth;
            const totalDays = this.daysBetween(this.timeline.startDate, this.timeline.endDate);
            const newUnitWidth = Math.max(20, Math.min(100, viewportWidth / totalDays));
            
            this.timeline.unitWidth = newUnitWidth;
            this.renderAll();
        },

        // --- Renderização da Barra Lateral ---
        renderSidebar: function() {
            this.sidebarBody.innerHTML = '';
            const renderTaskNode = (task, level) => {
                const row = document.createElement('div');
                row.className = 'gantt-task-row';
                if (this.selectedTaskId === task.id) {
                    row.classList.add('selected');
                }
                row.dataset.taskId = task.id;
                row.draggable = true;
                
                const children = this.tasks.filter(t => t.parentId === task.id);
                const isParent = task.type === 'parent' || children.length > 0;
                task.type = isParent ? 'parent' : task.type;

                const expanderHTML = isParent ? 
                    `<span class="task-expander ${task.collapsed ? 'collapsed' : ''}">
                        <i class="fas fa-angle-down"></i>
                    </span>` : 
                    '<span class="task-expander"></span>';
                
                const icon = task.type === 'milestone' ? 'fa-gem' : 
                             isParent ? 'fa-folder' : 'fa-tasks';
                
                const duration = isParent ? '-' : (this.daysBetween(task.start, task.end) + 1) + 'd';
                const progress = task.progress || 0;
                const statusIndicator = task.type !== 'parent' ? 
                    `<span class="status-indicator status-${task.status || 'todo'}"></span>` : '';

                row.innerHTML = `
                    <div class="task-cell task-name-cell" style="padding-left: ${level * 25 + 5}px;">
                        ${expanderHTML}
                        <i class="fas ${icon} task-icon" 
                           style="color: ${isParent ? 'var(--gantt-parent-bar-color)' : 
                                  task.type === 'milestone' ? 'var(--gantt-milestone-color)' : 
                                  'var(--accent-color)'};"></i>
                        <input type="text" value="${task.name}" data-field="name" 
                               ${isParent ? 'readonly' : ''} title="${task.name}">
                    </div>
                    <div class="task-cell"><span>${duration}</span></div>
                    <div class="task-cell">
                        <input type="number" min="0" max="100" value="${progress}" 
                               data-field="progress" ${isParent ? 'readonly' : ''}>
                    </div>
                    <div class="task-cell" title="${task.assignee || ''}">
                        ${this.generateAvatar(task.assignee)}
                        <input type="text" value="${task.assignee || ''}" 
                               data-field="assignee" placeholder="-" ${isParent ? 'readonly' : ''}>
                    </div>
                    <div class="task-cell">
                        <input type="date" value="${task.start}" 
                               data-field="start" ${isParent ? 'readonly' : ''}>
                    </div>
                    <div class="task-cell">
                        <input type="date" value="${task.end}" 
                               data-field="end" ${isParent || task.type === 'milestone' ? 'readonly' : ''}>
                    </div>
                    <div class="task-cell task-actions">
                        <button class="action-btn" data-action="remove" title="Remover">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="action-btn" data-action="add-child" title="Adicionar Subtarefa">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
                this.sidebarBody.appendChild(row);

                if (isParent && !task.collapsed) {
                    children.sort((a,b) => new Date(a.start) - new Date(b.start))
                        .forEach(child => renderTaskNode(child, level + 1));
                }
            };
            
            // Usar tarefas filtradas se houver filtro ativo
            const tasksToRender = this.filteredTasks.length > 0 ? this.filteredTasks : this.tasks;
            
            tasksToRender.filter(t => !t.parentId)
                .sort((a,b) => new Date(a.start) - new Date(b.start))
                .forEach(task => renderTaskNode(task, 0));
        },
        
        // --- Renderização do Gráfico ---
        renderChart: function() {
            const { startDate, endDate, unitWidth } = this.timeline;
            if (!startDate) return;

            const totalDays = this.daysBetween(startDate, endDate);
            this.timeline.totalWidth = totalDays * unitWidth;

            this.headerContainer.innerHTML = '';
            this.gridEl.innerHTML = '';
            this.chartContent.querySelectorAll('.gantt-bar-container, .gantt-today-marker').forEach(el => el.remove());

            // --- Renderizar Cabeçalho e Grade ---
            const headerEl = document.createElement('div');
            headerEl.className = 'gantt-timeline-header';
            const monthsEl = document.createElement('div'); 
            monthsEl.className = 'gantt-timeline-months';
            const daysEl = document.createElement('div'); 
            daysEl.className = 'gantt-timeline-days';
            
            let currentMonth = -1, monthDayCount = 0, currentMonthEl = null;
            for (let i = 0; i < totalDays; i++) {
                const dayDate = this.addDays(startDate, i);
                if (dayDate.getMonth() !== currentMonth) {
                    if(currentMonthEl) currentMonthEl.style.width = `${monthDayCount * unitWidth}px`;
                    currentMonth = dayDate.getMonth();
                    monthDayCount = 0;
                    const monthName = dayDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                    currentMonthEl = document.createElement('div');
                    currentMonthEl.className = 'gantt-timeline-month';
                    currentMonthEl.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    monthsEl.appendChild(currentMonthEl);
                }
                monthDayCount++;

                const dayEl = document.createElement('div');
                dayEl.className = 'gantt-timeline-day';
                dayEl.style.width = `${unitWidth}px`;
                dayEl.textContent = dayDate.getDate();
                daysEl.appendChild(dayEl);

                const gridLine = document.createElement('div');
                gridLine.className = 'gantt-grid-line';
                gridLine.style.left = `${i * unitWidth}px`;
                this.gridEl.appendChild(gridLine);

                const dayOfWeek = dayDate.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    const weekendEl = document.createElement('div');
                    weekendEl.className = 'gantt-grid-weekend';
                    weekendEl.style.left = `${i * unitWidth}px`;
                    weekendEl.style.width = `${unitWidth}px`;
                    this.gridEl.appendChild(weekendEl);
                }
            }
            
            if(currentMonthEl) currentMonthEl.style.width = `${monthDayCount * unitWidth}px`;
            headerEl.appendChild(monthsEl);
            headerEl.appendChild(daysEl);
            this.headerContainer.appendChild(headerEl);

            // --- Renderizar Linhas de Linha e Barras ---
            this.flatTaskOrder.forEach((taskId, index) => {
                const task = this.tasks.find(t => t.id === taskId);
                if (!task) return;

                const rowLine = document.createElement('div');
                rowLine.className = 'gantt-row-line';
                rowLine.style.top = `${index * 40 + 39}px`;
                this.gridEl.appendChild(rowLine);
                
                if (task.type === 'parent' && task.collapsed) return;

                const taskStart = new Date(task.start);
                const left = this.daysBetween(startDate, taskStart) * unitWidth;

                const barContainer = document.createElement('div');
                barContainer.className = 'gantt-bar-container';
                barContainer.style.top = `${index * 40}px`;
                barContainer.dataset.taskId = task.id;
                
                if (task.id === this.selectedTaskId) {
                    barContainer.classList.add('selected');
                }

                if (task.type === 'milestone') {
                    barContainer.style.left = `${left}px`;
                    barContainer.innerHTML = `<div class="gantt-milestone"></div>`;
                } else {
                    const taskEnd = new Date(task.end);
                    const duration = this.daysBetween(taskStart, taskEnd) + 1;
                    const width = duration * unitWidth;
                    barContainer.style.left = `${left}px`;
                    barContainer.style.width = `${width}px`;

                    const barClass = task.type === 'parent' ? 'gantt-bar-parent' : `status-${task.status || 'todo'}`;
                    const progress = task.type === 'parent' ? (task.progress || 0) : (task.status === 'done' ? 100 : (task.progress || 0));

                    barContainer.innerHTML = `
                        <div class="gantt-bar ${barClass}">
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle left"></div>' : ''}
                            <div class="gantt-bar-progress" style="width: ${progress}%"></div>
                            <span class="gantt-bar-label">${task.name}</span>
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle right"></div>' : ''}
                        </div>
                    `;
                }
                this.chartContent.appendChild(barContainer);
            });
            
            // --- Renderizar Marcador de Hoje ---
            const today = new Date();
            if (today >= startDate && today <= endDate) {
                const todayOffset = this.daysBetween(startDate, today) * unitWidth;
                const todayMarker = document.createElement('div');
                todayMarker.className = 'gantt-today-marker';
                todayMarker.style.left = `${todayOffset}px`;
                todayMarker.style.height = `${this.flatTaskOrder.length * 40}px`;
                this.chartContent.appendChild(todayMarker);
            }

            // Ajustar tamanho do conteúdo
            const contentHeight = this.flatTaskOrder.length * 40;
            this.chartContent.style.width = `${this.timeline.totalWidth}px`;
            this.chartContent.style.height = `${contentHeight}px`;
            this.svgOverlay.setAttribute('width', this.timeline.totalWidth);
            this.svgOverlay.setAttribute('height', contentHeight);
        },

        // --- Lógica de Dependência e Caminho Crítico ---
        renderDependencies: function() {
            this.svgOverlay.querySelectorAll('path').forEach(p => p.remove());
            const barElements = {};
            this.chartContent.querySelectorAll('.gantt-bar-container').forEach(b => { 
                barElements[b.dataset.taskId] = b; 
            });
            
            const getTaskIndex = (taskId) => this.flatTaskOrder.indexOf(taskId);

            this.tasks.forEach(task => {
                if(task.dependencies) {
                    const deps = task.dependencies.split(',').map(d => d.trim());
                    deps.forEach(depId => {
                        const predecessor = this.tasks.find(t => t.id === depId);
                        if(!predecessor || !barElements[task.id] || !barElements[predecessor.id]) return;

                        const fromEl = barElements[predecessor.id];
                        const toEl = barElements[task.id];
                        
                        const fromIndex = getTaskIndex(predecessor.id);
                        const toIndex = getTaskIndex(task.id);

                        const fromX = fromEl.offsetLeft + (predecessor.type === 'milestone' ? 12 : fromEl.offsetWidth);
                        const fromY = fromIndex * 40 + 20;
                        const toX = toEl.offsetLeft + (task.type === 'milestone' ? 12 : 0);
                        const toY = toIndex * 40 + 20;
                        
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        const d = `M ${fromX} ${fromY} L ${fromX + 15} ${fromY} L ${fromX + 15} ${toY} L ${toX} ${toY}`;
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
            const tasks = this.tasks.filter(t => t.type !== 'parent');
            if (tasks.length === 0) return;

            tasks.forEach(t => {
                t.earlyStart = 0;
                t.earlyFinish = 0;
                t.lateStart = Infinity;
                t.lateFinish = Infinity;
                t.duration = this.daysBetween(t.start, t.end) + 1;
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

            const forwardPassQueue = tasks.filter(t => !t.dependencies || t.dependencies.trim() === '');
            const processedForward = new Set();
            while(forwardPassQueue.length > 0){
                const u = forwardPassQueue.shift();
                if(processedForward.has(u.id)) continue;
                processedForward.add(u.id);

                u.earlyFinish = u.earlyStart + u.duration;
                (adj.get(u.id) || []).forEach(vId => {
                    const v = taskMap.get(vId);
                    v.earlyStart = Math.max(v.earlyStart, u.earlyFinish);
                    const allDepsProcessed = (v.dependencies || '')
                        .split(',')
                        .map(d => d.trim())
                        .filter(d => d)
                        .every(depId => processedForward.has(depId));
                    if(allDepsProcessed) forwardPassQueue.push(v);
                });
            }

            const projectFinishTime = Math.max(0, ...tasks.map(t => t.earlyFinish));
            tasks.forEach(t => t.lateFinish = projectFinishTime);

            const backwardPassQueue = tasks.filter(t => !(adj.get(t.id) || []).length);
            const processedBackward = new Set();
            while(backwardPassQueue.length > 0){
                const u = backwardPassQueue.shift();
                if(processedBackward.has(u.id)) continue;
                processedBackward.add(u.id);

                u.lateStart = u.lateFinish - u.duration;
                (revAdj.get(u.id) || []).forEach(pId => {
                    const p = taskMap.get(pId);
                    p.lateFinish = Math.min(p.lateFinish, u.lateStart);
                    const allSuccsProcessed = (adj.get(p.id) || []).every(succId => processedBackward.has(succId));
                    if(allSuccsProcessed) backwardPassQueue.push(p);
                });
            }
            
            const criticalPathTaskIds = new Set();
            this.chartContent.querySelectorAll('.gantt-bar.critical').forEach(el => el.classList.remove('critical'));
            tasks.forEach(t => {
                const slack = t.lateStart - t.earlyStart;
                if (slack < 0.01) {
                    criticalPathTaskIds.add(t.id);
                    const barEl = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${t.id}"] .gantt-bar`);
                    if (barEl) barEl.classList.add('critical');
                }
            });

            this.svgOverlay.querySelectorAll('.gantt-dependency-path').forEach(path => {
                const { fromId, toId } = path.dataset;
                if (criticalPathTaskIds.has(fromId) && criticalPathTaskIds.has(toId)) {
                    path.classList.add('gantt-critical-path');
                } else {
                    path.classList.remove('gantt-critical-path');
                }
            });
        },

        // --- Adicionar e Manipular Tarefas ---
        addTask: function(isMilestone = false) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const endStr = this.addDays(today, isMilestone ? 0 : 5).toISOString().split('T')[0];

            const newTask = {
                id: generateId('task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start: todayStr, 
                end: endStr,
                assignee: '', 
                status: 'todo', 
                progress: 0, 
                dependencies: '',
                type: isMilestone ? 'milestone' : 'task',
                parentId: this.selectedTaskId || null
            };
            
            this.tasks.push(newTask);
            this.markDirty();
            this.updateAssigneeFilter();
            this.renderAll();
        },
        
        addParentTask: function() {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const endStr = this.addDays(today, 7).toISOString().split('T')[0];

            const newTask = {
                id: generateId('parent'),
                name: 'Novo Grupo',
                start: todayStr, 
                end: endStr,
                assignee: '', 
                status: 'todo', 
                progress: 0, 
                dependencies: '',
                type: 'parent',
                parentId: null,
                collapsed: false
            };
            
            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
        },
        
        removeTask: function(taskId) {
            // Encontrar a tarefa
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) return;
            
            // Remover dependências relacionadas
            this.tasks.forEach(t => {
                if (t.dependencies) {
                    const deps = t.dependencies.split(',').map(d => d.trim());
                    const newDeps = deps.filter(d => d !== taskId);
                    t.dependencies = newDeps.join(',');
                }
            });
            
            // Remover a tarefa
            this.tasks.splice(taskIndex, 1);
            
            // Remover seleção se necessário
            if (this.selectedTaskId === taskId) {
                this.selectedTaskId = null;
            }
            
            this.markDirty();
            this.updateAssigneeFilter();
            this.renderAll();
        },
        
        updateParentTasks: function() {
            const processNode = (task) => {
                const children = this.tasks.filter(c => c.parentId === task.id);
                if (children.length > 0) {
                    children.forEach(processNode); // Process children first

                    const startDates = children.map(c => new Date(c.start));
                    const endDates = children.map(c => new Date(c.end));
                    task.start = new Date(Math.min(...startDates)).toISOString().split('T')[0];
                    task.end = new Date(Math.max(...endDates)).toISOString().split('T')[0];
                    
                    const totalProgress = children.reduce((sum, c) => sum + (c.progress || 0), 0);
                    task.progress = Math.round(totalProgress / children.length);
                }
            };
            this.tasks.filter(t => t.type === 'parent').forEach(processNode);
        },

        // --- Manipuladores de Eventos ---
        handleSidebarInput: function(e) {
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = e.target.dataset.field;
            const task = this.tasks.find(t => t.id === taskId);
            
            if (task) {
                // Define o ID da tarefa sendo editada para que o foco possa ser restaurado
                this.editingTaskId = taskId;
                
                // Atualiza o modelo de dados com o valor do input
                task[field] = e.target.value;

                if (field === 'start' && task.type !== 'milestone') {
                    const duration = this.daysBetween(task.start, task.end);
                    if (duration < 0) task.end = task.start;
                }
                
                this.markDirty();
                
                // Chama o renderizador principal, que agora preservará o foco.
                this.renderAll();
            }
        },
        
        handleSidebarClick: function(e) {
            const expander = e.target.closest('.task-expander');
            if(expander) {
                const row = e.target.closest('.gantt-task-row');
                const taskId = row.dataset.taskId;
                const task = this.tasks.find(t => t.id === taskId);
                if (task && task.type === 'parent') {
                    task.collapsed = !task.collapsed;
                    this.markDirty();
                    this.renderAll();
                }
                return;
            }
            
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const row = actionBtn.closest('.gantt-task-row');
                const taskId = row.dataset.taskId;
                
                if (action === 'remove') {
                    if (confirm('Tem certeza que deseja remover esta tarefa?')) {
                        this.removeTask(taskId);
                    }
                } else if (action === 'add-child') {
                    this.selectedTaskId = taskId;
                    this.addTask();
                }
                return;
            }
            
            const row = e.target.closest('.gantt-task-row');
            if (row) {
                const taskId = row.dataset.taskId;

                // Se o clique não foi em um campo de input,
                // significa que o usuário está apenas selecionando a linha, não editando.
                // Limpamos o estado de edição para evitar que o foco volte para um campo.
                if (e.target.tagName.toLowerCase() !== 'input' && e.target.tagName.toLowerCase() !== 'select') {
                    this.editingTaskId = null;
                }
                
                this.selectedTaskId = taskId;
                this.renderAll();
            }
        },
        
        handleBarInteraction: function(e) {
            const bar = e.target.closest('.gantt-bar, .gantt-milestone');
            if (!bar) return;

            const container = bar.closest('.gantt-bar-container');
            const taskId = container.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if (!task || task.type === 'parent') return;

            this.hideTooltip();
            const initialX = e.clientX;
            const initialStart = new Date(task.start);
            const initialEnd = new Date(task.end);
            const handle = e.target.classList.contains('gantt-bar-handle') ? 
                e.target.className.includes('left') ? 'left' : 'right' : null;
            
            // Atualizar seleção
            this.selectedTaskId = taskId;
            this.renderAll();
            
            const onMouseMove = (moveE) => {
                const deltaX = moveE.clientX - initialX;
                const deltaDays = Math.round(deltaX / this.timeline.unitWidth);

                if (handle === 'left') {
                    const newStart = this.addDays(initialStart, deltaDays);
                    if (newStart <= initialEnd) {
                        task.start = newStart.toISOString().split('T')[0];
                    }
                } else if (handle === 'right') {
                    const newEnd = this.addDays(initialEnd, deltaDays);
                    if (newEnd >= new Date(task.start)) {
                        task.end = newEnd.toISOString().split('T')[0];
                    }
                } else { // Mover barra inteira
                    task.start = this.addDays(initialStart, deltaDays).toISOString().split('T')[0];
                    task.end = this.addDays(initialEnd, deltaDays).toISOString().split('T')[0];
                }
                this.renderAll();
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                this.markDirty();
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        
        handleBarMouseOver: function(e) {
            const barContainer = e.target.closest('.gantt-bar-container');
            if (barContainer) {
                const taskId = barContainer.dataset.taskId;
                const task = this.tasks.find(t => t.id === taskId);
                if (task) this.showTooltip(e, task);
            }
        },
        
        syncScroll: function(e) {
            if (e.target === this.chartViewport) {
                this.sidebarBody.scrollTop = this.chartViewport.scrollTop;
                this.headerContainer.scrollLeft = this.chartViewport.scrollLeft;
            } else {
                this.chartViewport.scrollTop = this.sidebarBody.scrollTop;
            }
        },
        
        showContextMenu: function(e) {
            e.preventDefault();
            
            const barContainer = e.target.closest('.gantt-bar-container');
            if (!barContainer) return;
            
            const taskId = barContainer.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            this.selectedTaskId = taskId;
            
            // Remover menu de contexto anterior
            const existingMenu = document.querySelector('.gantt-context-menu');
            if (existingMenu) existingMenu.remove();
            
            const menu = document.createElement('div');
            menu.className = 'gantt-context-menu';
            menu.style.left = `${e.pageX}px`;
            menu.style.top = `${e.pageY}px`;
            
            menu.innerHTML = `
                <div class="gantt-context-menu-item" data-action="delete">
                    <i class="fas fa-trash"></i> Remover Tarefa
                </div>
                <div class="gantt-context-menu-item" data-action="add-dependency">
                    <i class="fas fa-link"></i> Adicionar Dependência
                </div>
                <div class="gantt-context-menu-item" data-action="mark-done">
                    <i class="fas fa-check-circle"></i> Marcar como Concluída
                </div>
                <div class="gantt-context-menu-item" data-action="add-subtask">
                    <i class="fas fa-plus-circle"></i> Adicionar Subtarefa
                </div>
            `;
            
            document.body.appendChild(menu);
            
            // Fechar menu ao clicar em qualquer lugar
            const closeMenu = () => {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            };
            
            document.addEventListener('click', closeMenu);
            
            // Lidar com ações do menu
            menu.querySelectorAll('.gantt-context-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    
                    if (action === 'delete') {
                        this.removeTask(taskId);
                    } else if (action === 'add-dependency') {
                        this.promptForDependency(taskId);
                    } else if (action === 'mark-done') {
                        task.status = 'done';
                        task.progress = 100;
                        this.markDirty();
                        this.renderAll();
                    } else if (action === 'add-subtask') {
                        this.addTask();
                    }
                    
                    closeMenu();
                });
            });
        },
        
        promptForDependency: function(taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const depId = prompt("Digite o ID da tarefa dependente:", task.dependencies || '');
            if (depId === null) return;
            
            // Validar se o ID existe
            const depTask = this.tasks.find(t => t.id === depId);
            if (!depTask) {
                showNotification("ID da tarefa não encontrado!", 3000, 'error');
                return;
            }
            
            // Adicionar dependência
            const deps = task.dependencies ? task.dependencies.split(',') : [];
            if (!deps.includes(depId)) {
                deps.push(depId);
                task.dependencies = deps.join(',');
                this.markDirty();
                this.renderAll();
                showNotification("Dependência adicionada com sucesso!", 2000);
            }
        },
        
        linkSelectedTasks: function() {
            if (!this.selectedTaskId) {
                showNotification("Selecione uma tarefa primeiro!", 3000, 'warning');
                return;
            }
            
            const taskId = prompt("Digite o ID da tarefa para vincular:", "");
            if (!taskId) return;
            
            const task = this.tasks.find(t => t.id === this.selectedTaskId);
            const depTask = this.tasks.find(t => t.id === taskId);
            
            if (!task || !depTask) {
                showNotification("ID da tarefa não encontrado!", 3000, 'error');
                return;
            }
            
            // Adicionar dependência
            const deps = task.dependencies ? task.dependencies.split(',') : [];
            if (!deps.includes(taskId)) {
                deps.push(taskId);
                task.dependencies = deps.join(',');
                this.markDirty();
                this.renderAll();
                showNotification("Tarefas vinculadas com sucesso!", 2000);
            }
        },
        
        exportToImage: function() {
            const container = this.chartContent;
            html2canvas(container).then(canvas => {
                const link = document.createElement('a');
                link.download = `gantt-chart-${new Date().toISOString().slice(0, 10)}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        },

        // --- Funções Utilitárias ---
        showTooltip: function(e, task) {
            const duration = this.daysBetween(task.start, task.end) + 1;
            const statusText = {
                'todo': 'A Fazer',
                'inprogress': 'Em Progresso',
                'done': 'Concluída',
                'blocked': 'Bloqueada'
            }[task.status] || 'Não Definido';
            
            this.tooltipEl.innerHTML = `
                <div class="gantt-tooltip-title">${task.name}</div>
                <div class="gantt-tooltip-row">
                    <span class="gantt-tooltip-label">Status:</span>
                    <span><span class="status-indicator status-${task.status || 'todo'}"></span> ${statusText}</span>
                </div>
                <div class="gantt-tooltip-row">
                    <span class="gantt-tooltip-label">Início:</span>
                    <span>${this.formatDate(task.start)}</span>
                </div>
                <div class="gantt-tooltip-row">
                    <span class="gantt-tooltip-label">Fim:</span>
                    <span>${this.formatDate(task.end)}</span>
                </div>
                <div class="gantt-tooltip-row">
                    <span class="gantt-tooltip-label">Duração:</span>
                    <span>${duration} dia${duration > 1 ? 's' : ''}</span>
                </div>
                <div class="gantt-tooltip-row">
                    <span class="gantt-tooltip-label">Progresso:</span>
                    <span>${task.progress || 0}%</span>
                </div>
                 <div class="gantt-tooltip-row">
                    <span class="gantt-tooltip-label">Responsável:</span>
                    <span>${task.assignee || '-'}</span>
                </div>
                ${task.dependencies ? `
                <div class="gantt-tooltip-row">
                    <span class="gantt-tooltip-label">Dependências:</span>
                    <span>${task.dependencies.split(',').join(', ')}</span>
                </div>` : ''}
            `;
            this.tooltipEl.style.left = `${e.clientX + 15}px`;
            this.tooltipEl.style.top = `${e.clientY + 15}px`;
            this.tooltipEl.classList.add('visible');
        },
        
        hideTooltip: function() { 
            this.tooltipEl.classList.remove('visible'); 
        },
        
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
            const visibleTasks = this.filteredTasks.length > 0 ? 
                this.filteredTasks : 
                this.tasks;
            
            const processNode = (task) => {
                // Verificar se está no modo foco
                if (this.focusModeParentId && task.parentId !== this.focusModeParentId) {
                    return;
                }
                
                order.push(task.id);
                if (task.type === 'parent' && !task.collapsed) {
                    visibleTasks.filter(t => t.parentId === task.id)
                        .sort((a,b) => new Date(a.start) - new Date(b.start))
                        .forEach(processNode);
                }
            };
            
            visibleTasks.filter(t => 
                !t.parentId && 
                (!this.focusModeParentId || t.id === this.focusModeParentId)
            )
            .sort((a,b) => new Date(a.start) - new Date(b.start))
            .forEach(processNode);
            
            return order;
        },
        
        saveEditingState: function() {
            if (!this.editingTaskId) return null;

            const activeEl = document.activeElement;
            const row = activeEl ? activeEl.closest('.gantt-task-row') : null;

            if (!row || row.dataset.taskId !== this.editingTaskId || !activeEl.dataset.field) {
                this.editingTaskId = null;
                return null;
            }

            return {
                taskId: this.editingTaskId,
                field: activeEl.dataset.field,
                selectionStart: activeEl.selectionStart,
                selectionEnd: activeEl.selectionEnd,
            };
        },

        restoreEditingState: function(state) {
            if (!state || !state.taskId || !state.field) {
                this.editingTaskId = null;
                return;
            }

            const row = this.sidebarBody.querySelector(`.gantt-task-row[data-task-id="${state.taskId}"]`);
            if (!row) {
                this.editingTaskId = null;
                return;
            }

            const inputToFocus = row.querySelector(`[data-field="${state.field}"]`);
            if (inputToFocus) {
                inputToFocus.focus();
                if (typeof inputToFocus.setSelectionRange === 'function') {
                    inputToFocus.setSelectionRange(state.selectionStart, state.selectionEnd);
                }
            } else {
                this.editingTaskId = null;
            }
        },
        
        setupSplitter: function() {
            const splitter = this.splitter;
            const sidebar = splitter.previousElementSibling;
            let isDragging = false;
            let startX, startWidth;
            
            splitter.addEventListener('mousedown', (e) => {
                isDragging = true;
                splitter.classList.add('dragging');
                startX = e.clientX;
                startWidth = sidebar.offsetWidth;
                e.preventDefault();
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            
            const onMouseMove = (e) => {
                if (!isDragging) return;
                const newWidth = startWidth + (e.clientX - startX);
                if (newWidth > 300 && newWidth < window.innerWidth - 300) {
                    sidebar.style.width = `${newWidth}px`;
                }
            };
            
            const onMouseUp = () => {
                isDragging = false;
                splitter.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                // Re-renderar ao final para ajustar o gráfico ao novo tamanho
                this.renderAll();
            };
        },
        
        // NOVOS MÉTODOS ADICIONADOS PARA MELHORIAS
        
        // 1. Drag and drop para hierarquia
        initDragAndDrop: function() {
            this.sidebarBody.addEventListener('dragstart', e => {
                const row = e.target.closest('.gantt-task-row');
                if (row) {
                    e.dataTransfer.setData('text/plain', row.dataset.taskId);
                    e.dataTransfer.effectAllowed = 'move';
                }
            });
            
            this.sidebarBody.addEventListener('dragover', e => {
                e.preventDefault();
                const row = e.target.closest('.gantt-task-row');
                if (row) {
                    const rect = row.getBoundingClientRect();
                    const middleY = rect.top + rect.height / 2;
                    
                    if (e.clientY < middleY) {
                        row.classList.add('drag-over-top');
                        row.classList.remove('drag-over-bottom');
                    } else {
                        row.classList.add('drag-over-bottom');
                        row.classList.remove('drag-over-top');
                    }
                }
            });
            
            this.sidebarBody.addEventListener('dragleave', e => {
                const row = e.target.closest('.gantt-task-row');
                if (row) {
                    row.classList.remove('drag-over-top', 'drag-over-bottom');
                }
            });
            
            this.sidebarBody.addEventListener('drop', e => {
                e.preventDefault();
                const draggedTaskId = e.dataTransfer.getData('text/plain');
                const targetRow = e.target.closest('.gantt-task-row');
                
                if (targetRow && draggedTaskId) {
                    const targetTaskId = targetRow.dataset.taskId;
                    const draggedTask = this.tasks.find(t => t.id === draggedTaskId);
                    const targetTask = this.tasks.find(t => t.id === targetTaskId);
                    
                    if (draggedTask && targetTask) {
                        // Determinar posicionamento
                        const rect = targetRow.getBoundingClientRect();
                        const middleY = rect.top + rect.height / 2;
                        
                        if (e.clientY < middleY) {
                            // Inserir acima
                            this.reparentTask(draggedTaskId, targetTask.parentId, targetTaskId, 'before');
                        } else {
                            // Inserir abaixo ou como filho
                            if (targetTask.type === 'parent') {
                                // Tornar filho
                                this.reparentTask(draggedTaskId, targetTaskId);
                            } else {
                                // Inserir abaixo
                                this.reparentTask(draggedTaskId, targetTask.parentId, targetTaskId, 'after');
                            }
                        }
                    }
                    
                    targetRow.classList.remove('drag-over-top', 'drag-over-bottom');
                }
            });
        },
        
        reparentTask: function(taskId, newParentId, referenceTaskId = null, position = 'child') {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            // Remover de antigo pai
            const oldParentId = task.parentId;
            
            // Atualizar parentId
            task.parentId = newParentId;
            
            // Reordenar na nova posição
            if (referenceTaskId && position) {
                const parentTasks = this.tasks.filter(t => t.parentId === newParentId);
                const referenceIndex = parentTasks.findIndex(t => t.id === referenceTaskId);
                
                if (referenceIndex !== -1) {
                    // Reordenar array
                    const newIndex = position === 'before' ? referenceIndex : referenceIndex + 1;
                    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
                    
                    // Remover da posição atual
                    this.tasks.splice(taskIndex, 1);
                    
                    // Encontrar nova posição
                    const newPos = this.tasks.findIndex(t => t.id === referenceTaskId);
                    this.tasks.splice(position === 'before' ? newPos : newPos + 1, 0, task);
                }
            }
            
            // Atualizar pais
            this.updateParentTasks();
            this.markDirty();
            this.renderAll();
        },
        
        // 2. Zoom com scroll
        initScrollZoom: function() {
            this.chartViewport.addEventListener('wheel', e => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                        this.zoomIn();
                    } else {
                        this.zoomOut();
                    }
                }
            }, { passive: false });
        },
        
        // 3. Edição direta no gráfico
        initBarEditing: function() {
            this.chartContent.addEventListener('dblclick', e => {
                const barContainer = e.target.closest('.gantt-bar-container');
                if (barContainer) {
                    const taskId = barContainer.dataset.taskId;
                    const task = this.tasks.find(t => t.id === taskId);
                    
                    if (task && task.type !== 'parent') {
                        // Encontrar barra e adicionar campo de edição
                        const bar = barContainer.querySelector('.gantt-bar');
                        const barRect = bar.getBoundingClientRect();
                        
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = task.name;
                        input.style.position = 'absolute';
                        input.style.left = '5px';
                        input.style.width = `${barRect.width - 10}px`;
                        input.style.height = `${barRect.height - 4}px`;
                        input.style.zIndex = '10';
                        input.style.background = 'var(--window-bg)';
                        input.style.border = '1px solid var(--accent-color)';
                        input.style.borderRadius = '4px';
                        input.style.padding = '0 5px';
                        input.style.fontSize = '0.85em';
                        
                        barContainer.appendChild(input);
                        input.focus();
                        
                        const finishEdit = () => {
                            task.name = input.value;
                            barContainer.removeChild(input);
                            this.markDirty();
                            this.renderAll();
                        };
                        
                        input.addEventListener('blur', finishEdit);
                        input.addEventListener('keydown', e => {
                            if (e.key === 'Enter') finishEdit();
                        });
                    }
                }
            });
        },
        
        // 4. Criação visual de dependências
        initDependencyCreation: function() {
            // Botão na barra de ferramentas
            winEl.querySelector(`#linkTasksBtn_${uniqueSuffix}`).addEventListener('click', () => {
                if (this.selectedTaskId) {
                    this.dependencyCreation = {
                        active: true,
                        fromTaskId: this.selectedTaskId
                    };
                    showNotification("Clique na tarefa de destino para criar dependência", 3000);
                } else {
                    showNotification("Selecione uma tarefa primeiro", 3000, 'warning');
                }
            });
            
            // Clique no gráfico para completar dependência
            this.chartContent.addEventListener('click', e => {
                if (!this.dependencyCreation.active) return;
                
                const barContainer = e.target.closest('.gantt-bar-container');
                if (barContainer) {
                    const toTaskId = barContainer.dataset.taskId;
                    
                    if (this.dependencyCreation.fromTaskId === toTaskId) {
                        showNotification("Não é possível criar dependência para a mesma tarefa", 3000, 'error');
                        return;
                    }
                    
                    const task = this.tasks.find(t => t.id === this.dependencyCreation.fromTaskId);
                    if (task) {
                        const deps = task.dependencies ? task.dependencies.split(',') : [];
                        if (!deps.includes(toTaskId)) {
                            deps.push(toTaskId);
                            task.dependencies = deps.join(',');
                            this.markDirty();
                            this.renderAll();
                            showNotification("Dependência criada com sucesso!", 2000);
                        }
                    }
                }
                
                this.dependencyCreation.active = false;
                this.svgOverlay.querySelector('.dependency-creation')?.remove();
            });
            
            // Desenhar linha temporária durante criação
            this.chartContent.addEventListener('mousemove', e => {
                if (!this.dependencyCreation.active) return;
                
                // Remover linha anterior
                this.svgOverlay.querySelector('.dependency-creation')?.remove();
                
                const fromContainer = this.chartContent.querySelector(
                    `.gantt-bar-container[data-task-id="${this.dependencyCreation.fromTaskId}"]`
                );
                
                if (!fromContainer) return;
                
                const fromRect = fromContainer.getBoundingClientRect();
                const toX = e.clientX;
                const toY = e.clientY;
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const d = `M ${fromRect.right} ${fromRect.top + fromRect.height/2} L ${toX} ${toY}`;
                path.setAttribute('d', d);
                path.setAttribute('class', 'dependency-creation');
                this.svgOverlay.appendChild(path);
            });
        },
        
        // 5. Filtragem de tarefas
        initFilters: function() {
            const searchInput = winEl.querySelector(`#ganttSearch_${uniqueSuffix}`);
            const statusFilter = winEl.querySelector(`#statusFilter_${uniqueSuffix}`);
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            const clearBtn = winEl.querySelector(`#clearFiltersBtn_${uniqueSuffix}`);
            
            // Atualizar lista de responsáveis
            this.updateAssigneeFilter();
            
            // Aplicar filtros
            const applyFilters = () => {
                const searchTerm = searchInput.value.toLowerCase();
                const status = statusFilter.value;
                const assignee = assigneeFilter.value;
                
                this.filteredTasks = this.tasks.filter(task => {
                    // Filtro por texto
                    if (searchTerm && !task.name.toLowerCase().includes(searchTerm)) {
                        return false;
                    }
                    
                    // Filtro por status
                    if (status !== 'all' && task.status !== status) {
                        return false;
                    }
                    
                    // Filtro por responsável
                    if (assignee !== 'all' && task.assignee !== assignee) {
                        return false;
                    }
                    
                    return true;
                });
                
                this.renderAll();
            };
            
            searchInput.addEventListener('input', applyFilters);
            statusFilter.addEventListener('change', applyFilters);
            assigneeFilter.addEventListener('change', applyFilters);
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                statusFilter.value = 'all';
                assigneeFilter.value = 'all';
                applyFilters();
            });
        },
        
        updateAssigneeFilter: function() {
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            
            // Coletar todos os responsáveis únicos
            this.allAssignees = [...new Set(this.tasks
                .map(t => t.assignee)
                .filter(a => a && a.trim() !== '')
            )];
            
            // Atualizar dropdown
            assigneeFilter.innerHTML = '<option value="all">Todos</option>';
            this.allAssignees.forEach(assignee => {
                const option = document.createElement('option');
                option.value = assignee;
                option.textContent = assignee;
                assigneeFilter.appendChild(option);
            });
        },
        
        // 6. Modo de foco
        toggleFocusMode: function() {
            if (this.selectedTaskId) {
                const task = this.tasks.find(t => t.id === this.selectedTaskId);
                if (task && task.type === 'parent') {
                    this.focusModeParentId = this.selectedTaskId;
                    this.renderAll();
                }
            }
        },
        
        initFocusMode: function() {
            winEl.querySelector(`#focusModeBtn_${uniqueSuffix}`).addEventListener('click', this.toggleFocusMode.bind(this));
            
            winEl.querySelector(`#exitFocusMode_${uniqueSuffix}`).addEventListener('click', () => {
                this.focusModeParentId = null;
                this.renderAll();
            });
        },
        
        // 7. Atalhos de teclado
        initKeyboardShortcuts: function() {
            winEl.addEventListener('keydown', e => {
                // Ignorar se estiver editando texto
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                // Delete: Remover tarefa selecionada
                if (e.key === 'Delete' && this.selectedTaskId) {
                    this.removeTask(this.selectedTaskId);
                }
                
                // Ctrl + N: Nova tarefa
                if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    this.addTask();
                }
                
                // Ctrl + F: Foco na pesquisa
                if (e.ctrlKey && e.key === 'f') {
                    e.preventDefault();
                    winEl.querySelector(`#ganttSearch_${uniqueSuffix}`).focus();
                }
                
                // Ctrl + S: Salvar
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.saveFile();
                }
                
                // Esc: Sair do modo foco ou criação de dependência
                if (e.key === 'Escape') {
                    if (this.focusModeParentId) {
                        this.focusModeParentId = null;
                        this.renderAll();
                    }
                    if (this.dependencyCreation.active) {
                        this.dependencyCreation.active = false;
                        this.svgOverlay.querySelector('.dependency-creation')?.remove();
                    }
                }
            });
        },
        
        cleanup: () => {}
    };

    initializeFileState(appState, "Roadmap do Projeto", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
