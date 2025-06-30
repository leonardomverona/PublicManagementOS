import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openGanttChart() {
    const uniqueSuffix = generateId('gantt');
    const winId = window.windowManager.createWindow('Roadmap do Projeto (Gantt)', '', { width: '1250px', height: '700px', appType: 'gantt-chart' });
    const content = `
        <style>
            .gantt-chart-app-container { padding: 0 !important; background-color: var(--background); }
            .gantt-main-area { background-color: var(--window-bg); }
            .gantt-table-wrapper { width: 45% !important; border-right: 1px solid var(--separator-color); display: flex; flex-direction: column; }
            .gantt-table-header { font-size: 0.8em; background-color: var(--toolbar-bg); padding: 10px 8px; }
            .gantt-table-body { flex-grow: 1; overflow-y: auto !important; }
            .gantt-task-table-row { font-size: 0.85em; padding: 0 8px; min-height: 40px; border-bottom: 1px solid var(--separator-color); }
            .gantt-task-table-row .app-input { border: 1px solid transparent; background: transparent; }
            .gantt-task-table-row:hover .app-input { border-color: var(--input-border-color); background: var(--input-bg); }
            .gantt-chart-area-wrapper { position: relative; overflow: auto !important; padding: 0 !important; }
            .gantt-timeline-header { position: sticky; top: 0; background-color: var(--toolbar-bg); z-index: 3; white-space: nowrap; padding: 10px 0; border-bottom: 1px solid var(--separator-color); }
            .gantt-timeline-unit { display: inline-block; text-align: center; color: var(--secondary-text-color); font-size: 0.8em; border-right: 1px solid var(--separator-color); }
            .gantt-chart-content { position: relative; }
            .gantt-grid-lines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
            .gantt-grid-line { position: absolute; top: 0; height: 100%; border-right: 1px solid var(--separator-color); opacity: 0.5; }
            .gantt-bar-row { position: relative; height: 40px; }
            .gantt-bar {
                position: absolute;
                top: 8px; height: 24px;
                background-color: var(--accent-color);
                border-radius: 4px;
                display: flex; align-items: center;
                color: white; font-size: 0.8em;
                white-space: nowrap; overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                border: 1px solid rgba(0,0,0,0.2);
            }
            .gantt-bar:hover { filter: brightness(1.15); }
            .gantt-bar-label { padding: 0 8px; z-index: 1; pointer-events: none; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
            .gantt-bar-progress {
                position: absolute; top: 0; left: 0; height: 100%;
                background-color: rgba(255,255,255,0.3);
                border-radius: 4px;
            }
            .gantt-today-marker {
                position: absolute; top: 0; height: 100%;
                width: 2px; background: var(--danger-color, #dc3545);
                opacity: 0.8; z-index: 2; pointer-events: none;
            }
            #ganttSvgOverlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
            .gantt-dependency-path { stroke: var(--secondary-text-color); stroke-width: 1.5; fill: none; marker-end: url(#arrowhead); }
        </style>

        <div class="app-toolbar gantt-controls">
             ${getStandardAppToolbarHTML()}
             <button id="addGanttTaskBtn_${uniqueSuffix}" class="app-button" style="margin-left: auto;"><i class="fas fa-plus"></i> Nova Tarefa</button>
            <span style="margin-left:15px; font-size:0.9em;">Escala:</span>
            <select id="ganttTimeScale_${uniqueSuffix}" class="app-select" style="width:100px;"> <option value="days">Dias</option> <option value="weeks">Semanas</option> <option value="months">Meses</option> </select>
            <span style="margin-left:10px; font-size:0.9em;">Zoom: </span>
            <input type="range" id="ganttZoom_${uniqueSuffix}" min="20" max="150" value="40" style="width:100px;">
        </div>
        <div class="gantt-main-area">
            <div class="gantt-table-wrapper">
                <div class="gantt-table-header" style="display: grid; grid-template-columns: 3.5fr 1fr 1fr 1.5fr auto;"><span>Tarefa</span><span>Início</span><span>Fim</span><span>Responsável</span><span>Ações</span></div>
                <div id="ganttTableBody_${uniqueSuffix}" class="gantt-table-body"></div>
            </div>
            <div class="gantt-chart-area-wrapper" id="ganttChartAreaWrapper_${uniqueSuffix}">
                <div class="gantt-timeline-header" id="ganttTimelineHeader_${uniqueSuffix}"></div>
                <div class="gantt-chart-content" id="ganttChartContent_${uniqueSuffix}">
                    <div class="gantt-grid-lines" id="ganttGridLines_${uniqueSuffix}"></div>
                    <div id="ganttChartBars_${uniqueSuffix}"></div>
                    <svg id="ganttSvgOverlay" width="100%" height="100%">
                        <defs><marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill-opacity="0.7" fill="${'var(--secondary-text-color)'}"/></marker></defs>
                    </svg>
                </div>
            </div>
        </div>`;
    const winData = window.windowManager.windows.get(winId); if(!winData) return winId;
    winData.element.querySelector('.window-content').innerHTML = content;

    const appState = {
        winId, tasks: [], appDataType: 'gantt-chart',
        tableBody: winData.element.querySelector(`#ganttTableBody_${uniqueSuffix}`),
        chartBarsContainer: winData.element.querySelector(`#ganttChartBars_${uniqueSuffix}`),
        timelineHeader: winData.element.querySelector(`#ganttTimelineHeader_${uniqueSuffix}`),
        gridLinesEl: winData.element.querySelector(`#ganttGridLines_${uniqueSuffix}`),
        svgOverlayEl: winData.element.querySelector(`#ganttSvgOverlay`),
        chartContentEl: winData.element.querySelector(`#ganttChartContent_${uniqueSuffix}`),
        addTaskBtn: winData.element.querySelector(`#addGanttTaskBtn_${uniqueSuffix}`),
        zoomSlider: winData.element.querySelector(`#ganttZoom_${uniqueSuffix}`),
        timeScaleSelect: winData.element.querySelector(`#ganttTimeScale_${uniqueSuffix}`),
        
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
                showNotification("Erro ao ler arquivo Gantt.", 3000); 
            } 
        },
        init: function() { setupAppToolbarActions(this); this.addTaskBtn.onclick = () => this.addTask(); this.zoomSlider.oninput = () => this.renderAll(); this.timeScaleSelect.onchange = () => this.renderAll(); this.tableBody.addEventListener('input', (e) => this.handleTableInput(e)); this.tableBody.addEventListener('click', (e) => this.handleTableAction(e)); this.renderAll(); },
        renderAll: function() { this.renderTable(); this.renderChart(); },
        renderTable: function() {
            this.tableBody.innerHTML = '';
            this.tasks.forEach((task) => {
                const row = document.createElement('div');
                row.className = 'gantt-task-table-row';
                row.dataset.taskId = task.id;
                row.style.display = 'grid';
                row.style.gridTemplateColumns = '3.5fr 1fr 1fr 1.5fr auto';
                row.style.gap = '5px';
                row.style.alignItems = 'center';
                row.innerHTML = `
                    <input type="text" class="app-input" value="${task.name}" data-field="name" title="${task.name}">
                    <input type="date" class="app-input" value="${task.start || ''}" data-field="start">
                    <input type="date" class="app-input" value="${task.end || ''}" data-field="end">
                    <input type="text" class="app-input" value="${task.resources || ''}" data-field="resources" placeholder="Responsável">
                    <button class="app-button danger action-button" data-action="delete" title="Excluir"><i class="fas fa-trash"></i></button>
                `;
                this.tableBody.appendChild(row);
            });
        },
        renderChart: function() {
            this.chartBarsContainer.innerHTML = '';
            this.timelineHeader.innerHTML = '';
            this.gridLinesEl.innerHTML = '';
            this.svgOverlayEl.innerHTML = '<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill-opacity="0.7" fill="var(--secondary-text-color)"/></marker></defs>';

            if (this.tasks.length === 0) return;
            let minDateOverall = null, maxDateOverall = null;
            this.tasks.forEach(task => { if (task.start) { const d = new Date(task.start + "T00:00:00Z"); if (!minDateOverall || d < minDateOverall) minDateOverall = d; } if (task.end) { const d = new Date(task.end + "T00:00:00Z"); if (!maxDateOverall || d > maxDateOverall) maxDateOverall = d; } });
            
            if (!minDateOverall || !maxDateOverall) return;
            
            const timeScale = this.timeScaleSelect.value;
            const unitWidth = parseInt(this.zoomSlider.value);
            const getDaysBetween = (d1, d2) => Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
            
            const startDate = new Date(minDateOverall);
            startDate.setDate(startDate.getDate() - 10);
            const endDate = new Date(maxDateOverall);
            endDate.setDate(endDate.getDate() + 10);

            let totalUnits = 0;
            let currentDate = new Date(startDate);
            while(currentDate <= endDate) {
                const unitEl = document.createElement('span');
                unitEl.className = 'gantt-timeline-unit';
                unitEl.style.width = `${unitWidth}px`;
                
                if (timeScale === 'days') {
                    unitEl.textContent = `${currentDate.getDate()}/${currentDate.getMonth()+1}`;
                    currentDate.setDate(currentDate.getDate() + 1);
                } else if (timeScale === 'weeks') {
                    unitEl.textContent = `S${currentDate.getDate()}`;
                    currentDate.setDate(currentDate.getDate() + 7);
                } else { // months
                    unitEl.textContent = currentDate.toLocaleString('pt-BR', {month: 'short'});
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
                this.timelineHeader.appendChild(unitEl);

                const gridLine = document.createElement('div');
                gridLine.className = 'gantt-grid-line';
                gridLine.style.left = `${totalUnits * unitWidth}px`;
                this.gridLinesEl.appendChild(gridLine);

                totalUnits++;
            }
            const totalWidth = totalUnits * unitWidth;
            this.chartContentEl.style.height = `${this.tasks.length * 40}px`;
            [this.gridLinesEl, this.svgOverlayEl].forEach(el => { el.style.width = `${totalWidth}px`; el.style.height = '100%'; });
            
            this.tasks.forEach((task, index) => {
                if (!task.start || !task.end) return;
                const taskStart = new Date(task.start + "T00:00:00Z");
                const taskEnd = new Date(task.end + "T00:00:00Z");

                const offsetDays = getDaysBetween(startDate, taskStart);
                const durationDays = getDaysBetween(taskStart, taskEnd) + 1;
                
                const left = offsetDays * unitWidth;
                const width = durationDays * unitWidth - 2; // -2 for padding

                const barRow = document.createElement('div');
                barRow.className = 'gantt-bar-row';
                barRow.style.top = `${index * 40}px`;
                
                const bar = document.createElement('div');
                bar.id = `bar-${task.id}`;
                bar.className = 'gantt-bar';
                bar.style.left = `${left}px`;
                bar.style.width = `${width}px`;
                bar.style.backgroundColor = task.color || 'var(--accent-color)';

                const progress = task.progress || 0;
                bar.innerHTML = `<div class="gantt-bar-progress" style="width: ${progress}%"></div><span class="gantt-bar-label">${task.name} (${progress}%)</span>`;
                barRow.appendChild(bar);
                this.chartBarsContainer.appendChild(barRow);
            });
            this.drawTodayMarker(startDate, unitWidth);
            this.drawDependencyLines();
        },
        drawTodayMarker: function(timelineStart, unitWidth) {
            const today = new Date(); today.setHours(0,0,0,0);
            const offsetDays = Math.ceil((today - timelineStart) / (1000 * 60 * 60 * 24));
            const left = offsetDays * unitWidth;
            
            const marker = document.createElement('div');
            marker.className = 'gantt-today-marker';
            marker.style.left = `${left}px`;
            marker.title = `Hoje: ${today.toLocaleDateString()}`;
            this.gridLinesEl.appendChild(marker);
        },
        drawDependencyLines: function() {
            this.tasks.forEach(task => {
                if (!task.dependencies) return;
                const deps = task.dependencies.split(',').map(d => d.trim());
                deps.forEach(depId => {
                    const sourceTask = this.tasks.find(t => t.id.slice(-4) === depId || t.id === depId);
                    if (!sourceTask) return;
                    
                    const sourceBar = winData.element.querySelector(`#bar-${sourceTask.id}`);
                    const targetBar = winData.element.querySelector(`#bar-${task.id}`);
                    if (!sourceBar || !targetBar) return;

                    const startX = sourceBar.offsetLeft + sourceBar.offsetWidth;
                    const startY = sourceBar.offsetTop + sourceBar.offsetHeight / 2;
                    const endX = targetBar.offsetLeft;
                    const endY = targetBar.offsetTop + targetBar.offsetHeight / 2;

                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const curve = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX - 10} ${endY}`;
                    path.setAttribute('d', curve);
                    path.setAttribute('class', 'gantt-dependency-path');
                    this.svgOverlayEl.appendChild(path);
                });
            });
        },
        handleTableInput: function(e) {
            const rowEl = e.target.closest('.gantt-task-table-row'); if (!rowEl) return;
            const taskId = rowEl.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId); if (!task) return;
            
            const field = e.target.dataset.field;
            task[field] = e.target.value;
            
            if (field === 'start' || field === 'end') {
                if (task.start && task.end) {
                    task.duration = Math.ceil((new Date(task.end) - new Date(task.start)) / 864e5) + 1;
                }
            }
            this.markDirty();
            this.renderAll();
        },
        handleTableAction: function(e) {
            const button = e.target.closest('button[data-action="delete"]');
            if (button) { const taskId = button.closest('.gantt-task-table-row').dataset.taskId; this.tasks = this.tasks.filter(t => t.id !== taskId); this.markDirty(); this.renderAll(); }
        },
        addTask: function() {
            const defaultColors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA', '#FFCC00', '#8E8E93'];
            const color = defaultColors[this.tasks.length % defaultColors.length];
            this.tasks.push({id: generateId('gtsk'), name: 'Nova Tarefa', start: new Date().toISOString().split('T')[0], end: new Date(Date.now() + 5 * 864e5).toISOString().split('T')[0], progress: 0, resources: '', dependencies: '', color: color});
            this.markDirty();
            this.renderAll();
        },
        cleanup: () => {}
    };
    
    initializeFileState(appState, "Roadmap do Projeto", "roadmap.gantt", "gantt-chart");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
