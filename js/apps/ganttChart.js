import React, { useState, useEffect, useReducer, useCallback, useMemo, useRef } from 'react';

// Estilos CSS (embutidos para simplicidade)
const styles = `
:root {
    --background-primary: #1e1e1e;
    --background-secondary: #252526;
    --background-tertiary: #333333;
    --text-primary: #d4d4d4;
    --text-secondary: #a0a0a0;
    --border-color: #444444;
    --accent-primary: #0e639c;
    --accent-primary-hover: #1177bb;
    --accent-secondary: #5d6d7e;
    --color-critical: #e74c3c;
    --color-milestone: #a569bd;
    --color-parent: #5d6d7e;
    --color-task-todo: #3a86ff;
    --color-task-inprogress: #ffbe0b;
    --color-task-done: #83d483;
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --header-height: 50px;
    --toolbar-height: 40px;
    --row-height: 38px;
    --splitter-width: 5px;
}

body {
    background-color: var(--background-primary);
    color: var(--text-primary);
    font-family: var(--font-family);
    margin: 0;
    overflow: hidden;
}

.pmo-app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background-color: var(--background-secondary);
}

.pmo-main-header {
    display: flex;
    align-items: center;
    padding: 0 20px;
    height: var(--header-height);
    background-color: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.pmo-main-header h1 {
    font-size: 1.2rem;
    margin: 0;
}

.pmo-toolbar {
    display: flex;
    align-items: center;
    padding: 0 15px;
    height: var(--toolbar-height);
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    gap: 10px;
    flex-shrink: 0;
}

.pmo-toolbar-button {
    background-color: var(--background-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 5px 12px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
}

.pmo-toolbar-button:hover {
    background-color: var(--accent-primary-hover);
    border-color: var(--accent-primary);
}

.pmo-toolbar-button.toggled {
    background-color: var(--accent-primary);
    border-color: var(--accent-primary-hover);
}

.pmo-gantt-container {
    display: flex;
    flex-grow: 1;
    overflow: hidden;
}

.pmo-task-list {
    background-color: var(--background-secondary);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border-color);
}

.pmo-task-list-header {
    display: grid;
    grid-template-columns: minmax(250px, 1fr) 100px 100px 150px 100px 100px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    background-color: var(--background-tertiary);
    border-bottom: 1px solid var(--border-color);
    padding: 0 10px;
    height: 30px;
    align-items: center;
    flex-shrink: 0;
}

.pmo-task-list-body {
    overflow-y: auto;
    flex-grow: 1;
}

.pmo-task-row {
    display: grid;
    grid-template-columns: minmax(250px, 1fr) 100px 100px 150px 100px 100px;
    height: var(--row-height);
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding: 0 10px;
    cursor: pointer;
    transition: background-color 0.1s;
}

.pmo-task-row:hover {
    background-color: var(--background-tertiary);
}

.pmo-task-row.selected {
    background-color: var(--accent-primary);
}

.pmo-task-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.pmo-task-cell input {
    background: transparent;
    border: none;
    color: var(--text-primary);
    width: 100%;
    padding: 4px;
    border-radius: 3px;
}

.pmo-task-cell input:focus {
    background-color: var(--background-primary);
    outline: 1px solid var(--accent-primary);
}

.pmo-task-expander {
    width: 20px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s;
}

.pmo-task-expander.collapsed {
    transform: rotate(-90deg);
}

.pmo-splitter {
    width: var(--splitter-width);
    background-color: var(--border-color);
    cursor: col-resize;
    flex-shrink: 0;
    transition: background-color 0.2s;
}

.pmo-splitter:hover {
    background-color: var(--accent-primary-hover);
}

.pmo-timeline {
    flex-grow: 1;
    overflow: auto;
    position: relative;
    background-color: var(--background-primary);
}

.pmo-timeline-header {
    position: sticky;
    top: 0;
    z-index: 3;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
}

.pmo-timeline-months, .pmo-timeline-days {
    display: flex;
    white-space: nowrap;
}

.pmo-timeline-month, .pmo-timeline-day {
    text-align: center;
    font-size: 0.8rem;
    color: var(--text-secondary);
    border-right: 1px solid var(--border-color);
    box-sizing: border-box;
    padding: 4px 0;
}

.pmo-timeline-month {
    font-weight: 600;
}

.pmo-timeline-content {
    position: relative;
}

.pmo-timeline-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.pmo-grid-line, .pmo-row-line {
    position: absolute;
    background-color: var(--border-color);
}
.pmo-grid-line { top: 0; width: 1px; height: 100%; }
.pmo-row-line { left: 0; height: 1px; width: 100%; }

.pmo-today-marker {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background-color: var(--color-critical);
    z-index: 2;
}

.pmo-gantt-bar-container {
    position: absolute;
    height: var(--row-height);
    display: flex;
    align-items: center;
    padding: 4px 0;
    box-sizing: border-box;
    z-index: 1;
}

.pmo-gantt-bar {
    position: relative;
    height: 100%;
    border-radius: 5px;
    color: white;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    cursor: move;
    transition: filter 0.2s;
    display: flex;
    align-items: center;
    padding: 0 8px;
}
.pmo-gantt-bar:hover { filter: brightness(1.2); }
.pmo-gantt-bar.critical { border: 2px solid var(--color-critical); }
.pmo-gantt-bar.parent { background-color: var(--color-parent); height: 12px; }
.pmo-gantt-bar.milestone {
    width: 24px;
    height: 24px;
    background-color: var(--color-milestone);
    transform: rotate(45deg);
    border-radius: 3px;
    cursor: move;
}

.pmo-gantt-bar-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(0,0,0,0.3);
    border-radius: 5px;
    pointer-events: none;
}

.pmo-gantt-bar-handle {
    position: absolute;
    top: 0;
    width: 8px;
    height: 100%;
    z-index: 2;
    cursor: ew-resize;
}
.pmo-gantt-bar-handle.left { left: 0; }
.pmo-gantt-bar-handle.right { right: 0; }

.pmo-dependency-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}

.pmo-dependency-path {
    stroke: var(--text-secondary);
    stroke-width: 1.5;
    fill: none;
    marker-end: url(#arrowhead);
}
.pmo-dependency-path.critical {
    stroke: var(--color-critical);
    stroke-width: 2.5;
}

/* Status Colors */
.status-todo { background-color: var(--color-task-todo); }
.status-inprogress { background-color: var(--color-task-inprogress); }
.status-done { background-color: var(--color-task-done); }
`;

