import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openGanttChart() {
    const uniqueSuffix = generateId('gantt-react');
    const winId = window.windowManager.createWindow('Roadmap do Projeto (React)', '', {
        width: '90vw',
        height: '85vh',
        appType: 'gantt-chart-react',
        minWidth: 800,
        minHeight: 600
    });

    const winData = window.windowManager.windows.get(winId);
    if (!winData) return winId;
    const winEl = winData.element;

    // Criar um ponto de montagem para a aplicação React
    winEl.querySelector('.window-content').innerHTML = `
        <div id="react-root-${uniqueSuffix}" style="height: 100%; width: 100%; overflow: hidden;">
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; font-family: sans-serif; color: #aaa;">
                A carregar aplicação...
            </div>
        </div>
    `;
    const rootEl = winEl.querySelector(`#react-root-${uniqueSuffix}`);

    // --- Início do Código da Aplicação React ---

    // Função para carregar scripts dinamicamente
    const loadScript = (src, callback) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            callback();
            return;
        }
        let script = document.createElement('script');
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => callback();
        script.onerror = () => console.error(`Falha ao carregar o script: ${src}`);
        document.head.appendChild(script);
    };

    const mountReactApp = () => {
        const { useState, useEffect, useReducer, useCallback, useMemo, useRef } = window.React;

        // Estilos CSS
        const styles = `
        :root {
            --background-primary: #1e1e1e; --background-secondary: #252526; --background-tertiary: #333333;
            --text-primary: #d4d4d4; --text-secondary: #a0a0a0; --border-color: #444444;
            --accent-primary: #0e639c; --accent-primary-hover: #1177bb; --accent-secondary: #5d6d7e;
            --color-critical: #e74c3c; --color-milestone: #a569bd; --color-parent: #5d6d7e;
            --color-task-todo: #3a86ff; --color-task-inprogress: #ffbe0b; --color-task-done: #83d483;
            --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            --header-height: 45px; --toolbar-height: 40px; --row-height: 36px; --splitter-width: 5px;
        }
        .pmo-app-container { display: flex; flex-direction: column; height: 100%; width: 100%; background-color: var(--background-secondary); color: var(--text-primary); font-family: var(--font-family); }
        .pmo-main-header { display: flex; align-items: center; padding: 0 20px; height: var(--header-height); background-color: var(--background-primary); border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
        .pmo-main-header h1 { font-size: 1.1rem; margin: 0; }
        .pmo-toolbar { display: flex; align-items: center; padding: 0 15px; height: var(--toolbar-height); background-color: var(--background-secondary); border-bottom: 1px solid var(--border-color); gap: 10px; flex-shrink: 0; }
        .pmo-toolbar-button { background-color: var(--background-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 5px 12px; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; }
        .pmo-toolbar-button:hover { background-color: var(--accent-primary-hover); border-color: var(--accent-primary); }
        .pmo-toolbar-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .pmo-toolbar-button.toggled { background-color: var(--accent-primary); border-color: var(--accent-primary-hover); }
        .pmo-gantt-container { display: flex; flex-grow: 1; overflow: hidden; }
        .pmo-task-list { background-color: var(--background-secondary); overflow: hidden; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); }
        .pmo-task-list-header { display: grid; grid-template-columns: minmax(250px, 1fr) 100px 100px 150px 100px 100px; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); background-color: var(--background-tertiary); border-bottom: 1px solid var(--border-color); padding: 0 10px; height: 30px; align-items: center; flex-shrink: 0; }
        .pmo-task-list-body { overflow-y: auto; flex-grow: 1; }
        .pmo-task-row { display: grid; grid-template-columns: minmax(250px, 1fr) 100px 100px 150px 100px 100px; height: var(--row-height); align-items: center; border-bottom: 1px solid var(--border-color); padding: 0 10px; cursor: pointer; transition: background-color 0.1s; position: relative; }
        .pmo-task-row:hover { background-color: var(--background-tertiary); }
        .pmo-task-row.selected { background-color: var(--accent-primary); }
        .pmo-task-cell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
        .pmo-task-cell input { background: transparent; border: none; color: var(--text-primary); width: 100%; padding: 4px; border-radius: 3px; }
        .pmo-task-cell input:focus { background-color: var(--background-primary); outline: 1px solid var(--accent-primary); }
        .pmo-task-expander { width: 20px; text-align: center; cursor: pointer; transition: transform 0.2s; }
        .pmo-task-expander.collapsed { transform: rotate(-90deg); }
        .pmo-splitter { width: var(--splitter-width); background-color: var(--border-color); cursor: col-resize; flex-shrink: 0; transition: background-color 0.2s; }
        .pmo-splitter:hover { background-color: var(--accent-primary-hover); }
        .pmo-timeline { flex-grow: 1; overflow: auto; position: relative; background-color: var(--background-primary); }
        .pmo-timeline-header { position: sticky; top: 0; z-index: 3; background-color: var(--background-secondary); border-bottom: 1px solid var(--border-color); }
        .pmo-timeline-months, .pmo-timeline-days { display: flex; white-space: nowrap; }
        .pmo-timeline-month, .pmo-timeline-day { text-align: center; font-size: 0.75rem; color: var(--text-secondary); border-right: 1px solid var(--border-color); box-sizing: border-box; padding: 4px 0; }
        .pmo-timeline-month { font-weight: 600; }
        .pmo-timeline-content { position: relative; }
        .pmo-timeline-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
        .pmo-grid-line, .pmo-row-line { position: absolute; background-color: var(--border-color); }
        .pmo-grid-line { top: 0; width: 1px; height: 100%; }
        .pmo-row-line { left: 0; height: 1px; width: 100%; }
        .pmo-today-marker { position: absolute; top: 0; width: 2px; height: 100%; background-color: var(--color-critical); z-index: 2; }
        .pmo-gantt-bar-container { position: absolute; height: var(--row-height); display: flex; align-items: center; padding: 5px 0; box-sizing: border-box; z-index: 1; }
        .pmo-gantt-bar { position: relative; height: 100%; border-radius: 5px; color: white; font-size: 0.8rem; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.3); cursor: move; transition: filter 0.2s, background-color 0.2s; display: flex; align-items: center; padding: 0 8px; }
        .pmo-gantt-bar:hover { filter: brightness(1.2); }
        .pmo-gantt-bar.critical { border: 2px solid var(--color-critical); }
        .pmo-gantt-bar.parent { background-color: var(--color-parent); height: 10px; }
        .pmo-gantt-bar.milestone { width: 20px; height: 20px; background-color: var(--color-milestone); transform: rotate(45deg); border-radius: 3px; cursor: move; }
        .pmo-gantt-bar-progress { position: absolute; top: 0; left: 0; height: 100%; background: rgba(0,0,0,0.3); border-radius: 5px; pointer-events: none; }
        .pmo-gantt-bar-handle { position: absolute; top: 0; width: 8px; height: 100%; z-index: 2; cursor: ew-resize; }
        .pmo-gantt-bar-handle.left { left: 0; } .pmo-gantt-bar-handle.right { right: 0; }
        .pmo-dependency-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .pmo-dependency-path { stroke: var(--text-secondary); stroke-width: 1.5; fill: none; marker-end: url(#arrowhead-${uniqueSuffix}); }
        .pmo-dependency-path.critical { stroke: var(--color-critical); stroke-width: 2.5; }
        .pmo-dep-circle { position: absolute; top: 50%; right: -15px; transform: translateY(-50%); width: 12px; height: 12px; background: #fff; border: 1px solid #888; border-radius: 50%; cursor: crosshair; opacity: 0; transition: opacity 0.2s; }
        .pmo-task-row:hover .pmo-dep-circle { opacity: 1; }
        .status-todo { background-color: var(--color-task-todo); }
        .status-inprogress { background-color: var(--color-task-inprogress); }
        .status-done { background-color: var(--color-task-done); }
        `;

        // --- Funções Utilitárias ---
        const addDays = (date, days) => { const r = new Date(date); r.setDate(r.getDate() + days); return r; };
        const daysBetween = (d1, d2) => { const a = new Date(d1); const b = new Date(d2); a.setUTCHours(0,0,0,0); b.setUTCHours(0,0,0,0); return Math.round((b - a) / 864e5); };
        const formatDate = (dateStr) => new Date(dateStr).toISOString().split('T')[0];

        // --- Reducer para o Estado das Tarefas ---
        function tasksReducer(state, action) {
            switch (action.type) {
                case 'SET_TASKS': return action.payload;
                case 'UPDATE_TASK': return state.map(t => t.id === action.payload.id ? { ...t, ...action.payload.changes } : t);
                case 'ADD_TASK': return [...state, action.payload];
                case 'DELETE_TASK':
                    const newState = state.filter(t => t.id !== action.payload);
                    return newState.map(t => {
                        if (t.dependencies) {
                            const deps = t.dependencies.split(',').map(d => d.trim()).filter(d => d !== action.payload);
                            return { ...t, dependencies: deps.join(',') };
                        }
                        return t;
                    });
                default: throw new Error(`Ação desconhecida: ${action.type}`);
            }
        }

        // --- Hook de Lógica de Negócio ---
        function useGanttLogic(tasks, dispatch) {
            const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);

            // Atualiza recursivamente as tarefas-mãe
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
                            dispatch({ type: 'UPDATE_TASK', payload: { id: parent.id, changes: { start: formatDate(newStart), end: formatDate(newEnd), progress: newProgress } } });
                        }
                    }
                });
            }, [tasks, dispatch]);

            // Calcula o caminho crítico
            const criticalPath = useMemo(() => {
                const nonParentTasks = tasks.filter(t => t.type !== 'parent');
                if (nonParentTasks.length === 0) return new Set();
                const localTaskMap = new Map(nonParentTasks.map(t => [t.id, { ...t, duration: daysBetween(t.start, t.end) + 1 }]));
                const adj = new Map(nonParentTasks.map(t => [t.id, []]));
                const revAdj = new Map(nonParentTasks.map(t => [t.id, []]));
                localTaskMap.forEach(task => {
                    task.earlyStart = 0; task.earlyFinish = 0;
                    if (task.dependencies) {
                        task.dependencies.split(',').map(d => d.trim()).forEach(depId => {
                            if (localTaskMap.has(depId)) { adj.get(depId).push(task.id); revAdj.get(task.id).push(depId); }
                        });
                    }
                });
                const sortedTasks = []; const inDegree = new Map();
                localTaskMap.forEach(t => inDegree.set(t.id, (revAdj.get(t.id) || []).length));
                const queue = nonParentTasks.filter(t => inDegree.get(t.id) === 0);
                while(queue.length > 0) {
                    const u = queue.shift(); sortedTasks.push(u);
                    (adj.get(u.id) || []).forEach(vId => {
                        inDegree.set(vId, inDegree.get(vId) - 1);
                        if (inDegree.get(vId) === 0) queue.push(localTaskMap.get(vId));
                    });
                }
                sortedTasks.forEach(u => {
                    u.earlyFinish = u.earlyStart + u.duration;
                    (adj.get(u.id) || []).forEach(vId => { const v = localTaskMap.get(vId); v.earlyStart = Math.max(v.earlyStart, u.earlyFinish); });
                });
                const projectFinishTime = Math.max(0, ...Array.from(localTaskMap.values()).map(t => t.earlyFinish));
                localTaskMap.forEach(t => { t.lateFinish = projectFinishTime; t.lateStart = Infinity; });
                for (let i = sortedTasks.length - 1; i >= 0; i--) {
                    const u = sortedTasks[i]; u.lateStart = u.lateFinish - u.duration;
                    (revAdj.get(u.id) || []).forEach(pId => { const p = localTaskMap.get(pId); p.lateFinish = Math.min(p.lateFinish, u.lateStart); });
                }
                const criticalPathIds = new Set();
                localTaskMap.forEach(t => { if (Math.abs(t.lateStart - t.earlyStart) < 0.01) criticalPathIds.add(t.id); });
                return criticalPathIds;
            }, [tasks]);

            useEffect(() => { updateParentTasks(); }, [tasks, updateParentTasks]);

            return { taskMap, criticalPath };
        }
        
        // --- Componentes React (usando React.createElement) ---
        const Toolbar = ({ onAddTask, onDeleteTask, onToggleCriticalPath, showCriticalPath, selectedTaskId }) => (
            React.createElement('div', { className: 'pmo-toolbar' },
                React.createElement('button', { className: 'pmo-toolbar-button', onClick: () => onAddTask('task') }, '+ Tarefa'),
                React.createElement('button', { className: 'pmo-toolbar-button', onClick: () => onAddTask('milestone') }, '✧ Marco'),
                React.createElement('button', { className: 'pmo-toolbar-button', onClick: onDeleteTask, disabled: !selectedTaskId }, 'Apagar'),
                React.createElement('button', { className: `pmo-toolbar-button ${showCriticalPath ? 'toggled' : ''}`, onClick: onToggleCriticalPath }, 'Caminho Crítico')
            )
        );

        const TaskList = ({ tasks, dispatch, selectedTaskId, setSelectedTaskId, collapsedTasks, setCollapsedTasks, onDepStart }) => {
            const handleTaskChange = (id, field, value) => dispatch({ type: 'UPDATE_TASK', payload: { id, changes: { [field]: value } } });
            const handleToggleCollapse = (taskId) => setCollapsedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));

            const renderTask = (task, level) => {
                const isParent = task.type === 'parent';
                const children = tasks.filter(t => t.parentId === task.id);
                const isCollapsed = collapsedTasks[task.id];
                return React.createElement(React.Fragment, { key: task.id },
                    React.createElement('div', { className: `pmo-task-row ${selectedTaskId === task.id ? 'selected' : ''}`, onClick: () => setSelectedTaskId(task.id) },
                        React.createElement('div', { className: 'pmo-task-cell', style: { paddingLeft: `${level * 25 + 5}px` } },
                            isParent && React.createElement('span', { className: `pmo-task-expander ${isCollapsed ? 'collapsed' : ''}`, onClick: (e) => { e.stopPropagation(); handleToggleCollapse(task.id); } }, '▼'),
                            React.createElement('input', { type: 'text', value: task.name, onChange: (e) => handleTaskChange(task.id, 'name', e.target.value) })
                        ),
                        React.createElement('div', { className: 'pmo-task-cell' }, `${daysBetween(task.start, task.end) + 1}d`),
                        React.createElement('div', { className: 'pmo-task-cell' }, `${task.progress || 0}%`),
                        React.createElement('div', { className: 'pmo-task-cell' }, React.createElement('input', { type: 'text', value: task.assignee || '', onChange: (e) => handleTaskChange(task.id, 'assignee', e.target.value) })),
                        React.createElement('div', { className: 'pmo-task-cell' }, React.createElement('input', { type: 'date', value: formatDate(task.start), onChange: (e) => handleTaskChange(task.id, 'start', e.target.value) })),
                        React.createElement('div', { className: 'pmo-task-cell' }, React.createElement('input', { type: 'date', value: formatDate(task.end), onChange: (e) => handleTaskChange(task.id, 'end', e.target.value) })),
                        React.createElement('div', { className: 'pmo-dep-circle', onMouseDown: (e) => onDepStart(e, task.id) })
                    ),
                    !isCollapsed && children.sort((a,b) => new Date(a.start) - new Date(b.start)).map(child => renderTask(child, level + 1))
                );
            };
            return React.createElement('div', { className: 'pmo-task-list-body' }, tasks.filter(t => !t.parentId).sort((a,b) => new Date(a.start) - new Date(b.start)).map(task => renderTask(task, 0)));
        };

        const Timeline = ({ taskMap, criticalPath, timelineRange, unitWidth, flatTaskOrder, dispatch, onDepEnd }) => {
            const { startDate, endDate, totalWidth, todayOffset } = timelineRange;
            const contentHeight = flatTaskOrder.length * appState.config.rowHeight;
            const timelineRef = useRef(null);

            const handleBarInteraction = (e, task) => {
                e.preventDefault();
                const initialX = e.clientX;
                const initialStart = new Date(task.start);
                const initialEnd = new Date(task.end);
                const handle = e.target.classList.contains('pmo-gantt-bar-handle') ? (e.target.classList.contains('left') ? 'left' : 'right') : null;

                const onMouseMove = (moveE) => {
                    const deltaX = moveE.clientX - initialX;
                    const deltaDays = Math.round(deltaX / unitWidth);
                    let newStart, newEnd;

                    if (handle === 'left') {
                        newStart = addDays(initialStart, deltaDays);
                        if (newStart <= initialEnd) dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, changes: { start: formatDate(newStart) } } });
                    } else if (handle === 'right') {
                        newEnd = addDays(initialEnd, deltaDays);
                        if (newEnd >= new Date(task.start)) dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, changes: { end: formatDate(newEnd) } } });
                    } else { // Mover
                        newStart = addDays(initialStart, deltaDays);
                        newEnd = addDays(initialEnd, deltaDays);
                        dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, changes: { start: formatDate(newStart), end: formatDate(newEnd) } } });
                    }
                };
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

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

                return React.createElement('div', { className: 'pmo-timeline-header' },
                    React.createElement('div', { className: 'pmo-timeline-months' }, months.map((m, i) => React.createElement('div', { key: i, className: 'pmo-timeline-month', style: { width: `${m.width}px` } }, m.name))),
                    React.createElement('div', { className: 'pmo-timeline-days' }, days.map((d, i) => React.createElement('div', { key: i, className: 'pmo-timeline-day', style: { width: `${unitWidth}px` } }, d.day)))
                );
            };

            const renderGrid = () => {
                const lines = [];
                for (let i = 0; i <= daysBetween(startDate, endDate); i++) {
                    lines.push(React.createElement('div', { key: `v-${i}`, className: 'pmo-grid-line', style: { left: `${i * unitWidth}px` } }));
                }
                for (let i = 0; i < flatTaskOrder.length; i++) {
                    lines.push(React.createElement('div', { key: `h-${i}`, className: 'pmo-row-line', style: { top: `${(i + 1) * appState.config.rowHeight}px` } }));
                }
                if (todayOffset !== null) {
                    lines.push(React.createElement('div', { key: 'today', className: 'pmo-today-marker', style: { left: `${todayOffset}px` } }));
                }
                return React.createElement('div', { className: 'pmo-timeline-grid', style: { height: `${contentHeight}px` } }, lines);
            };

            const renderBars = () => flatTaskOrder.map((taskId, index) => {
                const task = taskMap.get(taskId);
                if (!task) return null;
                const top = index * appState.config.rowHeight;
                const left = daysBetween(startDate, task.start) * unitWidth;
                const barProps = {
                    key: task.id,
                    className: 'pmo-gantt-bar-container',
                    style: { top: `${top}px`, left: `${left}px` },
                    onMouseUp: (e) => onDepEnd(e, task.id)
                };
                if (task.type === 'milestone') {
                    return React.createElement('div', barProps, React.createElement('div', { className: `pmo-gantt-bar milestone ${criticalPath.has(task.id) ? 'critical' : ''}`, title: task.name, onMouseDown: (e) => handleBarInteraction(e, task) }));
                }
                const width = (daysBetween(task.start, task.end) + 1) * unitWidth;
                barProps.style.width = `${width}px`;
                const barClass = task.type === 'parent' ? 'parent' : `status-${task.status || 'todo'}`;
                return React.createElement('div', barProps,
                    React.createElement('div', { className: `pmo-gantt-bar ${barClass} ${criticalPath.has(task.id) ? 'critical' : ''}`, onMouseDown: (e) => handleBarInteraction(e, task) },
                        task.type !== 'parent' && React.createElement('div', { className: 'pmo-gantt-bar-handle left' }),
                        React.createElement('div', { className: 'pmo-gantt-bar-progress', style: { width: `${task.progress || 0}%` } }),
                        React.createElement('span', { style: { padding: '0 5px', zIndex: 1, pointerEvents: 'none' } }, task.name),
                        task.type !== 'parent' && React.createElement('div', { className: 'pmo-gantt-bar-handle right' })
                    )
                );
            });
            
            const renderDependencies = () => {
                const paths = [];
                flatTaskOrder.forEach((taskId, toIndex) => {
                    const task = taskMap.get(taskId);
                    if (task && task.dependencies) {
                        task.dependencies.split(',').map(d => d.trim()).forEach(depId => {
                            const predecessor = taskMap.get(depId);
                            const fromIndex = flatTaskOrder.indexOf(depId);
                            if (predecessor && fromIndex !== -1) {
                                const fromX = (daysBetween(startDate, predecessor.end) + 1) * unitWidth;
                                const fromY = fromIndex * appState.config.rowHeight + appState.config.rowHeight / 2;
                                const toX = daysBetween(startDate, task.start) * unitWidth;
                                const toY = toIndex * appState.config.rowHeight + appState.config.rowHeight / 2;
                                const d = `M ${fromX} ${fromY} L ${fromX + 15} ${fromY} L ${fromX + 15} ${toY} L ${toX} ${toY}`;
                                const isCritical = criticalPath.has(task.id) && criticalPath.has(predecessor.id);
                                paths.push(React.createElement('path', { key: `${depId}-${taskId}`, d: d, className: `pmo-dependency-path ${isCritical ? 'critical' : ''}` }));
                            }
                        });
                    }
                });
                return React.createElement('svg', { className: 'pmo-dependency-layer', width: totalWidth, height: contentHeight },
                    React.createElement('defs', null,
                        React.createElement('marker', { id: `arrowhead-${uniqueSuffix}`, viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse" },
                            React.createElement('path', { d: "M 0 0 L 10 5 L 0 10 z", fill: "var(--text-secondary)" })
                        )
                    ),
                    paths
                );
            };

            return React.createElement('div', { className: 'pmo-timeline', ref: timelineRef },
                renderHeader(),
                React.createElement('div', { className: 'pmo-timeline-content', style: { width: `${totalWidth}px`, height: `${contentHeight}px` } },
                    renderGrid(),
                    renderBars(),
                    renderDependencies()
                )
            );
        };

        // --- Componente Principal da Aplicação ---
        function App({ initialData, onStateChange }) {
            const [tasks, dispatch] = useReducer(tasksReducer, initialData);
            const [selectedTaskId, setSelectedTaskId] = useState(null);
            const [collapsedTasks, setCollapsedTasks] = useState({});
            const [sidebarWidth, setSidebarWidth] = useState(600);
            const [showCriticalPath, setShowCriticalPath] = useState(true);
            const [depLine, setDepLine] = useState(null);

            useEffect(() => { onStateChange(tasks); }, [tasks, onStateChange]);
            const { taskMap, criticalPath } = useGanttLogic(tasks, dispatch);

            const handleAddTask = (type) => {
                const today = new Date();
                const newTask = {
                    id: generateId(type), name: type === 'task' ? 'Nova Tarefa' : 'Novo Marco',
                    type: type, parentId: null, start: formatDate(today),
                    end: formatDate(addDays(today, type === 'task' ? 5 : 0)),
                    progress: 0, status: 'todo', dependencies: ''
                };
                dispatch({ type: 'ADD_TASK', payload: newTask });
            };
            const handleDeleteTask = () => { if (selectedTaskId) dispatch({ type: 'DELETE_TASK', payload: selectedTaskId }); };

            const flatTaskOrder = useMemo(() => {
                const order = [];
                const processNode = (task) => {
                    order.push(task.id);
                    if (task.type === 'parent' && !collapsedTasks[task.id]) {
                        tasks.filter(t => t.parentId === task.id).sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(processNode);
                    }
                };
                tasks.filter(t => !t.parentId).sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(processNode);
                return order;
            }, [tasks, collapsedTasks]);

            const timelineRange = useMemo(() => {
                 if (tasks.length === 0) return { startDate: new Date(), endDate: addDays(new Date(), 30), totalWidth: 0, todayOffset: null };
                const startDates = tasks.map(t => new Date(t.start));
                const endDates = tasks.map(t => new Date(t.end));
                const startDate = addDays(new Date(Math.min(...startDates)), -7);
                const endDate = addDays(new Date(Math.max(...endDates)), 14);
                const totalWidth = (daysBetween(startDate, endDate) + 1) * appState.config.unitWidth;
                const today = new Date();
                const todayOffset = (today >= startDate && today <= endDate) ? daysBetween(startDate, today) * appState.config.unitWidth : null;
                return { startDate, endDate, totalWidth, todayOffset };
            }, [tasks]);
            
            const handleDepStart = (e, fromId) => {
                e.preventDefault();
                const startRect = e.target.getBoundingClientRect();
                const onMouseMove = (moveE) => {
                    setDepLine({ x1: startRect.left + 6, y1: startRect.top + 6, x2: moveE.clientX, y2: moveE.clientY, fromId });
                };
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    setDepLine(null);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

            const handleDepEnd = (e, toId) => {
                if (depLine && depLine.fromId !== toId) {
                    const toTask = taskMap.get(toId);
                    const deps = toTask.dependencies ? toTask.dependencies.split(',').filter(d => d) : [];
                    if (!deps.includes(depLine.fromId)) {
                        deps.push(depLine.fromId);
                        dispatch({ type: 'UPDATE_TASK', payload: { id: toTask.id, changes: { dependencies: deps.join(',') } } });
                    }
                }
            };
            
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

            return React.createElement(React.Fragment, null,
                React.createElement('style', null, styles),
                React.createElement('div', { className: 'pmo-app-container' },
                    React.createElement('header', { className: 'pmo-main-header' }, React.createElement('h1', null, 'PMOS 2.0 - Gestor de Projetos (React)')),
                    React.createElement(Toolbar, { onAddTask, onDeleteTask, onToggleCriticalPath: () => setShowCriticalPath(p => !p), showCriticalPath, selectedTaskId }),
                    React.createElement('div', { className: 'pmo-gantt-container' },
                        React.createElement('div', { className: 'pmo-task-list', style: { width: `${sidebarWidth}px`, minWidth: '300px' } },
                            React.createElement('div', { className: 'pmo-task-list-header' }, 
                                React.createElement('span', null, 'Tarefa'),
                                React.createElement('span', null, 'Duração'),
                                React.createElement('span', null, 'Progresso'),
                                React.createElement('span', null, 'Responsável'),
                                React.createElement('span', null, 'Início'),
                                React.createElement('span', null, 'Fim')
                            ),
                            React.createElement(TaskList, { tasks, dispatch, selectedTaskId, setSelectedTaskId, collapsedTasks, setCollapsedTasks, onDepStart: handleDepStart })
                        ),
                        React.createElement('div', { className: 'pmo-splitter', onMouseDown: startDrag }),
                        React.createElement(Timeline, { taskMap, criticalPath: showCriticalPath ? criticalPath : new Set(), timelineRange, unitWidth: appState.config.unitWidth, flatTaskOrder, dispatch, onDepEnd: handleDepEnd })
                    ),
                    depLine && React.createElement('svg', { style: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 } },
                        React.createElement('line', { x1: depLine.x1, y1: depLine.y1, x2: depLine.x2, y2: depLine.y2, stroke: 'var(--accent-primary)', strokeWidth: 2 })
                    )
                )
            );
        }

        // Montar a aplicação React
        window.ReactDOM.render(
            React.createElement(App, {
                initialData: appState.tasks,
                onStateChange: (newState) => {
                    appState.tasks = newState;
                    appState.markDirty();
                }
            }),
            rootEl
        );
    };

    // --- Objeto de Estado da Aplicação PMOS ---
    const appState = {
        winId,
        tasks: [],
        config: { rowHeight: 36, unitWidth: 40 },
        getData: function() { return JSON.stringify(this.tasks, null, 2); },
        loadData: function(dataString, fileMeta) {
            try {
                const data = dataString ? JSON.parse(dataString) : [];
                this.tasks = Array.isArray(data) ? data : [];
                this.fileId = fileMeta.id;
                this.markClean();
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name);
                if (window.ReactDOM) {
                    mountReactApp();
                }
            } catch (e) {
                showNotification("Erro ao ler ficheiro Gantt.", 3000, 'error');
                console.error("Gantt Load Error:", e);
            }
        },
        init: function() {
            // A barra de ferramentas padrão do PMOS não é mais necessária, pois o React a renderiza.
            // setupAppToolbarActions(this); 
            if (window.React && window.ReactDOM) {
                mountReactApp();
            } else {
                loadScript("https://unpkg.com/react@17/umd/react.development.js", () => {
                    loadScript("https://unpkg.com/react-dom@17/umd/react-dom.development.js", mountReactApp);
                });
            }
        },
        cleanup: () => {
            if (window.ReactDOM) {
                window.ReactDOM.unmountComponentAtNode(rootEl);
            }
        }
    };

    initializeFileState(appState, "Novo Roadmap (React)", "roadmap.gantt-react", "gantt-chart-react");
    winData.currentAppInstance = appState;
    appState.init();

    return winId;
}
