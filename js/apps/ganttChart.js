import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openGanttChart() {
    const uniqueSuffix = generateId('gantt');
    const winId = window.windowManager.createWindow('Roadmap do Projeto (Gantt 2.0)', '', { width: '90vw', height: '85vh', appType: 'gantt-chart' });

    const content = `
        <style>
            .gantt-chart-app-container { padding: 0 !important; background-color: var(--background); }
            .gantt-v2-container { display: flex; height: 100%; width: 100%; }
            
            /* --- Painel da Tabela (Sidebar) --- */
            .gantt-sidebar { width: 35%; min-width: 300px; background-color: var(--window-bg); display: flex; flex-direction: column; border-right: 1px solid var(--separator-color); }
            .gantt-sidebar-header { padding: 10px; font-size: 0.8em; font-weight: 600; color: var(--secondary-text-color); border-bottom: 1px solid var(--separator-color); display: grid; grid-template-columns: 40px 1fr 120px; gap: 10px; align-items: center; }
            .gantt-sidebar-body { flex-grow: 1; overflow-y: auto; }
            .gantt-task-row { display: grid; grid-template-columns: 40px 1fr 120px; gap: 10px; align-items: center; min-height: 40px; border-bottom: 1px solid var(--separator-color); cursor: pointer; }
            .gantt-task-row:hover { background-color: var(--hover-highlight-color); }
            .task-cell { padding: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .task-cell input { width: 100%; background: transparent; border: none; color: var(--text-color); padding: 5px; border-radius: 4px; }
            .task-cell input:focus { background: var(--input-bg); outline: 1px solid var(--accent-color); }
            .task-name-cell { display: flex; align-items: center; }
            .task-expander { width: 20px; text-align: center; cursor: pointer; color: var(--secondary-text-color); }
            .task-icon { margin-right: 8px; }
            .avatar { width: 24px; height: 24px; border-radius: 50%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 600; margin-right: 8px; }
            
            /* --- Divisor Redimensionável --- */
            .gantt-splitter { width: 5px; background: var(--separator-color); cursor: col-resize; }
            .gantt-splitter:hover { background: var(--accent-color); }

            /* --- Área do Gráfico --- */
            .gantt-chart-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
            .gantt-chart-header { flex-shrink: 0; }
            .gantt-chart-viewport { flex-grow: 1; overflow: auto; position: relative; }
            .gantt-chart-content { position: relative; }
            .gantt-timeline-header { position: sticky; top: 0; background-color: var(--toolbar-bg); z-index: 3; white-space: nowrap; border-bottom: 1px solid var(--separator-color); }
            .gantt-timeline-month, .gantt-timeline-day { display: inline-block; text-align: center; color: var(--secondary-text-color); font-size: 0.8em; border-right: 1px solid var(--separator-color); box-sizing: border-box; }
            .gantt-timeline-month { font-weight: 600; padding: 5px 0; }
            .gantt-timeline-day { padding: 8px 0; }

            .gantt-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
            .gantt-grid-line, .gantt-row-line { position: absolute; background-color: var(--separator-color); }
            .gantt-grid-line { top: 0; width: 1px; height: 100%; opacity: 0.5; }
            .gantt-row-line { left: 0; height: 1px; width: 100%; }

            .gantt-bar-container { position: absolute; height: 40px; display: flex; align-items: center; }
            .gantt-bar { position: relative; height: 28px; background-color: var(--accent-color); border-radius: 6px; display: flex; align-items: center; padding: 0 10px; color: white; font-size: 0.85em; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer; }
            .gantt-bar-progress { position: absolute; top: 0; left: 0; height: 100%; background: rgba(255,255,255,0.3); border-radius: 6px; pointer-events: none; }
            .gantt-milestone { position: absolute; width: 20px; height: 20px; background: var(--dark-color); transform: rotate(45deg); top: 10px; border-radius: 3px; }
            
            .status-todo { background-color: #a9a9a9; }
            .status-inprogress { background-color: #4a6cf7; }
            .status-done { background-color: #28a745; }
            .status-blocked { background-color: #dc3545; }

            #ganttSvgOverlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            .gantt-dependency-path { stroke: var(--secondary-text-color); stroke-width: 1.5; fill: none; opacity: 0.8; marker-end: url(#arrowhead); }
            .gantt-critical-path { stroke: var(--danger-color); stroke-width: 2.5; fill: none; opacity: 0.7; }
        </style>

        <div class="app-toolbar">
            ${getStandardAppToolbarHTML()}
            <button id="addTaskBtn_${uniqueSuffix}" class="app-button" style="margin-left: auto;"><i class="fas fa-plus-circle"></i> Tarefa</button>
            <button id="addMilestoneBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-gem"></i> Marco</button>
        </div>
        <div class="gantt-v2-container">
            <div class="gantt-sidebar" id="ganttSidebar_${uniqueSuffix}">
                <div class="gantt-sidebar-header">
                    <span>TAREFA</span>
                    <span>STATUS</span>
                    <span>RESPONSÁVEL</span>
                </div>
                <div class="gantt-sidebar-body" id="ganttSidebarBody_${uniqueSuffix}"></div>
            </div>
            <div class="gantt-splitter" id="ganttSplitter_${uniqueSuffix}"></div>
            <div class="gantt-chart-area">
                <div class="gantt-chart-header" id="ganttChartHeader_${uniqueSuffix}"></div>
                <div class="gantt-chart-viewport" id="ganttChartViewport_${uniqueSuffix}">
                    <div class="gantt-chart-content" id="ganttChartContent_${uniqueSuffix}">
                        <div class="gantt-grid" id="ganttGrid_${uniqueSuffix}"></div>
                        <svg id="ganttSvgOverlay" width="100%" height="100%">
                           <defs><marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" opacity="0.8" fill="var(--secondary-text-color)"/></marker></defs>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `;
    const winData = window.windowManager.windows.get(winId); if(!winData) return winId;
    winData.element.querySelector('.window-content').innerHTML = content;

    const appState = {
        winId, tasks: [], appDataType: 'gantt-chart',
        // UI elements
        sidebarBody: winData.element.querySelector(`#ganttSidebarBody_${uniqueSuffix}`),
        chartHeader: winData.element.querySelector(`#ganttChartHeader_${uniqueSuffix}`),
        chartViewport: winData.element.querySelector(`#ganttChartViewport_${uniqueSuffix}`),
        chartContent: winData.element.querySelector(`#ganttChartContent_${uniqueSuffix}`),
        gridEl: winData.element.querySelector(`#ganttGrid_${uniqueSuffix}`),
        svgOverlay: winData.element.querySelector(`#ganttSvgOverlay`),
        // Controls
        addTaskBtn: winData.element.querySelector(`#addTaskBtn_${uniqueSuffix}`),
        addMilestoneBtn: winData.element.querySelector(`#addMilestoneBtn_${uniqueSuffix}`),
        splitter: winData.element.querySelector(`#ganttSplitter_${uniqueSuffix}`),
        // State
        timeline: { startDate: null, endDate: null, unitWidth: 40, totalWidth: 0 },
        
        getData: function() { return this.tasks; },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString); this.tasks = Array.isArray(data) ? data : []; 
                this.fileId = fileMeta.id; this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
            } catch (e) { showNotification("Erro ao ler arquivo Gantt.", 3000); } 
        },
        
        init: function() {
            setupAppToolbarActions(this);
            this.addTaskBtn.onclick = () => this.addTask();
            this.addMilestoneBtn.onclick = () => this.addTask(true); // isMilestone = true
            this.sidebarBody.addEventListener('input', (e) => this.handleSidebarInput(e));
            this.chartViewport.addEventListener('scroll', () => { this.sidebarBody.scrollTop = this.chartViewport.scrollTop; });
            this.sidebarBody.addEventListener('scroll', () => { this.chartViewport.scrollTop = this.sidebarBody.scrollTop; });
            this.setupSplitter();
            this.renderAll();
        },

        renderAll: function() {
            this.calculateTimeline();
            this.renderSidebar();
            this.renderChart();
        },
        
        calculateTimeline: function() {
            if (this.tasks.length === 0) { this.timeline = { startDate: new Date(), endDate: new Date(), unitWidth: 40, totalWidth: 0 }; return; }
            let minDate = null, maxDate = null;
            this.tasks.forEach(t => {
                const start = new Date(t.start);
                const end = t.end ? new Date(t.end) : new Date(t.start);
                if (!minDate || start < minDate) minDate = start;
                if (!maxDate || end > maxDate) maxDate = end;
            });
            const startDate = new Date(minDate); startDate.setDate(startDate.getDate() - 7);
            const endDate = new Date(maxDate); endDate.setDate(endDate.getDate() + 14);
            this.timeline.startDate = startDate;
            this.timeline.endDate = endDate;
        },

        renderSidebar: function() {
            this.sidebarBody.innerHTML = '';
            this.tasks.forEach(task => {
                const row = document.createElement('div');
                row.className = 'gantt-task-row';
                row.dataset.taskId = task.id;
                
                const icon = task.type === 'milestone' ? 'fa-gem' : 'fa-tasks';
                const statusOptions = ['todo', 'inprogress', 'done', 'blocked'].map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('');
                const assignee = task.assignee || '';
                
                row.innerHTML = `
                    <div class="task-cell task-name-cell"><i class="fas ${icon} task-icon"></i><input type="text" value="${task.name}" data-field="name"></div>
                    <div class="task-cell"><select class="app-select" data-field="status">${statusOptions}</select></div>
                    <div class="task-cell" title="${assignee}">${this.generateAvatar(assignee)}<input type="text" value="${assignee}" data-field="assignee" placeholder="Responsável"></div>
                `;
                this.sidebarBody.appendChild(row);
            });
        },
        
        renderChart: function() {
            const { startDate, endDate, unitWidth } = this.timeline;
            if (!startDate) return;

            const days = (d2, d1) => Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
            const totalDays = days(endDate, startDate);
            this.timeline.totalWidth = totalDays * unitWidth;

            // Clear previous renders
            this.chartHeader.innerHTML = '';
            this.gridEl.innerHTML = '';
            this.chartContent.innerHTML = ''; // Clears bars
            
            // Render Header
            let currentMonth = -1;
            for (let i = 0; i < totalDays; i++) {
                const dayDate = new Date(startDate);
                dayDate.setDate(dayDate.getDate() + i);
                if (dayDate.getMonth() !== currentMonth) {
                    currentMonth = dayDate.getMonth();
                    const monthName = dayDate.toLocaleString('pt-BR', { month: 'long' });
                    const monthEl = document.createElement('div');
                    monthEl.className = 'gantt-timeline-month';
                    monthEl.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    // This needs logic to span correct number of days
                    this.chartHeader.appendChild(monthEl); // Simplified for now
                }
                const dayEl = document.createElement('div');
                dayEl.className = 'gantt-timeline-day';
                dayEl.style.width = `${unitWidth}px`;
                dayEl.textContent = dayDate.getDate();
                this.chartHeader.appendChild(dayEl);

                // Render Grid
                const gridLine = document.createElement('div');
                gridLine.className = 'gantt-grid-line';
                gridLine.style.left = `${i * unitWidth}px`;
                this.gridEl.appendChild(gridLine);
            }

            // Render Row Lines and Bars
            this.tasks.forEach((task, index) => {
                const rowLine = document.createElement('div');
                rowLine.className = 'gantt-row-line';
                rowLine.style.top = `${index * 40 + 39}px`;
                this.gridEl.appendChild(rowLine);
                
                const taskStart = new Date(task.start);
                const left = days(startDate, taskStart) * unitWidth;

                const barContainer = document.createElement('div');
                barContainer.className = 'gantt-bar-container';
                barContainer.style.top = `${index * 40}px`;
                barContainer.style.left = `${left}px`;
                barContainer.dataset.taskId = task.id;

                if (task.type === 'milestone') {
                    barContainer.innerHTML = `<div class="gantt-milestone" title="${task.name} - ${taskStart.toLocaleDateString()}"></div>`;
                } else {
                    const taskEnd = new Date(task.end);
                    const width = days(taskEnd, taskStart) * unitWidth;
                    barContainer.style.width = `${width}px`;
                    barContainer.innerHTML = `
                        <div class="gantt-bar status-${task.status || 'todo'}" title="${task.name}">
                            <div class="gantt-bar-progress" style="width: ${task.progress || 0}%"></div>
                            <span style="z-index:1; padding: 0 8px;">${task.name}</span>
                        </div>
                    `;
                }
                this.chartContent.appendChild(barContainer);
            });
            
            // Adjust content size
            this.chartContent.style.width = `${this.timeline.totalWidth}px`;
            this.chartContent.style.height = `${this.tasks.length * 40}px`;
            this.svgOverlay.style.width = `${this.timeline.totalWidth}px`;
            this.svgOverlay.style.height = `${this.tasks.length * 40}px`;

            this.renderDependencies();
            this.calculateAndDrawCriticalPath();
        },

        renderDependencies: function() { /* Logic for drawing SVG lines */ },
        calculateAndDrawCriticalPath: function() { /* Advanced logic for critical path */ },

        addTask: function(isMilestone = false) {
            const today = new Date();
            const newTask = {
                id: generateId('task'),
                name: isMilestone ? 'Novo Marco' : 'Nova Tarefa',
                start: today.toISOString().split('T')[0],
                end: isMilestone ? today.toISOString().split('T')[0] : new Date(today.setDate(today.getDate() + 5)).toISOString().split('T')[0],
                assignee: '',
                status: 'todo',
                progress: 0,
                dependencies: '',
                type: isMilestone ? 'milestone' : 'task'
            };
            this.tasks.push(newTask);
            this.markDirty();
            this.renderAll();
        },

        handleSidebarInput: function(e) {
            const row = e.target.closest('.gantt-task-row');
            if (!row) return;
            const taskId = row.dataset.taskId;
            const field = e.target.dataset.field;
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task[field] = e.target.value;
                this.markDirty();
                this.renderAll();
            }
        },

        generateAvatar: function(name) {
            if (!name) return '';
            const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            const colors = ['#4a6cf7', '#28a745', '#ffc107', '#dc3545', '#6a11cb', '#fd7e14'];
            const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const color = colors[charCodeSum % colors.length];
            return `<div class="avatar" style="background-color: ${color};" title="${name}">${initials}</div>`;
        },

        setupSplitter: function() {
            const splitter = this.splitter;
            const sidebar = winData.element.querySelector(`#ganttSidebar_${uniqueSuffix}`);
            let isDragging = false;
            splitter.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.preventDefault();
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            const onMouseMove = (e) => {
                if (!isDragging) return;
                const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
                if (newWidth > 250 && newWidth < window.innerWidth - 300) {
                    sidebar.style.width = `${newWidth}px`;
                }
            };
            const onMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
        },
        
        cleanup: () => {}
    };
    
    initializeFileState(appState, "Roadmap do Projeto", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