// Funções Utilitárias de Data
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const daysBetween = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    date1.setUTCHours(0, 0, 0, 0);
    date2.setUTCHours(0, 0, 0, 0);
    return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr) => new Date(dateStr).toISOString().split('T')[0];

// Dados Iniciais de Exemplo
const initialTasks = [
    { id: 'proj1', name: 'Lançamento do Produto X', type: 'parent', parentId: null, start: '2025-07-01', end: '2025-09-20', progress: 0 },
    { id: 't1', name: 'Fase de Planeamento', type: 'parent', parentId: 'proj1', start: '2025-07-01', end: '2025-07-10', progress: 0 },
    { id: 't1.1', name: 'Definir escopo do projeto', type: 'task', parentId: 't1', start: '2025-07-01', end: '2025-07-05', progress: 100, status: 'done', assignee: 'Ana' },
    { id: 't1.2', name: 'Criar WBS', type: 'task', parentId: 't1', start: '2025-07-06', end: '2025-07-10', progress: 70, status: 'inprogress', assignee: 'Bruno', dependencies: 't1.1' },
    { id: 't2', name: 'Fase de Design', type: 'parent', parentId: 'proj1', start: '2025-07-11', end: '2025-08-05', progress: 0 },
    { id: 't2.1', name: 'Design de UI/UX', type: 'task', parentId: 't2', start: '2025-07-11', end: '2025-07-25', progress: 20, status: 'inprogress', assignee: 'Carla', dependencies: 't1.2' },
    { id: 't2.2', name: 'Prototipagem', type: 'task', parentId: 't2', start: '2025-07-26', end: '2025-08-05', progress: 0, status: 'todo', assignee: 'Carla', dependencies: 't2.1' },
    { id: 'm1', name: 'Aprovação do Design', type: 'milestone', parentId: 'proj1', start: '2025-08-06', end: '2025-08-06', progress: 0, dependencies: 't2.2' },
    { id: 't3', name: 'Fase de Desenvolvimento', type: 'parent', parentId: 'proj1', start: '2025-08-07', end: '2025-09-10', progress: 0 },
    { id: 't3.1', name: 'Desenvolvimento Frontend', type: 'task', parentId: 't3', start: '2025-08-07', end: '2025-08-27', progress: 0, status: 'todo', assignee: 'David', dependencies: 'm1' },
    { id: 't3.2', name: 'Desenvolvimento Backend', type: 'task', parentId: 't3', start: '2025-08-07', end: '2025-08-29', progress: 0, status: 'todo', assignee: 'Eva', dependencies: 'm1' },
    { id: 't3.3', name: 'Integração e Testes', type: 'task', parentId: 't3', start: '2025-08-30', end: '2025-09-10', progress: 0, status: 'todo', assignee: 'David', dependencies: 't3.1,t3.2' },
    { id: 'm2', name: 'Lançamento Beta', type: 'milestone', parentId: 'proj1', start: '2025-09-20', end: '2025-09-20', progress: 0, dependencies: 't3.3' },
];

