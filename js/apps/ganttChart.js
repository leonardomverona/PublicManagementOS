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
            }
            .gantt-chart-app-container { padding: 0 !important; background-color: var(--background); font-family: 'Inter', sans-serif; }
            .gantt-v2-container { display: flex; height: calc(100% - 40px); width: 100%; }
            
            /* --- Barra de Ferramentas --- */
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
                box-sizing: border-box;
            }
            .gantt-sidebar-header { padding: 10px; font-size: 0.75em; font-weight: 600; color: var(--secondary-text-color); border-bottom: 1px solid var(--separator-color); text-transform: uppercase; }
            .gantt-sidebar-body { flex-grow: 1; overflow-y: auto; }
            .gantt-task-row { min-height: var(--gantt-row-height); border-bottom: 1px solid var(--separator-color); cursor: pointer; user-select: none; }
            .gantt-task-row:hover { background-color: var(--hover-highlight-color); }
            .task-cell { padding: 5px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; }
            .task-cell input, .task-cell select { width: 100%; background: transparent; border: none; color: var(--text-color); padding: 5px; border-radius: 4px; box-sizing: border-box; font-size: 0.9em; }
            .task-cell input:focus, .task-cell select:focus { background: var(--input-bg); outline: 1px solid var(--accent-color); }
            .task-cell input[type="date"] { padding-right: 0; }
            .task-cell input[type="number"] { -moz-appearance: textfield; }
            .task-cell input::-webkit-outer-spin-button, .task-cell input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            .task-name-cell { gap: 5px; }
            .task-expander { width: 20px; text-align: center; cursor: pointer; color: var(--secondary-text-color); transition: transform 0.2s; flex-shrink: 0; }
            .task-expander.collapsed { transform: rotate(-90deg); }
            .task-icon { margin: 0 4px; flex-shrink: 0; }
            .avatar { width: 24px; height: 24px; border-radius: 50%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 600; margin-right: 8px; flex-shrink: 0; }
            
            /* --- Divisor Redimensionável --- */
            .gantt-splitter { width: 5px; background: var(--separator-color); cursor: col-resize; transition: background-color 0.2s; }
            .gantt-splitter:hover, .gantt-splitter.dragging { background: var(--accent-color); }

            /* --- Área do Gráfico --- */
            .gantt-chart-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
            .gantt-chart-header-container { flex-shrink: 0; position: sticky; top: 0; z-index: 4; background-color: var(--toolbar-bg); }
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
            .gantt-bar { position: relative; height: 28px; background-color: var(--accent-color); border-radius: 6px; display: flex; align-items: center; color: white; font-size: 0.85em; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: move; transition: filter 0.2s; }
            .gantt-bar:hover { filter: brightness(1.1); }
            .gantt-bar-progress { position: absolute; top: 0; left: 0; height: 100%; background: rgba(0,0,0,0.25); border-radius: 6px; pointer-events: none; }
            .gantt-bar-handle { position: absolute; top: 0; width: 8px; height: 100%; z-index: 2; }
            .gantt-bar-handle.left { left: 0; cursor: ew-resize; }
            .gantt-bar-handle.right { right: 0; cursor: ew-resize; }
            .gantt-bar-parent { background-color: var(--gantt-parent-bar-color); border-radius: 2px; height: 12px; }
            .gantt-bar-parent .gantt-bar-progress { background-color: rgba(255,255,255,0.4); }
            .gantt-milestone { position: absolute; width: 24px; height: 24px; background: var(--gantt-milestone-color); transform: rotate(45deg); top: 8px; border-radius: 3px; cursor: move; transition: transform 0.2s; }
            .gantt-milestone:hover { transform: rotate(45deg) scale(1.1); }
            
            .status-todo { background-color: #a9a9a9; }
            .status-inprogress { background-color: #4a6cf7; }
            .status-done { background-color: #28a745; }
            .status-blocked { background-color: #dc3545; }

            #ganttSvgOverlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            .gantt-dependency-path { stroke: var(--secondary-text-color); stroke-width: 1.5; fill: none; opacity: 0.8; marker-end: url(#arrowhead); }
            .gantt-critical-path { stroke: var(--danger-color) !important; stroke-width: 2.5 !important; opacity: 1 !important; }
            .gantt-bar.critical { border: 2px solid var(--danger-color); }

            /* --- Tooltip --- */
            .gantt-tooltip { position: fixed; background: var(--context-menu-bg); color: var(--text-color); border: 1px solid var(--separator-color); border-radius: 8px; padding: 10px; z-index: 10000; font-size: 0.9em; box-shadow: 0 5px 15px rgba(0,0,0,0.2); pointer-events: none; opacity: 0; transition: opacity 0.2s; max-width: 300px; }
            .gantt-tooltip.visible { opacity: 1; }
            .gantt-tooltip-title { font-weight: 600; margin-bottom: 8px; }
            .gantt-tooltip-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .gantt-tooltip-label { color: var(--secondary-text-color); margin-right: 15px; }
        </style>

        <div class="app-toolbar">
            ${getStandardAppToolbarHTML()}
            <button id="addTaskBtn_${uniqueSuffix}" class="app-button" style="margin-left: auto;"><i class="fas fa-plus-circle"></i> Tarefa</button>
            <button id="addMilestoneBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-gem"></i> Marco</button>
            <div class="toolbar-separator"></div>
            <button id="zoomOutBtn_${uniqueSuffix}" class="app-button secondary" title="Reduzir Zoom"><i class="fas fa-search-minus"></i></button>
            <button id="zoomInBtn_${uniqueSuffix}" class="app-button secondary" title="Aumentar Zoom"><i class="fas fa-search-plus"></i></button>
            <button id="todayBtn_${uniqueSuffix}" class="app-button secondary" title="Ir para Hoje"><i class="fas fa-calendar-day"></i></button>
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
                        </svg>
                        <div class="gantt-grid" id="ganttGrid_${uniqueSuffix}"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="gantt-tooltip" id="ganttTooltip_${uniqueSuffix}"></div>
    `;
    const winEl = window.windowManager.getWindow(winId);
    if (!winEl) return winId;
    winEl.querySelector('.window-content').innerHTML = content;
    const winData = window.windowManager.windows.get(winId);

    const appState = {
        winId, tasks: [], appDataType: 'gantt-chart',
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
            winEl.querySelector(`#zoomInBtn_${uniqueSuffix}`).onclick = () => this.zoomIn();
            winEl.querySelector(`#zoomOutBtn_${uniqueSuffix}`).onclick = () => this.zoomOut();
            winEl.querySelector(`#todayBtn_${uniqueSuffix}`).onclick = () => this.goToToday();

            // Eventos
            this.sidebarBody.addEventListener('input', (e) => this.handleSidebarInput(e));
            this.sidebarBody.addEventListener('click', (e) => this.handleSidebarClick(e));
            this.chartViewport.addEventListener('scroll', this.syncScroll.bind(this));
            this.sidebarBody.addEventListener('scroll', this.syncScroll.bind(this));
            this.chartContent.addEventListener('mousedown', (e) => this.handleBarInteraction(e));
            this.chartContent.addEventListener('mouseover', (e) => this.handleBarMouseOver(e));
            this.chartContent.addEventListener('mouseout', () => this.hideTooltip());
            
            this.setupSplitter();
            this.renderAll();
        },

        // --- Lógica de Renderização Principal ---
        renderAll: function() {
            this.updateParentTasks();
            this.calculateTimeline();
            this.flatTaskOrder = this.getFlatTaskOrder();
            this.renderSidebar();
            this.renderChart();
            this.renderDependencies();
            this.calculateAndDrawCriticalPath();
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
        zoomIn: function() { this.timeline.unitWidth = Math.min(100, this.timeline.unitWidth + 10); this.renderAll(); },
        zoomOut: function() { this.timeline.unitWidth = Math.max(20, this.timeline.unitWidth - 10); this.renderAll(); },
        goToToday: function() {
            const { startDate, unitWidth } = this.timeline;
            const todayOffset = this.daysBetween(startDate, new Date()) * unitWidth;
            this.chartViewport.scrollLeft = todayOffset - this.chartViewport.offsetWidth / 2;
        },

        // --- Renderização da Barra Lateral ---
        renderSidebar: function() {
            this.sidebarBody.innerHTML = '';
            const renderTaskNode = (task, level) => {
                const row = document.createElement('div');
                row.className = 'gantt-task-row';
                row.dataset.taskId = task.id;
                
                const children = this.tasks.filter(t => t.parentId === task.id);
                const isParent = task.type === 'parent' || children.length > 0;
                task.type = isParent ? 'parent' : task.type;

                const expanderHTML = isParent ? `<span class="task-expander ${task.collapsed ? 'collapsed' : ''}"><i class="fas fa-angle-down"></i></span>` : '<span class="task-expander"></span>';
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
                `;
                this.sidebarBody.appendChild(row);

                if (isParent && !task.collapsed) {
                    children.sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(child => renderTaskNode(child, level + 1));
                }
            };
            this.tasks.filter(t => !t.parentId).sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(task => renderTaskNode(task, 0));
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
            const monthsEl = document.createElement('div'); monthsEl.className = 'gantt-timeline-months';
            const daysEl = document.createElement('div'); daysEl.className = 'gantt-timeline-days';
            
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
                            <span style="z-index:1; padding: 0 8px; pointer-events:none; color: ${task.type === 'parent' ? '#fff' : 'inherit'}">${task.name}</span>
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
            this.chartContent.querySelectorAll('.gantt-bar-container').forEach(b => { barElements[b.dataset.taskId] = b; });
            
            const getTaskIndex = (taskId) => this.flatTaskOrder.indexOf(taskId);

            this.tasks.forEach(task => {
                if(task.dependencies) {
                    const deps = task.dependencies.split(',');
                    deps.forEach(depId => {
                        const predecessor = this.tasks.find(t => t.id === depId.trim());
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
        calculateAndDrawCriticalPath: function() { /* ... (a lógica existente é robusta e mantida) ... */ },

        // --- Adicionar e Manipular Tarefas ---
        addTask: function(isMilestone = false) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const endStr = this.addDays(today, isMilestone ? 0 : 5).toISOString().split('T')[0];

            const newTask = {
                id: generateId('task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start: todayStr, end: endStr,
                assignee: '', status: 'todo', progress: 0, dependencies: '',
                type: isMilestone ? 'milestone' : 'task',
                parentId: null
            };
            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
        },
        updateParentTasks: function() { /* ... (a lógica existente é robusta e mantida) ... */ },

        // --- Manipuladores de Eventos ---
        handleSidebarInput: function(e) {
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = e.target.dataset.field;
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task[field] = e.target.value;
                if (field === 'start' && task.type !== 'milestone') {
                    const duration = this.daysBetween(task.start, task.end);
                    if (duration < 0) task.end = task.start;
                }
                this.markDirty();
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
            }
        },
        handleBarInteraction: function(e) { /* ... (a lógica existente é robusta e mantida) ... */ },
        handleBarMouseOver: function(e) {
            const barContainer = e.target.closest('.gantt-bar-container');
            if (barContainer) {
                const taskId = barContainer.dataset.taskId;
                const task = this.tasks.find(t => t.id === taskId);
                if (task) this.showTooltip(e, task);
            }
        },

        // --- Funções Utilitárias ---
        showTooltip: function(e, task) {
            const duration = this.daysBetween(task.start, task.end) + 1;
            this.tooltipEl.innerHTML = `
                <div class="gantt-tooltip-title">${task.name}</div>
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
            `;
            this.tooltipEl.style.left = `${e.clientX + 15}px`;
            this.tooltipEl.style.top = `${e.clientY + 15}px`;
            this.tooltipEl.classList.add('visible');
        },
        hideTooltip: function() { this.tooltipEl.classList.remove('visible'); },
        generateAvatar: function(name) { /* ... (a lógica existente é robusta e mantida) ... */ },
        getFlatTaskOrder: function() { /* ... (a lógica existente é robusta e mantida) ... */ },
        setupSplitter: function() { /* ... (a lógica existente é robusta e mantida) ... */ },
        
        cleanup: () => {}
    };
    
    // Anexar lógicas omitidas para brevidade, pois são robustas da versão anterior
    appState.calculateAndDrawCriticalPath = this.sharedCritialPathLogic;
    appState.updateParentTasks = this.sharedParentTaskLogic;
    appState.handleBarInteraction = this.sharedBarInteractionLogic;
    appState.generateAvatar = this.sharedAvatarLogic;
    appState.getFlatTaskOrder = this.sharedFlatTaskOrderLogic;
    appState.setupSplitter = this.sharedSplitterLogic;
    appState.appState = appState; // Referência para uso interno nas lógicas compartilhadas

    initializeFileState(appState, "Roadmap do Projeto", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}

// Lógicas compartilhadas para evitar repetição massiva de código
this.sharedCritialPathLogic = function() {
    const tasks = this.appState.tasks.filter(t => t.type !== 'parent');
    if (tasks.length === 0) return;

    tasks.forEach(t => {
        t.earlyStart = 0;
        t.earlyFinish = 0;
        t.lateStart = Infinity;
        t.lateFinish = Infinity;
        t.duration = this.appState.daysBetween(t.start, t.end) + 1;
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

    const startNodes = tasks.filter(t => !t.dependencies || t.dependencies.trim() === '');
    let q = [...startNodes];
    let processed = new Set();
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
            const allDepsProcessed = (v.dependencies.split(',').every(depId => processedForward.has(depId.trim())));
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
    this.appState.chartContent.querySelectorAll('.gantt-bar.critical').forEach(el => el.classList.remove('critical'));
    tasks.forEach(t => {
        const slack = t.lateStart - t.earlyStart;
        if (slack < 0.01) {
            criticalPathTaskIds.add(t.id);
            const barEl = this.appState.chartContent.querySelector(`.gantt-bar-container[data-task-id="${t.id}"] .gantt-bar`);
            if (barEl) barEl.classList.add('critical');
        }
    });

    this.appState.svgOverlay.querySelectorAll('.gantt-dependency-path').forEach(path => {
        const { fromId, toId } = path.dataset;
        if (criticalPathTaskIds.has(fromId) && criticalPathTaskIds.has(toId)) {
            path.classList.add('gantt-critical-path');
        } else {
            path.classList.remove('gantt-critical-path');
        }
    });
};
this.sharedParentTaskLogic = function() {
    const processNode = (task) => {
        const children = this.appState.tasks.filter(c => c.parentId === task.id);
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
    this.appState.tasks.filter(t => t.type === 'parent').forEach(processNode);
};
this.sharedBarInteractionLogic = function(e) {
    const bar = e.target.closest('.gantt-bar, .gantt-milestone');
    if (!bar) return;

    const container = bar.closest('.gantt-bar-container');
    const taskId = container.dataset.taskId;
    const task = this.appState.tasks.find(t => t.id === taskId);
    if (!task || task.type === 'parent') return;

    this.appState.hideTooltip();
    const initialX = e.clientX;
    const initialStart = new Date(task.start);
    const initialEnd = new Date(task.end);
    const handle = e.target.classList.contains('gantt-bar-handle') ? e.target.className.includes('left') ? 'left' : 'right' : null;
    
    const onMouseMove = (moveE) => {
        const deltaX = moveE.clientX - initialX;
        const deltaDays = Math.round(deltaX / this.appState.timeline.unitWidth);

        if (handle === 'left') {
            const newStart = this.appState.addDays(initialStart, deltaDays);
            if (newStart <= initialEnd) {
                task.start = newStart.toISOString().split('T')[0];
            }
        } else if (handle === 'right') {
            const newEnd = this.appState.addDays(initialEnd, deltaDays);
            if (newEnd >= new Date(task.start)) {
                task.end = newEnd.toISOString().split('T')[0];
            }
        } else { // Mover barra inteira
            task.start = this.appState.addDays(initialStart, deltaDays).toISOString().split('T')[0];
            task.end = this.appState.addDays(initialEnd, deltaDays).toISOString().split('T')[0];
        }
        this.appState.renderAll();
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.appState.markDirty();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};
this.sharedAvatarLogic = function(name) {
    if (!name || name.trim() === '') return `<div class="avatar" style="background-color: #ccc;" title="Não atribuído"></div>`;
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const colors = ['#4a6cf7', '#28a745', '#ffc107', '#dc3545', '#6a11cb', '#fd7e14', '#0dcaf0'];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[charCodeSum % colors.length];
    return `<div class="avatar" style="background-color: ${color};" title="${name}">${initials}</div>`;
};
this.sharedFlatTaskOrderLogic = function() {
    const order = [];
    const processNode = (task) => {
        order.push(task.id);
        if (task.type === 'parent' && !task.collapsed) {
            this.appState.tasks.filter(t => t.parentId === task.id)
                .sort((a,b) => new Date(a.start) - new Date(b.start))
                .forEach(processNode);
        }
    };
    this.appState.tasks.filter(t => !t.parentId)
        .sort((a,b) => new Date(a.start) - new Date(b.start))
        .forEach(processNode);
    return order;
};
this.sharedSplitterLogic = function() {
    const splitter = this.appState.splitter;
    const sidebar = splitter.previousElementSibling;
    let isDragging = false;
    splitter.addEventListener('mousedown', (e) => {
        isDragging = true;
        splitter.classList.add('dragging');
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
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
};
