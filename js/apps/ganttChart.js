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
                padding: 8px 12px;
                background-color: var(--toolbar-bg);
                border-bottom: 1px solid var(--separator-color);
                flex-shrink: 0;
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
            
            .app-button:hover { background-color: var(--button-hover-bg); }
            .app-button.active { background-color: var(--accent-color); color: white; border-color: var(--accent-color); }
            .app-button i { margin-right: 6px; }
            .toolbar-separator { border-left: 1px solid var(--separator-color); margin: 0 8px; height: 20px; }
            .toolbar-group { display: flex; align-items: center; margin: 0 5px; }

            /* --- Barra de Pesquisa e Filtros --- */
            .gantt-search-bar {
                padding: 8px 12px;
                background-color: var(--toolbar-bg);
                border-bottom: 1px solid var(--separator-color);
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
            }
            .gantt-filter-group { display: flex; gap: 8px; align-items: center; }
            .gantt-filter-label { font-size: 0.85em; color: var(--secondary-text-color); }
            .gantt-filter-select {
                background: var(--input-bg); border: 1px solid var(--button-border); border-radius: 4px;
                padding: 4px 8px; color: var(--text-color); font-size: 0.85em;
            }
            .app-input {
                padding: 6px 10px; border-radius: 4px; border: 1px solid var(--button-border);
                background: var(--input-bg); color: var(--text-color); font-size: 0.9em; flex: 1; max-width: 250px;
            }

            /* --- Painel da Tabela (Sidebar) --- */
            .gantt-sidebar { 
                width: 45%; min-width: 450px; max-width: 70%; background-color: var(--window-bg); 
                display: flex; flex-direction: column; border-right: 1px solid var(--separator-color); overflow: hidden;
            }
            .gantt-sidebar-header, .gantt-task-row {
                display: grid; grid-template-columns: minmax(0, 1fr) 80px 80px 140px 110px 110px 50px;
                gap: 10px; align-items: center; padding: 0 10px; box-sizing: border-box;
            }
            .gantt-sidebar-header { 
                padding: 10px; font-size: 0.75em; font-weight: 600; color: var(--secondary-text-color); 
                border-bottom: 1px solid var(--separator-color); text-transform: uppercase; position: sticky;
                top: 0; background-color: var(--window-bg); z-index: 2;
            }
            .gantt-sidebar-body { flex-grow: 1; overflow-y: auto; position: relative; }
            .gantt-task-row { 
                min-height: var(--gantt-row-height); border-bottom: 1px solid var(--separator-color); 
                cursor: pointer; user-select: none; transition: background-color 0.2s;
            }
            .gantt-task-row:hover { background-color: var(--hover-highlight-color); }
            .gantt-task-row.selected { background-color: var(--accent-light-translucent); }
            .dark-mode .gantt-task-row.selected { background-color: var(--accent-dark-translucent); }
            .gantt-task-row.drag-over-top { border-top: 2px solid var(--accent-color); }
            .gantt-task-row.drag-over-bottom { border-bottom: 2px solid var(--accent-color); }
            
            .task-cell { padding: 5px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; height: 100%; }
            .task-cell input, .task-cell select { 
                width: 100%; background: transparent; border: none; color: var(--text-color); 
                padding: 5px; border-radius: 4px; box-sizing: border-box; font-size: 0.9em; height: 100%;
            }
            .task-cell input:focus, .task-cell select:focus { background: var(--input-bg); outline: 1px solid var(--accent-color); }
            .task-cell input[type="date"] { padding-right: 0; }
            .task-name-cell { gap: 5px; }
            .task-expander { width: 20px; text-align: center; cursor: pointer; color: var(--secondary-text-color); transition: transform 0.2s; flex-shrink: 0; }
            .task-expander.collapsed { transform: rotate(-90deg); }
            .avatar { width: 24px; height: 24px; border-radius: 50%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 600; margin-right: 8px; flex-shrink: 0; }
            .task-actions { display: flex; justify-content: center; gap: 5px; }
            .action-btn { padding: 4px; border-radius: 4px; cursor: pointer; color: var(--secondary-text-color); background: transparent; border: none; }
            .action-btn:hover { background-color: var(--hover-highlight-color); color: var(--text-color); }
            
            /* --- Divisor e Gráfico --- */
            .gantt-splitter { width: 5px; background: var(--separator-color); cursor: col-resize; transition: background-color 0.2s; }
            .gantt-splitter:hover, .gantt-splitter.dragging { background: var(--accent-color); }

            .gantt-chart-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
            .gantt-chart-header-container { flex-shrink: 0; position: relative; z-index: 2; background-color: var(--toolbar-bg); overflow: hidden; }
            .gantt-timeline-header { white-space: nowrap; border-bottom: 1px solid var(--separator-color); display: flex; flex-direction: column; min-width: fit-content; }
            .gantt-timeline-header-row { display: flex; }
            .gantt-timeline-header-cell {
                text-align: center; color: var(--secondary-text-color); font-size: 0.8em; 
                border-right: 1px solid var(--separator-color); box-sizing: border-box; flex-shrink: 0; padding: 5px 0;
            }
            .gantt-chart-viewport { flex-grow: 1; overflow: auto; position: relative; }
            .gantt-chart-content { position: relative; }
            .gantt-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0;}
            .gantt-grid-line, .gantt-row-line, .gantt-grid-weekend { position: absolute; }
            .gantt-grid-line { top:0; width:1px; height:100%; background-color:var(--separator-color); opacity:0.5; }
            .gantt-row-line { left:0; height:1px; width:100%; background-color:var(--separator-color); }
            .gantt-grid-weekend { top:0; height:100%; background-color:var(--separator-color); opacity:0.1;}
            .gantt-today-marker { position: absolute; top: 0; width:2px; height:100%; background-color:var(--danger-color); z-index:2; opacity:0.9;}
            
            .gantt-bar-container { position: absolute; height: var(--gantt-row-height); display: flex; align-items: center; z-index: 1; }
            .gantt-bar {
                position: relative; height: 28px; background-color: var(--accent-color); border-radius: 6px; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: move; display: flex; align-items: center;
            }
            .gantt-bar:hover { filter: brightness(1.1); }
            .gantt-bar-progress { position: absolute; top: 0; left: 0; height: 100%; background: rgba(0,0,0,0.25); border-radius: 6px; pointer-events: none; }
            .gantt-bar-handle { position: absolute; top: 0; width: 8px; height: 100%; z-index: 2; cursor: ew-resize; }
            .gantt-bar-handle.left { left: 0; }
            .gantt-bar-handle.right { right: 0; }
            .gantt-bar-parent { background-color: var(--gantt-parent-bar-color); border-radius: 2px; height: 12px; }
            .gantt-bar-parent .gantt-bar-progress { background-color:rgba(255,255,255,0.4); }
            .gantt-milestone { position:absolute; width: 24px; height: 24px; background: var(--gantt-milestone-color); transform: rotate(45deg); top: 8px; border-radius: 3px; cursor: move; }
            .gantt-bar-label { z-index: 1; padding: 0 8px; pointer-events: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: white;}
            .gantt-bar.critical { border: 2px solid var(--critical-color); }
            .status-todo { background-color: #a9a9a9; }
            .status-inprogress { background-color: #4a6cf7; }
            .status-done { background-color: #28a745; }
            .status-blocked { background-color: #dc3545; }
            
            #ganttSvgOverlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            .gantt-dependency-path { stroke: var(--secondary-text-color); stroke-width: 1.5; fill: none; opacity: 0.8; marker-end: url(#arrowhead); }
            .gantt-critical-path { stroke: var(--critical-color) !important; stroke-width: 2.5 !important; opacity: 1 !important; }
            
             .gantt-tooltip { position: fixed; background: var(--context-menu-bg); color: var(--text-color); border: 1px solid var(--separator-color); border-radius: 8px; padding: 10px; z-index: 10000; font-size: 0.9em; box-shadow: 0 5px 15px rgba(0,0,0,0.2); pointer-events: none; opacity: 0; transition: opacity 0.2s; max-width: 300px; }
            .gantt-tooltip.visible { opacity: 1; }
            .gantt-tooltip-title { font-weight: 600; margin-bottom: 8px; color: var(--accent-color);}
            .gantt-tooltip-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .gantt-tooltip-label { color: var(--secondary-text-color); margin-right: 15px; }
            .gantt-context-menu { position: absolute; background: var(--context-menu-bg); border: 1px solid var(--separator-color); border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 1000; min-width: 180px;}
            .gantt-context-menu-item { padding: 8px 16px; cursor: pointer; font-size: 0.9em; display: flex; align-items: center; }
            .gantt-context-menu-item:hover { background-color: var(--hover-highlight-color); }
            .gantt-context-menu-item i { margin-right: 8px; width: 16px; text-align: center;}
            .status-indicator { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px;}
            .dependency-creation { stroke: var(--accent-color); stroke-width: 2; stroke-dasharray: 5,5;}
            .focus-mode-banner { background: var(--accent-color); color: white; padding: 6px 12px; border-radius: 4px; display: flex; align-items: center; gap: 10px; position: absolute; top: 10px; right: 10px; z-index: 10;}
            
            /* --- Responsividade Mobile --- */
            @media (max-width: 768px) {
                .gantt-v2-container { flex-direction: column; }
                .gantt-sidebar, .gantt-chart-area { width: 100% !important; height: 100%; max-width: 100%; border-right: none; }
                .gantt-splitter, .gantt-search-bar { display: none; }
                
                .gantt-mobile-tabs { display: flex !important; border-bottom: 1px solid var(--separator-color); background: var(--toolbar-bg); flex-shrink: 0; }
                .gantt-mobile-tab { padding: 10px 15px; cursor: pointer; flex: 1; text-align: center; font-weight: 500; color: var(--secondary-text-color); }
                .gantt-mobile-tab.active { color: var(--accent-color); border-bottom: 2px solid var(--accent-color); }
                
                .gantt-view-pane { display: none; flex-grow: 1; overflow: hidden; flex-direction: column; }
                .gantt-view-pane.active { display: flex; }
                
                .gantt-sidebar-header, .gantt-task-row { grid-template-columns: minmax(0, 1fr) 110px; }
                .gantt-task-row .task-cell:nth-child(2),
                .gantt-task-row .task-cell:nth-child(3),
                .gantt-task-row .task-cell:nth-child(4),
                .gantt-task-row .task-cell:nth-child(6),
                .gantt-task-row .task-cell:nth-child(7),
                .gantt-sidebar-header span:nth-child(2),
                .gantt-sidebar-header span:nth-child(3),
                .gantt-sidebar-header span:nth-child(4),
                .gantt-sidebar-header span:nth-child(6),
                .gantt-sidebar-header span:nth-child(7) { display: none; }
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
                <button id="zoomDayBtn_${uniqueSuffix}" class="app-button view-mode active" data-mode="day">Dia</button>
                <button id="zoomWeekBtn_${uniqueSuffix}" class="app-button view-mode" data-mode="week">Semana</button>
                <button id="zoomMonthBtn_${uniqueSuffix}" class="app-button view-mode" data-mode="month">Mês</button>
            </div>
            
            <div class="toolbar-separator"></div>
            
             <div class="toolbar-group">
                <button id="todayBtn_${uniqueSuffix}" class="app-button secondary" title="Ir para Hoje"><i class="fas fa-calendar-day"></i></button>
                <button id="linkTasksBtn_${uniqueSuffix}" class="app-button secondary" title="Vincular Tarefas"><i class="fas fa-link"></i></button>
                <button id="criticalPathBtn_${uniqueSuffix}" class="app-button secondary" title="Mostrar Caminho Crítico"><i class="fas fa-bolt"></i></button>
                <button id="focusModeBtn_${uniqueSuffix}" class="app-button secondary" title="Modo de Foco"><i class="fas fa-crosshairs"></i></button>
            </div>
            
            <div style="flex-grow: 1;"></div>
            
            <div class="toolbar-group">
                <button id="exportBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-file-export"></i> Exportar</button>
            </div>
        </div>
        
        <div class="gantt-search-bar">
             <input type="text" id="ganttSearch_${uniqueSuffix}" placeholder="Pesquisar tarefas..." class="app-input">
             <div class="gantt-filter-group">
                 <span class="gantt-filter-label">Status:</span>
                 <select id="statusFilter_${uniqueSuffix}" class="gantt-filter-select">
                    <option value="all">Todos</option> <option value="todo">A Fazer</option>
                    <option value="inprogress">Em Progresso</option> <option value="done">Concluído</option>
                    <option value="blocked">Bloqueado</option>
                 </select>
             </div>
             <div class="gantt-filter-group">
                <span class="gantt-filter-label">Responsável:</span>
                <select id="assigneeFilter_${uniqueSuffix}" class="gantt-filter-select">
                    <option value="all">Todos</option>
                </select>
            </div>
             <button id="clearFiltersBtn_${uniqueSuffix}" class="app-button small">Limpar Filtros</button>
        </div>

        <div class="gantt-mobile-tabs" style="display: none;">
            <div class="gantt-mobile-tab active" data-view="list">Lista</div>
            <div class="gantt-mobile-tab" data-view="chart">Gráfico</div>
        </div>
        
        <div class="gantt-v2-container">
            <div class="gantt-view-pane active" id="ganttListView_${uniqueSuffix}">
                <div class="gantt-sidebar" id="ganttSidebar_${uniqueSuffix}">
                    <div class="gantt-sidebar-header">
                        <span>Tarefa</span><span>Duração</span><span>Prog. %</span>
                        <span>Responsável</span><span>Início</span><span>Fim</span><span>Ações</span>
                    </div>
                    <div class="gantt-sidebar-body" id="ganttSidebarBody_${uniqueSuffix}"></div>
                </div>
            </div>
            <div class="gantt-splitter" id="ganttSplitter_${uniqueSuffix}"></div>
            <div class="gantt-view-pane active" id="ganttChartView_${uniqueSuffix}">
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
        </div>
        
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
        winId, tasks: [], appDataType: 'gantt-chart',
        
        // --- Elementos da UI ---
        sidebarBody: winEl.querySelector(`#ganttSidebarBody_${uniqueSuffix}`),
        headerContainer: winEl.querySelector(`#ganttHeaderContainer_${uniqueSuffix}`),
        chartViewport: winEl.querySelector(`#ganttChartViewport_${uniqueSuffix}`),
        chartContent: winEl.querySelector(`#ganttChartContent_${uniqueSuffix}`),
        svgOverlay: winEl.querySelector(`#ganttSvgOverlay`),
        tooltipEl: winEl.querySelector(`#ganttTooltip_${uniqueSuffix}`),
        splitter: winEl.querySelector(`#ganttSplitter_${uniqueSuffix}`),
        
        // --- Estado do Aplicativo ---
        selectedTaskId: null, showCriticalPath: true, editingTaskId: null,
        timeline: { startDate: null, endDate: null, totalWidth: 0 },
        flatTaskOrder: [], viewMode: 'day',

        allAssignees: [], filteredTasks: [], focusModeParentId: null,
        dependencyCreation: { active: false, fromTaskId: null },
        
        getData: function() { return this.tasks; },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString); 
                this.tasks = Array.isArray(data) && data.length > 0 ? data : this.getSampleData();
                this.fileId = fileMeta.id; 
                this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
            } catch (e) { 
                showNotification("Erro ao ler arquivo Gantt.", 3000, 'error'); 
                this.tasks = this.getSampleData();
                this.renderAll();
            } 
        },
        
        init: function() {
            setupAppToolbarActions(this);
            
            // Barra de Ferramentas
            winEl.querySelector(`#addTaskBtn_${uniqueSuffix}`).onclick = () => this.addTask();
            winEl.querySelector(`#addMilestoneBtn_${uniqueSuffix}`).onclick = () => this.addTask(true);
            winEl.querySelector(`#addParentBtn_${uniqueSuffix}`).onclick = () => this.addParentTask();
            winEl.querySelectorAll('.view-mode').forEach(btn => btn.onclick = () => this.setViewMode(btn.dataset.mode));
            winEl.querySelector(`#todayBtn_${uniqueSuffix}`).onclick = () => this.goToToday();
            winEl.querySelector(`#linkTasksBtn_${uniqueSuffix}`).onclick = () => this.initDependencyCreationUI();
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
            this.initDragAndDrop();
            this.initBarEditing();
            this.initFilters();
            this.initFocusMode();
            this.initKeyboardShortcuts();
            this.initDependencyCreationEvents();

            // Responsividade
            const resizeObserver = new ResizeObserver(() => this.checkResponsiveness());
            resizeObserver.observe(winEl);
            this.checkResponsiveness();
            
            if (this.tasks.length === 0) {
                this.tasks = this.getSampleData();
            }
            this.renderAll();
        },

        checkResponsiveness: function() {
            const isMobile = winEl.offsetWidth <= 768;
            const mobileTabs = winEl.querySelector('.gantt-mobile-tabs');
            const ganttContainer = winEl.querySelector('.gantt-v2-container');
            const listView = winEl.querySelector(`#ganttListView_${uniqueSuffix}`);
            const chartView = winEl.querySelector(`#ganttChartView_${uniqueSuffix}`);
            
            mobileTabs.style.display = isMobile ? 'flex' : 'none';
            ganttContainer.style.flexDirection = isMobile ? 'column' : 'row';

            if (isMobile) {
                if (!mobileTabs.onclick) {
                    mobileTabs.onclick = (e) => {
                        const tab = e.target.closest('.gantt-mobile-tab');
                        if (!tab || tab.classList.contains('active')) return;
                        mobileTabs.querySelector('.active').classList.remove('active');
                        tab.classList.add('active');
                        const isListActive = tab.dataset.view === 'list';
                        listView.classList.toggle('active', isListActive);
                        chartView.classList.toggle('active', !isListActive);
                    };
                }
            } else {
                listView.classList.add('active');
                chartView.classList.add('active');
            }
        },

        setViewMode: function(mode) {
            this.viewMode = mode;
            winEl.querySelectorAll('.view-mode.active').forEach(b => b.classList.remove('active'));
            winEl.querySelector(`.view-mode[data-mode="${mode}"]`).classList.add('active');
            this.renderAll();
        },
        
        renderAll: function() {
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

            this.updateFocusBanner();
            this.restoreEditingState(editingState);
        },
        
        daysBetween: (d1, d2) => {
            const date1 = new Date(d1);
            const date2 = new Date(d2);
            date1.setUTCHours(0, 0, 0, 0);
            date2.setUTCHours(0, 0, 0, 0);
            return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
        },
        addDays: (d, days) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; },
        formatDate: (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),

        calculateTimeline: function() {
            if (this.tasks.length === 0) {
                const today = new Date();
                this.timeline = { startDate: this.addDays(today, -15), endDate: this.addDays(today, 45) };
                return;
            }
            let minDate = new Date(Math.min(...this.tasks.map(t => new Date(t.start))));
            let maxDate = new Date(Math.max(...this.tasks.filter(t => t.end).map(t => new Date(t.end))));
            
            if (isNaN(minDate.getTime())) minDate = new Date();
            if (isNaN(maxDate.getTime())) maxDate = new Date();
            
            this.timeline = { startDate: this.addDays(minDate, -15), endDate: this.addDays(maxDate, 30) };
        },
        
        goToToday: function() {
            const pixelsPerDay = this.getPixelsPerDay();
            const todayOffset = this.daysBetween(this.timeline.startDate, new Date()) * pixelsPerDay;
            this.chartViewport.scrollLeft = todayOffset - this.chartViewport.offsetWidth / 2;
        },
        
        toggleCriticalPath: function() {
            this.showCriticalPath = !this.showCriticalPath;
            this.renderAll();
        },
        
        renderSidebar: function() {
            this.sidebarBody.innerHTML = '';
            const renderTaskNode = (task, level) => {
                const row = document.createElement('div');
                row.className = 'gantt-task-row';
                if (this.selectedTaskId === task.id) { row.classList.add('selected'); }
                row.dataset.taskId = task.id;
                row.draggable = true;
                
                const children = this.tasks.filter(t => t.parentId === task.id);
                const isParent = task.type === 'parent' || children.length > 0;
                task.type = isParent ? 'parent' : task.type;

                const expanderHTML = isParent ? 
                    `<span class="task-expander ${task.collapsed ? 'collapsed' : ''}"><i class="fas fa-angle-down"></i></span>` : 
                    '<span class="task-expander"></span>';
                
                const icon = task.type === 'milestone' ? 'fa-gem' : isParent ? 'fa-folder' : 'fa-tasks';
                const duration = isParent ? '-' : (this.daysBetween(task.start, task.end) + 1) + 'd';
                const progress = task.progress || 0;
                
                row.innerHTML = `
                    <div class="task-cell task-name-cell" style="padding-left: ${level * 25 + 5}px;">
                        ${expanderHTML}
                        <i class="fas ${icon} task-icon" style="color: ${isParent ? 'var(--gantt-parent-bar-color)' : task.type === 'milestone' ? 'var(--gantt-milestone-color)' : 'var(--accent-color)'};"></i>
                        <input type="text" value="${task.name}" data-field="name" ${isParent ? 'readonly' : ''} title="${task.name}">
                    </div>
                    <div class="task-cell"><span>${duration}</span></div>
                    <div class="task-cell"><input type="number" min="0" max="100" value="${progress}" data-field="progress" ${isParent ? 'readonly' : ''}></div>
                    <div class="task-cell" title="${task.assignee || ''}">${this.generateAvatar(task.assignee)}<input type="text" value="${task.assignee || ''}" data-field="assignee" placeholder="-" ${isParent ? 'readonly' : ''}></div>
                    <div class="task-cell"><input type="date" value="${task.start}" data-field="start" ${isParent ? 'readonly' : ''}></div>
                    <div class="task-cell"><input type="date" value="${task.end}" data-field="end" ${isParent || task.type === 'milestone' ? 'readonly' : ''}></div>
                    <div class="task-cell task-actions">
                        <button class="action-btn" data-action="remove" title="Remover"><i class="fas fa-trash"></i></button>
                        <button class="action-btn" data-action="add-child" title="Adicionar Subtarefa"><i class="fas fa-plus"></i></button>
                    </div>`;
                this.sidebarBody.appendChild(row);

                if (isParent && !task.collapsed) {
                    children.sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(child => renderTaskNode(child, level + 1));
                }
            };

            const tasksToRender = this.filteredTasks.length > 0 && !this.focusModeParentId ? this.filteredTasks : this.tasks;
            tasksToRender.filter(t => this.focusModeParentId ? t.id === this.focusModeParentId : !t.parentId)
                .sort((a,b) => new Date(a.start) - new Date(b.start))
                .forEach(task => renderTaskNode(task, 0));
        },
        
        getPixelsPerDay: function() {
            const unitWidths = { 'day': 40, 'week': 120, 'month': 150 };
            const daysInUnit = { 'day': 1, 'week': 7, 'month': 30.4 }; // Average
            return (unitWidths[this.viewMode] || 40) / (daysInUnit[this.viewMode] || 1);
        },

        renderChart: function() {
            const { startDate } = this.timeline;
            if (!startDate) return;

            this.headerContainer.innerHTML = '';
            this.chartContent.innerHTML = `
                <svg id="ganttSvgOverlay" width="100%" height="100%">
                   <defs>
                     <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                       <path d="M 0 0 L 10 5 L 0 10 z" opacity="0.8" fill="var(--secondary-text-color)"/>
                     </marker>
                   </defs>
                </svg>
                <div class="gantt-grid" id="ganttGrid_${uniqueSuffix}"></div>
            `;
            // Re-fetch svgOverlay as it was just recreated
            this.svgOverlay = winEl.querySelector(`#ganttSvgOverlay`);

            this.renderChartHeader();
            this.renderChartContentAndGrid();
        },

        renderChartHeader: function() {
            const headerEl = document.createElement('div'); headerEl.className = 'gantt-timeline-header';
            const upperRow = document.createElement('div'); upperRow.className = 'gantt-timeline-header-row';
            const lowerRow = document.createElement('div'); lowerRow.className = 'gantt-timeline-header-row';
            
            let pos = 0;
            let currentDate = new Date(this.timeline.startDate);
            const endDate = new Date(this.timeline.endDate);

            const pixelsPerDay = this.getPixelsPerDay();
            const unitWidths = { 'day': 40, 'week': 120, 'month': 150 };

            while (currentDate <= endDate) {
                let unitText = '', upperText = '', incrementDays = 1, width = unitWidths[this.viewMode] || 40;
                let dayOfWeek = currentDate.getDay();

                if (this.viewMode === 'day') {
                    unitText = currentDate.getDate();
                    if (currentDate.getDate() === 1 || pos === 0) {
                        upperText = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                    }
                    width = pixelsPerDay;
                } else if (this.viewMode === 'week') {
                    let startOfWeek = this.addDays(currentDate, -dayOfWeek);
                    unitText = `Semana de ${startOfWeek.getDate()}`;
                    if (currentDate.getMonth() !== this.addDays(currentDate, -7).getMonth() || pos === 0) {
                         upperText = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                    }
                    incrementDays = 7;
                    width = pixelsPerDay * 7;
                } else { // month
                    unitText = currentDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
                    if (currentDate.getMonth() === 0 || pos === 0) {
                        upperText = currentDate.getFullYear();
                    }
                    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                    incrementDays = this.daysBetween(currentDate, nextMonth);
                    width = pixelsPerDay * incrementDays;
                }
                
                if (upperText) {
                    const lastUpperCell = upperRow.lastElementChild;
                    if (!lastUpperCell || lastUpperCell.dataset.text !== upperText) {
                        const cell = document.createElement('div');
                        cell.className = 'gantt-timeline-header-cell';
                        cell.textContent = upperText;
                        cell.dataset.text = upperText;
                        cell.style.width = '0px';
                        upperRow.appendChild(cell);
                    }
                    upperRow.lastElementChild.style.width = (parseFloat(upperRow.lastElementChild.style.width) + width) + 'px';
                }

                const lowerCell = document.createElement('div');
                lowerCell.className = 'gantt-timeline-header-cell';
                lowerCell.textContent = unitText;
                lowerCell.style.width = `${width}px`;
                lowerRow.appendChild(lowerCell);
                
                pos += width;
                currentDate = this.addDays(currentDate, incrementDays);
            }
            
            headerEl.appendChild(upperRow); 
            headerEl.appendChild(lowerRow);
            this.headerContainer.appendChild(headerEl);
            this.timeline.totalWidth = pos;
        },

        renderChartContentAndGrid: function() { 
            const chartContentEl = this.chartContent;
            const gridEl = chartContentEl.querySelector(`#ganttGrid_${uniqueSuffix}`);

            const { startDate } = this.timeline;
            const pixelsPerDay = this.getPixelsPerDay();
            const totalDays = this.daysBetween(startDate, this.timeline.endDate);

            // Render Grid
            for (let i=0; i < totalDays; i++) {
                const dayDate = this.addDays(startDate, i);
                const dayOfWeek = dayDate.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
                    const weekendEl = document.createElement('div');
                    weekendEl.className = 'gantt-grid-weekend';
                    weekendEl.style.left = `${i * pixelsPerDay}px`;
                    weekendEl.style.width = `${pixelsPerDay}px`;
                    gridEl.appendChild(weekendEl);
                }
            }
            
            this.flatTaskOrder.forEach((taskId, index) => {
                const task = this.tasks.find(t => t.id === taskId);
                if (!task || (task.type === 'parent' && task.collapsed)) return;

                const rowLine = document.createElement('div');
                rowLine.className = 'gantt-row-line';
                rowLine.style.top = `${index * 40 + 39}px`;
                gridEl.appendChild(rowLine);
                
                const taskStart = new Date(task.start);
                const left = this.daysBetween(startDate, taskStart) * pixelsPerDay;
                
                const barContainer = document.createElement('div');
                barContainer.className = 'gantt-bar-container';
                barContainer.style.top = `${index * 40}px`;
                barContainer.dataset.taskId = task.id;

                if (task.id === this.selectedTaskId) barContainer.classList.add('selected');

                if (task.type === 'milestone') {
                    barContainer.style.left = `${left - 12}px`; // Center milestone on start date
                    barContainer.innerHTML = `<div class="gantt-milestone"></div>`;
                } else {
                    const taskEnd = new Date(task.end);
                    const duration = Math.max(1, this.daysBetween(taskStart, taskEnd) + 1);
                    const width = duration * pixelsPerDay;
                    barContainer.style.left = `${left}px`;
                    barContainer.style.width = `${width}px`;
                    
                    const barClass = task.type === 'parent' ? 'gantt-bar-parent' : `status-${task.status || 'todo'}`;
                    const progress = task.progress || 0;

                    barContainer.innerHTML = `
                        <div class="gantt-bar ${barClass}">
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle left"></div>' : ''}
                            <div class="gantt-bar-progress" style="width: ${progress}%"></div>
                            <span class="gantt-bar-label" style="display: ${width > 80 ? 'block' : 'none'}">${task.name}</span>
                            ${task.type !== 'parent' ? '<div class="gantt-bar-handle right"></div>' : ''}
                        </div>`;
                }
                chartContentEl.appendChild(barContainer);
            });
            
            const today = new Date();
            if (today >= startDate && today <= this.timeline.endDate) {
                const todayOffset = this.daysBetween(startDate, today) * pixelsPerDay;
                const todayMarker = document.createElement('div');
                todayMarker.className = 'gantt-today-marker';
                todayMarker.style.left = `${todayOffset}px`;
                todayMarker.style.height = `${this.flatTaskOrder.length * 40}px`;
                chartContentEl.appendChild(todayMarker);
            }

            const contentHeight = this.flatTaskOrder.length * 40;
            chartContentEl.style.width = `${this.timeline.totalWidth}px`;
            chartContentEl.style.height = `${contentHeight}px`;
            this.svgOverlay.setAttribute('width', this.timeline.totalWidth);
            this.svgOverlay.setAttribute('height', contentHeight);
        },
        
        getSampleData: function() {
            const d = (days) => this.addDays(new Date(), days).toISOString().split('T')[0];
            const tasks = [
                { id: generateId('p'), name: 'Fase de Planejamento', start: d(0), end: d(10), type: 'parent', collapsed: false },
                { id: generateId('t'), name: 'Análise de Requisitos', start: d(0), end: d(4), parentId: 'p1', progress: 80, assignee: 'Alice', status: 'inprogress' },
                { id: generateId('t'), name: 'Design da UI/UX', start: d(5), end: d(9), parentId: 'p1', progress: 30, assignee: 'Bob', status: 'todo' },
                { id: generateId('m'), name: 'Aprovação do Design', start: d(10), end: d(10), type: 'milestone', parentId: 'p1' },
                { id: generateId('p'), name: 'Fase de Desenvolvimento', start: d(11), end: d(20), type: 'parent', collapsed: true },
                { id: generateId('t'), name: 'Desenvolvimento do Backend', start: d(11), end: d(20), parentId: 'p2', progress: 10, assignee: 'Charlie', status: 'todo' },
            ];
            // Assign dynamic parent IDs
            tasks[1].parentId = tasks[0].id;
            tasks[2].parentId = tasks[0].id;
            tasks[3].parentId = tasks[0].id;
            tasks[5].parentId = tasks[4].id;
            return tasks;
        },
        
        updateFocusBanner: function() {
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
            const handle = e.target.classList.contains('gantt-bar-handle') ? e.target.className.includes('left') ? 'left' : 'right' : null;
            
            this.selectedTaskId = taskId;
            this.renderAll(); 
            
            const pixelsPerDay = this.getPixelsPerDay();
            if(pixelsPerDay === 0) return; // Avoid division by zero

            const onMouseMove = (moveE) => {
                const deltaX = moveE.clientX - initialX;
                const deltaDays = Math.round(deltaX / pixelsPerDay);

                if (handle === 'left') {
                    const newStart = this.addDays(initialStart, deltaDays);
                    if (newStart <= initialEnd) task.start = newStart.toISOString().split('T')[0];
                } else if (handle === 'right') {
                    const newEnd = this.addDays(initialEnd, deltaDays);
                    if (newEnd >= new Date(task.start)) task.end = newEnd.toISOString().split('T')[0];
                } else { // Move
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

        initDependencyCreationUI: function() {
            if (this.selectedTaskId) {
                this.dependencyCreation = { active: true, fromTaskId: this.selectedTaskId };
                showNotification("Clique na tarefa de destino para criar o vínculo.", 3000);
            } else {
                showNotification("Selecione uma tarefa de origem primeiro.", 3000, 'warning');
            }
        },

        initDependencyCreationEvents: function() {
            const getChartCoordinates = (clientX, clientY) => {
                const chartRect = this.chartContent.getBoundingClientRect();
                return {
                    x: clientX - chartRect.left + this.chartViewport.scrollLeft,
                    y: clientY - chartRect.top + this.chartViewport.scrollTop
                };
            };
        
            this.chartContent.addEventListener('click', e => {
                if (!this.dependencyCreation.active) return;
                e.preventDefault(); e.stopPropagation();
        
                const barContainer = e.target.closest('.gantt-bar-container');
                if (barContainer) {
                    const toTaskId = barContainer.dataset.taskId;
                    // The dependent task is 'toTaskId', the dependency is 'fromTaskId'
                    const toTask = this.tasks.find(t => t.id === toTaskId);
                    const fromTaskId = this.dependencyCreation.fromTaskId;

                    if (fromTaskId !== toTaskId && toTask) {
                        const deps = toTask.dependencies ? toTask.dependencies.split(',') : [];
                        if (!deps.includes(fromTaskId)) {
                            deps.push(fromTaskId);
                            toTask.dependencies = deps.join(',');
                            this.markDirty(); this.renderAll();
                            showNotification("Dependência criada com sucesso!", 2000);
                        }
                    } else {
                        showNotification("Não é possível vincular uma tarefa a ela mesma.", 3000, 'error');
                    }
                }
                this.dependencyCreation.active = false;
                this.svgOverlay.querySelector('.dependency-creation')?.remove();
            });
        
            this.chartContent.addEventListener('mousemove', e => {
                if (!this.dependencyCreation.active) return;
        
                let line = this.svgOverlay.querySelector('.dependency-creation');
                if (!line) {
                    line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    line.setAttribute('class', 'dependency-creation');
                    this.svgOverlay.appendChild(line);
                }
        
                const fromContainer = this.chartContent.querySelector(`.gantt-bar-container[data-task-id="${this.dependencyCreation.fromTaskId}"]`);
                if (!fromContainer) return;
        
                const fromX = fromContainer.offsetLeft + (fromContainer.offsetWidth / 2);
                const fromY = fromContainer.offsetTop + fromContainer.offsetHeight;
                const { x: toX, y: toY } = getChartCoordinates(e.clientX, e.clientY);
        
                line.setAttribute('d', `M ${fromX} ${fromY} L ${toX} ${toY}`);
            });
        },
       
        renderDependencies: function() { 
            this.svgOverlay.querySelectorAll('.gantt-dependency-path').forEach(p => p.remove());
            const barElements = {};
            this.chartContent.querySelectorAll('.gantt-bar-container').forEach(b => { 
                barElements[b.dataset.taskId] = b; 
            });
            const getTaskIndex = (taskId) => this.flatTaskOrder.indexOf(taskId);
            this.tasks.forEach(task => { // `task` is the successor
                if(task.dependencies) {
                    const deps = task.dependencies.split(',').map(d => d.trim());
                    deps.forEach(depId => { // `depId` is the predecessor
                        const predecessor = this.tasks.find(t => t.id === depId);
                        if(!predecessor || !barElements[task.id] || !barElements[predecessor.id]) return;

                        const fromEl = barElements[predecessor.id];
                        const toEl = barElements[task.id];
                        
                        const fromIndex = getTaskIndex(predecessor.id);
                        const toIndex = getTaskIndex(task.id);

                        const fromX = fromEl.offsetLeft + (predecessor.type === 'milestone' ? 12 : fromEl.offsetWidth);
                        const fromY = fromIndex * 40 + 20;
                        const toX = toEl.offsetLeft;
                        const toY = toIndex * 40 + 20;
                        
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        const d = `M ${fromX} ${fromY} C ${fromX + 40} ${fromY}, ${toX - 40} ${toY}, ${toX} ${toY}`;
                        path.setAttribute('d', d);
                        path.setAttribute('class', 'gantt-dependency-path');
                        path.dataset.fromId = predecessor.id; path.dataset.toId = task.id;
                        this.svgOverlay.appendChild(path);
                    });
                }
            });
        },
        calculateAndDrawCriticalPath: function() { 
            const tasks = this.tasks.filter(t => t.type !== 'parent' && t.end);
            if (tasks.length === 0) return;
            tasks.forEach(t => {
                t.earlyStart = 0; t.earlyFinish = 0; t.lateStart = Infinity; t.lateFinish = Infinity;
                t.duration = this.daysBetween(t.start, t.end) + 1;
            });
            const taskMap = new Map(tasks.map(t => [t.id, t]));
            const adj = new Map(tasks.map(t => [t.id, []])), revAdj = new Map(tasks.map(t => [t.id, []]));
            tasks.forEach(t => {
                if (t.dependencies) {
                    t.dependencies.split(',').map(d=>d.trim()).forEach(depId => {
                        if (taskMap.has(depId)) {
                            // t depends on depId -> edge from depId to t
                            adj.get(depId).push(t.id);
                            revAdj.get(t.id).push(depId);
                        }
                    });
                }
            });
            
            // Forward pass
            let queue = tasks.filter(t => !revAdj.has(t.id) || revAdj.get(t.id).length === 0);
            while (queue.length > 0) {
                const u = queue.shift();
                u.earlyFinish = u.earlyStart + u.duration;
                for (const vId of (adj.get(u.id) || [])) {
                    const v = taskMap.get(vId);
                    v.earlyStart = Math.max(v.earlyStart, u.earlyFinish);
                    // Add to queue only when all predecessors are processed (simplified for this context)
                    queue.push(v);
                }
            }
            const allFinishTimes = tasks.map(t => t.earlyFinish);
            const projectFinishTime = Math.max(0, ...allFinishTimes.filter(t => isFinite(t)));
            
            // Backward pass
            tasks.forEach(t => t.lateFinish = projectFinishTime);
            queue = tasks.filter(t => !adj.has(t.id) || adj.get(t.id).length === 0);
            while (queue.length > 0) {
                const u = queue.shift();
                u.lateStart = u.lateFinish - u.duration;
                for (const pId of (revAdj.get(u.id) || [])) {
                    const p = taskMap.get(pId);
                    p.lateFinish = Math.min(p.lateFinish, u.lateStart);
                     queue.push(p);
                }
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
                path.classList.toggle('gantt-critical-path', criticalPathTaskIds.has(fromId) && criticalPathTaskIds.has(toId));
            });
        },
        addTask: function(isMilestone = false) {
            const todayStr = new Date().toISOString().split('T')[0];
            const endStr = this.addDays(new Date(), isMilestone ? 0 : 5).toISOString().split('T')[0];
            const parentTask = this.tasks.find(t => t.id === this.selectedTaskId);

            const newTask = {
                id: generateId('task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start: todayStr, end: endStr, assignee: '', status: 'todo', progress: 0,
                dependencies: '', type: isMilestone ? 'milestone' : 'task',
                parentId: (parentTask && parentTask.type === 'parent') ? this.selectedTaskId : (parentTask ? parentTask.parentId : null)
            };
            this.tasks.push(newTask);
            this.markDirty(); this.updateAssigneeFilter(); this.renderAll();
        },
        addParentTask: function() { 
            const newTask = {
                id: generateId('parent'), name: 'Novo Grupo', type: 'parent', parentId: null, collapsed: false,
                start: new Date().toISOString().split('T')[0], end: this.addDays(new Date(), 7).toISOString().split('T')[0],
            };
            this.tasks.push(newTask); this.markDirty(); this.renderAll();
        },
        removeTask: function(taskId) { 
            const taskIndex = this.tasks.findIndex(t => t.id === taskId); if(taskIndex === -1) return;
            // Remove recursively
            const children = this.tasks.filter(t => t.parentId === taskId);
            children.forEach(child => this.removeTask(child.id));

            this.tasks.forEach(t => { if(t.dependencies) t.dependencies = t.dependencies.split(',').map(d=>d.trim()).filter(d=>d !== taskId).join(',');});
            this.tasks.splice(this.tasks.findIndex(t => t.id === taskId), 1);

            if (this.selectedTaskId === taskId) this.selectedTaskId = null;
            this.markDirty(); this.updateAssigneeFilter(); this.renderAll();
        },
        updateParentTasks: function() {
            const processNode = (task) => {
                const children = this.tasks.filter(c => c.parentId === task.id);
                if(children.length > 0) {
                    children.forEach(processNode);
                    const validChildren = children.filter(c => c.start && c.end);
                    if (validChildren.length > 0) {
                        task.start = new Date(Math.min(...validChildren.map(c=>new Date(c.start)))).toISOString().split('T')[0];
                        task.end = new Date(Math.max(...validChildren.map(c=>new Date(c.end)))).toISOString().split('T')[0];
                        task.progress = Math.round(validChildren.reduce((sum, c) => sum + (c.progress||0),0) / validChildren.length);
                    }
                }
            };
            this.tasks.filter(t=> t.type === 'parent').forEach(processNode);
        },
        handleSidebarInput: function(e) { 
            const row = e.target.closest('.gantt-task-row'); if (!row) return;
            const taskId = row.dataset.taskId, field = e.target.dataset.field, task = this.tasks.find(t=>t.id===taskId);
            if(task) {
                this.editingTaskId = taskId; task[field] = e.target.value;
                if (field === 'start' && task.type !== 'milestone' && this.daysBetween(task.start, task.end) < 0) task.end = task.start;
                this.markDirty(); this.renderAll();
            }
        },
        handleSidebarClick: function(e) {
            const row = e.target.closest('.gantt-task-row'); if (!row) return;
            this.selectedTaskId = row.dataset.taskId;

            if (e.target.closest('.task-expander')) {
                const task = this.tasks.find(t => t.id === this.selectedTaskId);
                if (task && task.type === 'parent') { task.collapsed = !task.collapsed; this.markDirty(); this.renderAll(); }
                return;
            } else if (e.target.closest('.action-btn')) {
                const action = e.target.closest('.action-btn').dataset.action;
                if (action === 'remove' && confirm('Tem certeza que deseja remover esta tarefa e todas as suas subtarefas?')) {
                    this.removeTask(this.selectedTaskId);
                }
                else if (action === 'add-child') {
                    this.addTask();
                }
                return;
            }
            if (e.target.tagName.toLowerCase() !== 'input') this.editingTaskId = null;
            this.renderAll();
        },
        handleBarMouseOver: function(e) {
            const barContainer = e.target.closest('.gantt-bar-container');
            if (barContainer) { const task = this.tasks.find(t=>t.id === barContainer.dataset.taskId); if(task) this.showTooltip(e,task); }
        },
        syncScroll: function(e) { 
            const target = e.currentTarget;
            if(target === this.chartViewport) { this.sidebarBody.scrollTop = this.chartViewport.scrollTop; this.headerContainer.scrollLeft = this.chartViewport.scrollLeft; }
            else if (target === this.sidebarBody) { this.chartViewport.scrollTop = this.sidebarBody.scrollTop; }
        },
        showContextMenu: function(e) { e.preventDefault();
            const barContainer = e.target.closest('.gantt-bar-container'); if (!barContainer) return;
            this.selectedTaskId = barContainer.dataset.taskId; const task = this.tasks.find(t=>t.id===this.selectedTaskId); if(!task) return;
            document.querySelector('.gantt-context-menu')?.remove();
            const menu = document.createElement('div'); menu.className='gantt-context-menu'; menu.style.left=`${e.pageX}px`; menu.style.top=`${e.pageY}px`;
            menu.innerHTML=`
                <div class="gantt-context-menu-item" data-action="delete"><i class="fas fa-trash"></i> Remover Tarefa</div>
                <div class="gantt-context-menu-item" data-action="add-dependency"><i class="fas fa-link"></i> Vincular Tarefa</div>
                <div class="gantt-context-menu-item" data-action="mark-done"><i class="fas fa-check-circle"></i> Marcar como Concluída</div>`;
            document.body.appendChild(menu);
            const closeMenu = () => { menu.remove(); document.removeEventListener('click',closeMenu); };
            document.addEventListener('click', closeMenu);
            menu.addEventListener('click', (ev) => {
                ev.stopPropagation(); const item = ev.target.closest('[data-action]'); if(!item) return;
                const action=item.dataset.action;
                if (action === 'delete' && confirm('Remover tarefa?')) this.removeTask(this.selectedTaskId);
                if (action === 'add-dependency') this.initDependencyCreationUI();
                if (action === 'mark-done') { task.status='done'; task.progress=100; this.markDirty(); this.renderAll(); }
                closeMenu();
            });
        },
        exportToImage: function() { 
            html2canvas(winEl.querySelector('.gantt-v2-container')).then(canvas => {
                const link = document.createElement('a'); link.download = 'gantt-chart.png';
                link.href = canvas.toDataURL('image/png'); link.click();
            });
        },
        showTooltip: function(e, task) { 
            const duration = this.daysBetween(task.start, task.end)+1, status={'todo':'A Fazer','inprogress':'Em Progresso','done':'Concluída','blocked':'Bloqueada'}[task.status||'todo'] || 'N/D';
            this.tooltipEl.innerHTML = `
                <div class="gantt-tooltip-title">${task.name}</div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Status:</span><span><span class="status-indicator status-${task.status || 'todo'}"></span> ${status}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Início:</span><span>${this.formatDate(task.start)}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Fim:</span><span>${this.formatDate(task.end)}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Duração:</span><span>${duration} dia${duration>1?'s':''}</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Progresso:</span><span>${task.progress||0}%</span></div>
                <div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Responsável:</span><span>${task.assignee || '-'}</span></div>
                 ${task.dependencies ? `<div class="gantt-tooltip-row"><span class="gantt-tooltip-label">Depende de:</span><span>${task.dependencies}</span></div>` : ''}
            `;
            this.tooltipEl.style.left=`${e.clientX+15}px`; this.tooltipEl.style.top=`${e.clientY+15}px`; this.tooltipEl.classList.add('visible');
        },
        hideTooltip: function() { this.tooltipEl.classList.remove('visible'); },
        generateAvatar: function(name) {
            if(!name || name.trim()==='') return `<div class="avatar" style="background-color:#ccc;" title="Não atribuído"></div>`;
            const initials = name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
            const colors = ['#4a6cf7', '#28a745', '#ffc107', '#dc3545', '#6a11cb', '#fd7e14', '#0dcaf0'];
            const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const color = colors[charCodeSum % colors.length];
            return `<div class="avatar" style="background-color:${color};color:white;" title="${name}">${initials}</div>`;
        },
        getFlatTaskOrder: function() {
            const order = [];
            const visibleTasks = (this.filteredTasks.length > 0 && !this.focusModeParentId) ? this.filteredTasks : this.tasks;
            
            const processNode = (task, level = 0) => {
                order.push(task.id);
                if (task.type === 'parent' && !task.collapsed) {
                    this.tasks.filter(t => t.parentId === task.id)
                        .sort((a,b) => new Date(a.start) - new Date(b.start))
                        .forEach(child => processNode(child, level + 1));
                }
            };
            
            let rootTasks = [];
            if (this.focusModeParentId) {
                const focusedTask = this.tasks.find(t => t.id === this.focusModeParentId);
                if(focusedTask) rootTasks.push(focusedTask);
            } else {
                // If filter is active, we need to show parent tasks if any of their children match the filter
                if (this.filteredTasks.length > 0) {
                     const allVisibleIds = new Set(this.filteredTasks.map(t => t.id));
                     this.filteredTasks.forEach(t => {
                         let parentId = t.parentId;
                         while(parentId) {
                             allVisibleIds.add(parentId);
                             parentId = this.tasks.find(p => p.id === parentId)?.parentId;
                         }
                     });
                     const visibleRootTasks = this.tasks.filter(t => allVisibleIds.has(t.id) && !t.parentId);
                     rootTasks = visibleRootTasks;
                } else {
                    rootTasks = this.tasks.filter(t => !t.parentId);
                }
            }

            rootTasks.sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(task => processNode(task, 0));
            return order;
        },
        saveEditingState: function() { 
            if (!this.editingTaskId) return null;
            const activeEl = document.activeElement;
            const row = activeEl?.closest('.gantt-task-row');
            if (!row || row.dataset.taskId !== this.editingTaskId || !activeEl.dataset.field) { this.editingTaskId = null; return null; }
            return { taskId: this.editingTaskId, field: activeEl.dataset.field, selectionStart: activeEl.selectionStart, selectionEnd: activeEl.selectionEnd };
        },
        restoreEditingState: function(state) { 
            if(!state) {this.editingTaskId=null;return;}
            const row = this.sidebarBody.querySelector(`.gantt-task-row[data-task-id="${state.taskId}"]`); if (!row) {this.editingTaskId=null;return;}
            const inputToFocus = row.querySelector(`[data-field="${state.field}"]`);
            if (inputToFocus) {
                 inputToFocus.focus();
                 if (typeof inputToFocus.setSelectionRange==='function') {
                    try {
                        inputToFocus.setSelectionRange(state.selectionStart, state.selectionEnd);
                    } catch (e) { /* ignore */ }
                 }
            }
            else this.editingTaskId = null;
        },
        setupSplitter: function() {
            const splitter=this.splitter, sidebar=splitter.previousElementSibling; let isDragging=false, startX, startWidth;
            const onMouseMove = (e) => {
                if (!isDragging) return;
                const newWidth = startWidth + (e.clientX - startX);
                if (newWidth > 300 && newWidth < window.innerWidth - 300) sidebar.style.width = `${newWidth}px`;
            };
            const onMouseUp = () => { isDragging=false; splitter.classList.remove('dragging'); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); this.renderAll();};
            splitter.addEventListener('mousedown', (e)=>{isDragging=true; splitter.classList.add('dragging'); startX=e.clientX; startWidth=sidebar.offsetWidth; e.preventDefault(); document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);});
        },
        initDragAndDrop: function() { 
            this.sidebarBody.addEventListener('dragstart', e => {const r = e.target.closest('.gantt-task-row'); if(r) {e.dataTransfer.setData('text/plain', r.dataset.taskId); e.dataTransfer.effectAllowed = 'move';}});
            this.sidebarBody.addEventListener('dragover', e => {
                e.preventDefault(); const row = e.target.closest('.gantt-task-row'); if (!row) return;
                const r = row.getBoundingClientRect(); e.clientY < r.top + r.height/2 ? (row.classList.add('drag-over-top'), row.classList.remove('drag-over-bottom')) : (row.classList.add('drag-over-bottom'), row.classList.remove('drag-over-top'));
            });
            this.sidebarBody.addEventListener('dragleave', e => {e.target.closest('.gantt-task-row')?.classList.remove('drag-over-top', 'drag-over-bottom');});
            this.sidebarBody.addEventListener('drop', e => {
                e.preventDefault(); const targetRow=e.target.closest('.gantt-task-row'); targetRow?.classList.remove('drag-over-top', 'drag-over-bottom');
                const draggedTaskId=e.dataTransfer.getData('text/plain'); if(!targetRow||!draggedTaskId)return;
                const targetTaskId=targetRow.dataset.taskId, draggedTask = this.tasks.find(t=>t.id===draggedTaskId), targetTask = this.tasks.find(t=>t.id===targetTaskId);
                if(!draggedTask || !targetTask || draggedTaskId === targetTaskId) return;

                const isDropOnTopHalf = e.clientY < targetRow.getBoundingClientRect().top + targetRow.offsetHeight / 2;
                
                // Case 1: Drop on a parent task (bottom half) to make it a child
                if (targetTask.type === 'parent' && !isDropOnTopHalf) {
                    draggedTask.parentId = targetTaskId;
                } else {
                    // Case 2: Drop as a sibling
                    draggedTask.parentId = targetTask.parentId;
                    // Re-order tasks array
                    const taskIndex = this.tasks.findIndex(t => t.id === draggedTaskId);
                    this.tasks.splice(taskIndex, 1);
                    const newPos = this.tasks.findIndex(t => t.id === targetTaskId);
                    this.tasks.splice(isDropOnTopHalf ? newPos : newPos + 1, 0, draggedTask);
                }
                
                this.markDirty(); this.updateParentTasks(); this.renderAll();
            });
        },
        initBarEditing: function() { },
        initFilters: function() {
            const searchInput = winEl.querySelector(`#ganttSearch_${uniqueSuffix}`);
            const statusFilter = winEl.querySelector(`#statusFilter_${uniqueSuffix}`);
            const assigneeFilter = winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            const clearBtn = winEl.querySelector(`#clearFiltersBtn_${uniqueSuffix}`);
            this.updateAssigneeFilter();
            const applyFilters = () => {
                const searchTerm=searchInput.value.toLowerCase(), status=statusFilter.value, assignee=assigneeFilter.value;
                this.filteredTasks = this.tasks.filter(task=>(!searchTerm||task.name.toLowerCase().includes(searchTerm))&& (status==='all'||task.status===status) && (assignee==='all'||task.assignee===assignee));
                this.renderAll();
            };
            searchInput.addEventListener('input', applyFilters);
            statusFilter.addEventListener('change', applyFilters);
            assigneeFilter.addEventListener('change', applyFilters);
            clearBtn.addEventListener('click',()=>{ searchInput.value='';statusFilter.value='all';assigneeFilter.value='all'; this.filteredTasks=[]; applyFilters(); });
        },
        updateAssigneeFilter: function() { 
            const f=winEl.querySelector(`#assigneeFilter_${uniqueSuffix}`);
            this.allAssignees=[...new Set(this.tasks.map(t=>t.assignee).filter(Boolean))];
            f.innerHTML = '<option value="all">Todos</option>';
            this.allAssignees.forEach(a=>{const o=document.createElement('option');o.value=o.textContent=a;f.appendChild(o);});
        },
        toggleFocusMode: function() {
            if (this.focusModeParentId) { // Exit focus mode
                this.focusModeParentId = null;
            } else if (this.selectedTaskId) { // Enter focus mode
                const task = this.tasks.find(t=>t.id === this.selectedTaskId);
                if(task && task.type==='parent') {this.focusModeParentId=this.selectedTaskId;}
                else { showNotification("Selecione um grupo (pasta) para focar.", 3000, 'warning'); }
            } else {
                showNotification("Selecione um grupo (pasta) para focar.", 3000, 'warning');
            }
            this.renderAll();
        },
        initFocusMode: function() {
            winEl.querySelector(`#focusModeBtn_${uniqueSuffix}`).addEventListener('click', this.toggleFocusMode.bind(this));
            winEl.querySelector(`#exitFocusMode_${uniqueSuffix}`).addEventListener('click', ()=>{this.focusModeParentId=null; this.renderAll();});
        },
        initKeyboardShortcuts: function() { 
            winEl.addEventListener('keydown', e => {
                if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
                if(e.key==='Delete'&&this.selectedTaskId && confirm('Tem certeza?')) { e.preventDefault(); this.removeTask(this.selectedTaskId);}
                if(e.ctrlKey&&e.key==='n'){e.preventDefault();this.addTask();}
                if(e.ctrlKey&&e.key==='f'){e.preventDefault();winEl.querySelector(`#ganttSearch_${uniqueSuffix}`).focus();}
                if(e.ctrlKey&&e.key==='s'){e.preventDefault();this.saveFile();}
                if(e.key==='Escape'){
                    e.preventDefault();
                    if(this.focusModeParentId){this.focusModeParentId=null;this.renderAll();}
                    if(this.dependencyCreation.active){this.dependencyCreation.active=false;this.svgOverlay.querySelector('.dependency-creation')?.remove();}
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