// Reducer para gerenciar o estado das tarefas
function tasksReducer(state, action) {
    switch (action.type) {
        case 'LOAD_TASKS':
            return action.payload;
        case 'UPDATE_TASK':
            return state.map(task =>
                task.id === action.payload.id ? { ...task, ...action.payload.changes } : task
            );
        case 'ADD_TASK':
            return [...state, action.payload];
        case 'DELETE_TASK':
            // Também remove a tarefa de outras dependências
            const newState = state.filter(t => t.id !== action.payload);
            return newState.map(t => {
                if (t.dependencies) {
                    const deps = t.dependencies.split(',').map(d => d.trim()).filter(d => d !== action.payload);
                    return { ...t, dependencies: deps.join(',') };
                }
                return t;
            });
        default:
            throw new Error();
    }
}

// Hook personalizado para lógica de negócio do Gantt
function useGanttLogic(tasks, dispatch) {
    const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);

    const updateParentTasks = useCallback(() => {
        const parents = tasks.filter(t => t.type === 'parent');
        parents.forEach(parent => {
            const children = tasks.filter(c => c.parentId === parent.id);
            if (children.length > 0) {
                const startDates = children.map(c => new Date(c.start));
                const endDates = children.map(c => new Date(c.end));
                const newStart = new Date(Math.min(...startDates));
                const newEnd = new Date(Math.max(...endDates));
                const totalProgress = children.reduce((sum, c) => sum + (c.progress || 0), 0);
                const newProgress = Math.round(totalProgress / children.length);

                if (formatDate(newStart) !== parent.start || formatDate(newEnd) !== parent.end || newProgress !== parent.progress) {
                    dispatch({
                        type: 'UPDATE_TASK',
                        payload: {
                            id: parent.id,
                            changes: {
                                start: formatDate(newStart),
                                end: formatDate(newEnd),
                                progress: newProgress
                            }
                        }
                    });
                }
            }
        });
    }, [tasks, dispatch]);

    const criticalPath = useMemo(() => {
        const nonParentTasks = tasks.filter(t => t.type !== 'parent');
        if (nonParentTasks.length === 0) return new Set();

        const localTaskMap = new Map(nonParentTasks.map(t => [t.id, { ...t, duration: daysBetween(t.start, t.end) + 1 }]));
        const adj = new Map(nonParentTasks.map(t => [t.id, []]));
        const revAdj = new Map(nonParentTasks.map(t => [t.id, []]));

        localTaskMap.forEach(task => {
            task.earlyStart = 0;
            task.earlyFinish = 0;
            if (task.dependencies) {
                task.dependencies.split(',').map(d => d.trim()).forEach(depId => {
                    if (localTaskMap.has(depId)) {
                        adj.get(depId).push(task.id);
                        revAdj.get(task.id).push(depId);
                    }
                });
            }
        });

        // Forward pass
        const sortedTasks = [];
        const inDegree = new Map();
        localTaskMap.forEach(t => inDegree.set(t.id, (revAdj.get(t.id) || []).length));
        const queue = nonParentTasks.filter(t => inDegree.get(t.id) === 0);
        
        while(queue.length > 0) {
            const u = queue.shift();
            sortedTasks.push(u);
            (adj.get(u.id) || []).forEach(vId => {
                inDegree.set(vId, inDegree.get(vId) - 1);
                if (inDegree.get(vId) === 0) {
                    queue.push(localTaskMap.get(vId));
                }
            })
        }

        sortedTasks.forEach(u => {
            u.earlyFinish = u.earlyStart + u.duration;
            (adj.get(u.id) || []).forEach(vId => {
                const v = localTaskMap.get(vId);
                v.earlyStart = Math.max(v.earlyStart, u.earlyFinish);
            });
        });

        const projectFinishTime = Math.max(0, ...Array.from(localTaskMap.values()).map(t => t.earlyFinish));
        
        // Backward pass
        localTaskMap.forEach(t => {
            t.lateFinish = projectFinishTime;
            t.lateStart = Infinity;
        });

        for (let i = sortedTasks.length - 1; i >= 0; i--) {
            const u = sortedTasks[i];
            u.lateStart = u.lateFinish - u.duration;
            (revAdj.get(u.id) || []).forEach(pId => {
                const p = localTaskMap.get(pId);
                p.lateFinish = Math.min(p.lateFinish, u.lateStart);
            });
        }
        
        const criticalPathIds = new Set();
        localTaskMap.forEach(t => {
            if (Math.abs(t.lateStart - t.earlyStart) < 0.01) {
                criticalPathIds.add(t.id);
            }
        });
        return criticalPathIds;
    }, [tasks]);

    useEffect(() => {
        updateParentTasks();
    }, [tasks, updateParentTasks]);

    return { taskMap, criticalPath };
}


