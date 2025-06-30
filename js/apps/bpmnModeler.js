import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openBPMNModeler() {
    const uniqueSuffix = generateId('bpmn');
    const winId = window.windowManager.createWindow('Modelador BPMN', '', { width: '950px', height: '700px', appType: 'bpmn-modeler' });
    const content = `
        <div class="app-toolbar bpmn-controls">
             ${getStandardAppToolbarHTML()}
            <button id="addBpmnElementBtn_${uniqueSuffix}" class="app-button" style="margin-left:auto;"><i class="fas fa-plus-square"></i> Elemento</button>
            <button id="addBpmnFlowBtn_${uniqueSuffix}" class="app-button"><i class="fas fa-long-arrow-alt-right"></i> Fluxo</button>
        </div>
        <div class="bpmn-main-content">
            <div class="bpmn-elements-panel" id="bpmnElementsPanel_${uniqueSuffix}">
                <div class="app-section bpmn-section"><h4><i class="fas fa-cubes"></i> Elementos</h4><div id="bpmnElementsList_${uniqueSuffix}"></div></div>
            </div>
            <div class="bpmn-flows-panel" id="bpmnFlowsPanel_${uniqueSuffix}">
                <div class="app-section bpmn-section"><h4><i class="fas fa-route"></i> Fluxos</h4><div id="bpmnFlowsList_${uniqueSuffix}"></div></div>
            </div>
        </div>`;
    const winData = window.windowManager.windows.get(winId); if(!winData) return winId;
    winData.element.querySelector('.window-content').innerHTML = content;

    const bpmnIcons = { task: 'fas fa-tasks', startEvent: 'fas fa-play-circle', endEvent: 'fas fa-stop-circle', exclusiveGateway: 'fas fa-diamond', parallelGateway: 'fas fa-plus-circle', intermediateThrowEvent: 'fas fa-arrow-circle-up' };
    const appState = {
        winId, data: { elements: [], flows: [] }, appDataType: 'bpmn-modeler',
        elementsListDiv: winData.element.querySelector(`#bpmnElementsList_${uniqueSuffix}`), 
        flowsListDiv: winData.element.querySelector(`#bpmnFlowsList_${uniqueSuffix}`),
        getData: function() { return this.data; },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString);
                this.data = data || { elements: [], flows: [] }; 
                this.data.elements = this.data.elements || []; 
                this.data.flows = this.data.flows || []; 
                this.fileId = fileMeta.id; 
                this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
            } catch (e) { 
                showNotification("Erro ao ler arquivo BPMN.", 3000); 
            }
        },
        init: function() {
            setupAppToolbarActions(this);
            winData.element.querySelector(`#addBpmnElementBtn_${uniqueSuffix}`).onclick = () => this.addElement(); 
            winData.element.querySelector(`#addBpmnFlowBtn_${uniqueSuffix}`).onclick = () => this.addFlow(); 
            this.elementsListDiv.addEventListener('input', (e) => this.handleElementInput(e)); 
            this.elementsListDiv.addEventListener('click', (e) => this.handleElementAction(e)); 
            this.flowsListDiv.addEventListener('input', (e) => this.handleFlowInput(e)); 
            this.flowsListDiv.addEventListener('click', (e) => this.handleFlowAction(e)); 
            this.renderAll(); 
        },
        renderAll: function() { this.renderElements(); this.renderFlows(); },
        renderElements: function() { this.elementsListDiv.innerHTML = ''; this.data.elements.forEach((el, index) => { const elDiv = document.createElement('div'); elDiv.className = 'bpmn-element-item'; elDiv.dataset.index = index; const iconClass = bpmnIcons[el.type] || 'fas fa-cube'; elDiv.innerHTML = `<div class="bpmn-element-item-header"><i class="${iconClass}"></i> <strong>${el.name || el.id || 'Novo Elemento'}</strong></div> <div class="form-grid"> <input type="text" class="app-input" value="${el.id}" data-field="id" placeholder="ID (único)"> <select class="app-select" data-field="type"> <option value="task" ${el.type === 'task'?'selected':''}>Tarefa</option> <option value="startEvent" ${el.type === 'startEvent'?'selected':''}>Evento de Início</option> <option value="endEvent" ${el.type === 'endEvent'?'selected':''}>Evento de Fim</option> <option value="exclusiveGateway" ${el.type === 'exclusiveGateway'?'selected':''}>Gateway Exclusivo</option> <option value="parallelGateway" ${el.type === 'parallelGateway'?'selected':''}>Gateway Paralelo</option> <option value="intermediateThrowEvent" ${el.type === 'intermediateThrowEvent'?'selected':''}>Evento Intermediário</option> </select> <input type="text" class="app-input" value="${el.name || ''}" data-field="name" placeholder="Nome/Rótulo (opcional)"> </div> <button class="app-button danger action-button" data-action="delete-element" style="font-size:0.8em; padding:3px 6px; margin-top:8px;"><i class="fas fa-trash"></i> Excluir</button>`; this.elementsListDiv.appendChild(elDiv); }); },
        renderFlows: function() { this.flowsListDiv.innerHTML = ''; this.data.flows.forEach((flow, index) => { const flowDiv = document.createElement('div'); flowDiv.className = 'bpmn-flow-item'; flowDiv.dataset.index = index; let sourceOptions = '<option value="">-- Origem --</option>'; this.data.elements.forEach(el => sourceOptions += `<option value="${el.id}" ${flow.sourceRef === el.id ? 'selected':''}>${el.name || el.id}</option>`); let targetOptions = '<option value="">-- Destino --</option>'; this.data.elements.forEach(el => targetOptions += `<option value="${el.id}" ${flow.targetRef === el.id ? 'selected':''}>${el.name || el.id}</option>`); flowDiv.innerHTML = `<div class="bpmn-flow-connection"> <select class="app-select" data-field="sourceRef" style="flex:1;">${sourceOptions}</select> <i class="fas fa-long-arrow-alt-right" style="margin:0 10px;"></i> <select class="app-select" data-field="targetRef" style="flex:1;">${targetOptions}</select> </div> <input type="text" class="app-input" value="${flow.condition || ''}" data-field="condition" placeholder="Condição (opcional)" style="margin-top:8px;"> <button class="app-button danger action-button" data-action="delete-flow" style="font-size:0.8em; padding:3px 6px; margin-top:8px;"><i class="fas fa-trash"></i> Excluir</button>`; this.flowsListDiv.appendChild(flowDiv); }); },
        addElement: function() { this.data.elements.push({ id: generateId('bpmnEl'), type: 'task', name: '' }); this.markDirty(); this.renderAll(); },
        addFlow: function() { this.data.flows.push({ id: generateId('bpmnFl'), sourceRef: '', targetRef: '', condition: '' }); this.markDirty(); this.renderAll(); },
        handleElementInput: function(e) { const input = e.target.closest('input, select'); if (!input) return; const index = parseInt(input.closest('.bpmn-element-item').dataset.index); const field = input.dataset.field; this.data.elements[index][field] = input.value; if(field === 'id' || field === 'name' || field === 'type') this.renderAll(); this.markDirty(); },
        handleElementAction: function(e) { const button = e.target.closest('button[data-action="delete-element"]'); if (button) { const index = parseInt(button.closest('.bpmn-element-item').dataset.index); this.data.elements.splice(index, 1); this.markDirty(); this.renderAll(); } },
        handleFlowInput: function(e) { const input = e.target.closest('input, select'); if (!input) return; const index = parseInt(input.closest('.bpmn-flow-item').dataset.index); const field = input.dataset.field; this.data.flows[index][field] = input.value; this.markDirty(); },
        handleFlowAction: function(e) { const button = e.target.closest('button[data-action="delete-flow"]'); if (button) { const index = parseInt(button.closest('.bpmn-flow-item').dataset.index); this.data.flows.splice(index, 1); this.markDirty(); this.renderFlows(); } },
        cleanup: () => {}
    };
    initializeFileState(appState, "Novo Modelo BPMN", "modelo.bpmn_simple", "bpmn-modeler");
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}