// Componentes
const Toolbar = ({ onAddTask, onToggleCriticalPath, showCriticalPath }) => (
    <div className="pmo-toolbar">
        <button className="pmo-toolbar-button" onClick={() => onAddTask()}>+ Adicionar Tarefa</button>
        <button className={`pmo-toolbar-button ${showCriticalPath ? 'toggled' : ''}`} onClick={onToggleCriticalPath}>
            Caminho Crítico
        </button>
    </div>
);

const TaskList = React.forwardRef(({ tasks, dispatch, selectedTaskId, setSelectedTaskId, collapsedTasks, setCollapsedTasks, timelineRef }, ref) => {
    const handleTaskChange = (id, field, value) => {
        dispatch({ type: 'UPDATE_TASK', payload: { id, changes: { [field]: value } } });
    };

    const handleToggleCollapse = (taskId) => {
        setCollapsedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const renderTask = (task, level) => {
        const isParent = task.type === 'parent';
        const isCollapsed = collapsedTasks[task.id];
        const children = tasks.filter(t => t.parentId === task.id);

        return (
            <React.Fragment key={task.id}>
                <div
                    className={`pmo-task-row ${selectedTaskId === task.id ? 'selected' : ''}`}
                    style={{ height: `${window.PMO_CONFIG.rowHeight}px` }}
                    onClick={() => setSelectedTaskId(task.id)}
                >
                    <div className="pmo-task-cell" style={{ paddingLeft: `${level * 25 + 5}px` }}>
                        {isParent && (
                            <span
                                className={`pmo-task-expander ${isCollapsed ? 'collapsed' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleToggleCollapse(task.id); }}
                            >
                                &#9662;
                            </span>
                        )}
                        <input
                            type="text"
                            value={task.name}
                            onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                        />
                    </div>
                    <div className="pmo-task-cell">{daysBetween(task.start, task.end) + 1}d</div>
                    <div className="pmo-task-cell">{task.progress}%</div>
                    <div className="pmo-task-cell">
                        <input
                            type="text"
                            value={task.assignee || ''}
                            onChange={(e) => handleTaskChange(task.id, 'assignee', e.target.value)}
                        />
                    </div>
                    <div className="pmo-task-cell">
                        <input
                            type="date"
                            value={formatDate(task.start)}
                            onChange={(e) => handleTaskChange(task.id, 'start', e.target.value)}
                        />
                    </div>
                    <div className="pmo-task-cell">
                        <input
                            type="date"
                            value={formatDate(task.end)}
                            onChange={(e) => handleTaskChange(task.id, 'end', e.target.value)}
                        />
                    </div>
                </div>
                {!isCollapsed && children.map(child => renderTask(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="pmo-task-list-body" ref={ref} onScroll={(e) => {
            if (timelineRef.current) {
                timelineRef.current.scrollTop = e.target.scrollTop;
            }
        }}>
            {tasks.filter(t => !t.parentId).map(task => renderTask(task, 0))}
        </div>
    );
});

const Timeline = React.forwardRef(({ tasks, taskMap, criticalPath, collapsedTasks, timelineRange, unitWidth, flatTaskOrder }, ref) => {
    const { startDate, endDate, totalWidth, todayOffset } = timelineRange;

    const renderHeader = () => {
        const months = [];
        const days = [];
        let currentDate = new Date(startDate);
        
        while(currentDate <= endDate) {
            const month = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            if (months.length === 0 || months[months.length - 1].name !== month) {
                if (months.length > 0) months[months.length - 1].width = months[months.length - 1].dayCount * unitWidth;
                months.push({ name: month, dayCount: 0 });
            }
            months[months.length - 1].dayCount++;
            days.push({ day: currentDate.getDate() });
            currentDate = addDays(currentDate, 1);
        }
        if (months.length > 0) months[months.length - 1].width = months[months.length - 1].dayCount * unitWidth;

        return (
            <div className="pmo-timeline-header">
                <div className="pmo-timeline-months">
                    {months.map((m, i) => <div key={i} className="pmo-timeline-month" style={{ width: `${m.width}px` }}>{m.name}</div>)}
                </div>
                <div className="pmo-timeline-days">
                    {days.map((d, i) => <div key={i} className="pmo-timeline-day" style={{ width: `${unitWidth}px` }}>{d.day}</div>)}
                </div>
            </div>
        );
    };

    const renderGrid = () => (
        <div className="pmo-timeline-grid" style={{ height: `${flatTaskOrder.length * window.PMO_CONFIG.rowHeight}px` }}>
            {Array.from({ length: daysBetween(startDate, endDate) + 1 }).map((_, i) => (
                <div key={i} className="pmo-grid-line" style={{ left: `${i * unitWidth}px` }}></div>
            ))}
            {flatTaskOrder.map((_, i) => (
                <div key={i} className="pmo-row-line" style={{ top: `${(i + 1) * window.PMO_CONFIG.rowHeight}px` }}></div>
            ))}
            {todayOffset !== null && <div className="pmo-today-marker" style={{ left: `${todayOffset}px` }}></div>}
        </div>
    );
    
    const renderBars = () => {
        return flatTaskOrder.map((taskId, index) => {
            const task = taskMap.get(taskId);
            if (!task) return null;

            const top = index * window.PMO_CONFIG.rowHeight;
            const left = daysBetween(startDate, task.start) * unitWidth;
            
            if(task.type === 'milestone') {
                 return (
                    <div key={task.id} className="pmo-gantt-bar-container" style={{ top: `${top}px`, left: `${left}px` }}>
                        <div className={`pmo-gantt-bar milestone ${criticalPath.has(task.id) ? 'critical' : ''}`} title={task.name}></div>
                    </div>
                );
            }
            
            const width = (daysBetween(task.start, task.end) + 1) * unitWidth;
            const barClass = task.type === 'parent' ? 'parent' : `status-${task.status}`;

            return (
                <div key={task.id} className="pmo-gantt-bar-container" style={{ top: `${top}px`, left: `${left}px`, width: `${width}px` }}>
                    <div className={`pmo-gantt-bar ${barClass} ${criticalPath.has(task.id) ? 'critical' : ''}`}>
                         {task.type !== 'parent' && <div className="pmo-gantt-bar-handle left"></div>}
                         <div className="pmo-gantt-bar-progress" style={{ width: `${task.progress}%` }}></div>
                         <span style={{padding: '0 5px', zIndex: 1}}>{task.name}</span>
                         {task.type !== 'parent' && <div className="pmo-gantt-bar-handle right"></div>}
                    </div>
                </div>
            );
        });
    };
    
    const renderDependencies = () => {
        const paths = [];
        flatTaskOrder.forEach((taskId, toIndex) => {
            const task = taskMap.get(taskId);
            if (task && task.dependencies) {
                task.dependencies.split(',').map(d => d.trim()).forEach(depId => {
                    const predecessor = taskMap.get(depId);
                    const fromIndex = flatTaskOrder.indexOf(depId);
                    if(predecessor && fromIndex !== -1) {
                        const fromX = (daysBetween(startDate, predecessor.end) + 1) * unitWidth;
                        const fromY = fromIndex * window.PMO_CONFIG.rowHeight + window.PMO_CONFIG.rowHeight / 2;
                        const toX = daysBetween(startDate, task.start) * unitWidth;
                        const toY = toIndex * window.PMO_CONFIG.rowHeight + window.PMO_CONFIG.rowHeight / 2;
                        
                        const d = `M ${fromX} ${fromY} L ${fromX + 15} ${fromY} L ${fromX + 15} ${toY} L ${toX} ${toY}`;
                        const isCritical = criticalPath.has(task.id) && criticalPath.has(predecessor.id);
                        paths.push(<path key={`${depId}-${taskId}`} d={d} className={`pmo-dependency-path ${isCritical ? 'critical' : ''}`} />);
                    }
                });
            }
        });
        
        return (
             <svg className="pmo-dependency-layer" width={totalWidth} height={flatTaskOrder.length * window.PMO_CONFIG.rowHeight}>
                <defs>
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)"/>
                    </marker>
                </defs>
                {paths}
            </svg>
        );
    };

    return (
        <div className="pmo-timeline" ref={ref}>
            {renderHeader()}
            <div className="pmo-timeline-content" style={{ width: `${totalWidth}px`, height: `${flatTaskOrder.length * window.PMO_CONFIG.rowHeight}px` }}>
                {renderGrid()}
                {renderBars()}
                {renderDependencies()}
            </div>
        </div>
    );
});

// Componente Principal da Aplicação
function App() {
    const [tasks, dispatch] = useReducer(tasksReducer, []);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [collapsedTasks, setCollapsedTasks] = useState({});
    const [sidebarWidth, setSidebarWidth] = useState(600);
    const [showCriticalPath, setShowCriticalPath] = useState(true);

    const timelineRef = useRef(null);
    const taskListRef = useRef(null);

    // Configurações globais
    window.PMO_CONFIG = {
        rowHeight: 38,
        unitWidth: 40
    };

    useEffect(() => {
        dispatch({ type: 'LOAD_TASKS', payload: initialTasks });
    }, []);

    const { taskMap, criticalPath } = useGanttLogic(tasks, dispatch);

    const handleAddTask = () => {
        const newId = `t${tasks.length + 1}`;
        const newTask = {
            id: newId,
            name: 'Nova Tarefa',
            type: 'task',
            parentId: selectedTaskId,
            start: formatDate(new Date()),
            end: formatDate(addDays(new Date(), 5)),
            progress: 0,
            status: 'todo'
        };
        dispatch({ type: 'ADD_TASK', payload: newTask });
        setSelectedTaskId(newId);
    };

    const flatTaskOrder = useMemo(() => {
        const order = [];
        const processNode = (task) => {
            order.push(task.id);
            if (task.type === 'parent' && !collapsedTasks[task.id]) {
                tasks.filter(t => t.parentId === task.id).forEach(processNode);
            }
        };
        tasks.filter(t => !t.parentId).forEach(processNode);
        return order;
    }, [tasks, collapsedTasks]);
    
    const timelineRange = useMemo(() => {
        if (tasks.length === 0) return { startDate: new Date(), endDate: addDays(new Date(), 30), totalWidth: 0, todayOffset: null };
        const startDates = tasks.map(t => new Date(t.start));
        const endDates = tasks.map(t => new Date(t.end));
        const startDate = addDays(new Date(Math.min(...startDates)), -7);
        const endDate = addDays(new Date(Math.max(...endDates)), 14);
        const totalWidth = (daysBetween(startDate, endDate) + 1) * window.PMO_CONFIG.unitWidth;
        const today = new Date();
        const todayOffset = (today >= startDate && today <= endDate) ? daysBetween(startDate, today) * window.PMO_CONFIG.unitWidth : null;
        return { startDate, endDate, totalWidth, todayOffset };
    }, [tasks]);

    const handleSplitterDrag = useCallback((e) => {
        const newWidth = e.clientX;
        if (newWidth > 300 && newWidth < window.innerWidth - 300) {
            setSidebarWidth(newWidth);
        }
    }, []);

    const stopDrag = useCallback(() => {
        document.removeEventListener('mousemove', handleSplitterDrag);
        document.removeEventListener('mouseup', stopDrag);
    }, [handleSplitterDrag]);

    const startDrag = useCallback((e) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleSplitterDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [handleSplitterDrag, stopDrag]);

    return (
        <>
            <style>{styles}</style>
            <div className="pmo-app-container">
                <header className="pmo-main-header">
                    <h1>PMOS 2.0 - Gestor de Projetos</h1>
                </header>
                <Toolbar onAddTask={handleAddTask} onToggleCriticalPath={() => setShowCriticalPath(p => !p)} showCriticalPath={showCriticalPath} />
                <div className="pmo-gantt-container">
                    <div className="pmo-task-list" style={{ width: `${sidebarWidth}px`, minWidth: '300px' }}>
                        <div className="pmo-task-list-header">
                            <span>Tarefa</span>
                            <span>Duração</span>
                            <span>Progresso</span>
                            <span>Responsável</span>
                            <span>Início</span>
                            <span>Fim</span>
                        </div>
                        <TaskList
                            tasks={tasks}
                            dispatch={dispatch}
                            selectedTaskId={selectedTaskId}
                            setSelectedTaskId={setSelectedTaskId}
                            collapsedTasks={collapsedTasks}
                            setCollapsedTasks={setCollapsedTasks}
                            timelineRef={timelineRef}
                            ref={taskListRef}
                        />
                    </div>
                    <div className="pmo-splitter" onMouseDown={startDrag}></div>
                    <Timeline
                        tasks={tasks}
                        taskMap={taskMap}
                        criticalPath={showCriticalPath ? criticalPath : new Set()}
                        collapsedTasks={collapsedTasks}
                        timelineRange={timelineRange}
                        unitWidth={window.PMO_CONFIG.unitWidth}
                        flatTaskOrder={flatTaskOrder}
                        ref={timelineRef}
                    />
                </div>
            </div>
        </>
    );
}

export default App;
