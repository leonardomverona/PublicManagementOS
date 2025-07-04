import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let t = cnpj.length - 2, n = cnpj.substring(0, t), d = cnpj.substring(t), s = 0, p = t - 7;
    for (let i = t; i >= 1; i--) { s += n.charAt(t - i) * p--; if (p < 2) p = 9; }
    let r = s % 11 < 2 ? 0 : 11 - s % 11; if (r !== parseInt(d.charAt(0))) return false;
    t++; n = cnpj.substring(0, t); s = 0; p = t - 7;
    for (let i = t; i >= 1; i--) { s += n.charAt(t - i) * p--; if (p < 2) p = 9; }
    r = s % 11 < 2 ? 0 : 11 - s % 11; return r === parseInt(d.charAt(1));
}

export function openContractManager() {
    const uniqueSuffix = generateId('contract_v4_prod');
    const winId = window.windowManager.createWindow('Gestão de Contratos (v4.3)', '', { width: '1350px', height: '900px', appType: 'contract-manager' });

    // -- TEMPLATE HTML E CSS COMPLETO --
    const content = `
    <style>
        :root { --separator-color: #ddd; --toolbar-bg: #f8f9fa; --window-bg: #fff; --text-color: #212529; }
        .dark-mode { --separator-color: #444; --toolbar-bg: #333; --window-bg: #2a2a2a; --text-color: #f1f1f1; }
        .contract-container-v4 { display: flex; flex-direction: column; height: 100%; overflow: hidden; background-color: var(--window-bg); color: var(--text-color); }
        .main-content-v4 { display: flex; flex: 1; overflow: hidden; }
        .main-form-column { width: 480px; min-width: 480px; border-right: 1px solid var(--separator-color); padding: 10px; overflow-y: auto; }
        .tabs-column { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .contract-tracking-tabs-v4 { display: flex; flex-shrink: 0; border-bottom: 1px solid var(--separator-color); background-color: var(--toolbar-bg); }
        .contract-tab-button { background: transparent; border: none; padding: 10px 15px; cursor: pointer; color: var(--text-color); border-bottom: 2px solid transparent; }
        .contract-tab-button.active { font-weight: bold; border-bottom-color: #3498db; }
        .contract-tab-content-v4 { flex: 1; padding: 15px; overflow-y: auto; }
        .form-section { border: 1px solid var(--separator-color); border-radius: 8px; margin-bottom: 15px; }
        .form-section summary { font-weight: 700; padding: 10px; background-color: var(--toolbar-bg); cursor: pointer; border-radius: 7px 7px 0 0; position: relative; }
        .form-section[open] summary { border-bottom: 1px solid var(--separator-color); }
        .form-section summary::marker { content: ''; }
        .form-section summary::after { content: '▶'; position: absolute; right: 15px; transition: transform .2s; }
        .form-section[open] summary::after { transform: rotate(90deg); }
        .form-section-content { padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 15px; }
        .form-grid-full { grid-column: 1 / -1; }
        .app-table { table-layout: fixed; width: 100%; border-collapse: collapse; }
        .app-table th, .app-table td { word-wrap: break-word; padding: 8px; text-align: left; border-bottom: 1px solid var(--separator-color); }
        .app-table th { background-color: var(--toolbar-bg); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: none; align-items: center; justify-content: center; }
        .modal-content { background: var(--window-bg); padding: 20px; border-radius: 8px; width: 90%; max-width: 700px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--separator-color); }
        .modal-title { font-size: 1.3em; font-weight: 700; }
        .modal-close { background: none; border: 0; font-size: 1.8em; cursor: pointer; line-height: 1; }
        .modal-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .modal-footer { text-align: right; margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--separator-color); }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .kpi-card { background: var(--toolbar-bg); padding: 15px; border-radius: 8px; text-align: center; }
        .kpi-title { font-size: 0.9em; text-transform: uppercase; margin-bottom: 5px; opacity: 0.8; }
        .kpi-value { font-size: 2em; font-weight: 700; }
        .kpi-subtext { font-size: 0.8em; opacity: 0.7; }
        .kpi-value.kpi-good { color: #28a745; } .kpi-value.kpi-warn { color: #ffc107; } .kpi-value.kpi-danger { color: #dc3545; }
        .chart-container { display: flex; gap: 20px; justify-content: space-around; flex-wrap: wrap; }
        .chart-wrapper { display: flex; flex-direction: column; align-items: center; background-color: var(--toolbar-bg); padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 48%; min-width: 300px; }
        .chart-title { font-weight: bold; margin-bottom: 10px; }
        .chart-legend { list-style: none; padding: 0; margin-top: 15px; width: 100%; }
        .chart-legend li { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: .9em; }
        .chart-legend .legend-label { display: flex; align-items: center; }
        .chart-legend .legend-color { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .doughnut-center-text { fill: var(--text-color); font-size: 1.5em; font-weight: 700; }
    </style>
    <div class="app-toolbar">${getStandardAppToolbarHTML()}</div>
    <div class="contract-container-v4">
        <div class="main-content-v4">
            <div class="main-form-column" id="mainFormContainer_${uniqueSuffix}">
                <details class="form-section" open><summary>Identificação do Contrato</summary><div class="form-section-content">
                    <input type="text" data-field="numeroContrato" class="app-input" placeholder="Contrato Nº"><select data-field="situacao" class="app-select"><option value="ativo">Ativo</option><option value="suspenso">Suspenso</option><option value="concluido">Concluído</option><option value="encerrado">Encerrado</option><option value="cancelado">Cancelado</option></select>
                    <input type="text" data-field="tipo" class="app-input form-grid-full" placeholder="Tipo de Contrato (Ex: Prestação de Serviço)">
                    <input type="text" data-field="contratante" class="app-input form-grid-full" placeholder="Contratante"><input type="text" data-field="contratada" class="app-input form-grid-full" placeholder="Contratada (Nome/CNPJ)">
                </div></details>
                <details class="form-section"><summary>Partes e Responsáveis</summary><div class="form-section-content">
                    <b class="form-grid-full">GESTOR</b>
                    <input type="text" data-field="gestor.nome" class="app-input form-grid-full" placeholder="Nome do Gestor">
                    <input type="text" data-field="gestor.masp" class="app-input" placeholder="MASP"><input type="text" data-field="gestor.setor" class="app-input" placeholder="Setor">
                    <b class="form-grid-full">FISCAL</b>
                    <input type="text" data-field="fiscal.nome" class="app-input form-grid-full" placeholder="Nome do Fiscal">
                </div></details>
                <details class="form-section" open><summary>Objeto e Valores</summary><div class="form-section-content">
                    <textarea data-field="objeto" class="app-textarea form-grid-full" placeholder="Objeto do Contrato"></textarea>
                    <input type="text" data-field="modalidade" class="app-input" placeholder="Modalidade Licitação"><input type="text" data-field="dotacao" class="app-input" placeholder="Dotação Orçamentária">
                    <div id="mainSeiContainer_${uniqueSuffix}" class="form-grid-full"></div>
                    <div class="form-grid-full"><h3>Valor Global Atual: <span id="valorGlobalDisplay_${uniqueSuffix}">R$ 0,00</span></h3></div>
                </div></details>
                <details class="form-section" open><summary>Itens do Contrato</summary><div class="form-section-content form-grid-full">
                    <table class="app-table" id="itemsTable_${uniqueSuffix}"><thead><tr><th>Nº SIAD</th><th>Descrição</th><th>Valor (R$)</th><th>Ações</th></tr></thead><tbody></tbody></table>
                    <button id="addItemBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-plus"></i> Adicionar Item</button>
                </div></details>
                <details class="form-section"><summary>Prazos e Vigência</summary><div class="form-section-content">
                    <label for="dataAssinatura">Assinatura</label><label for="vigenciaInicial">Vigência Inicial</label>
                    <input type="date" data-field="dataAssinatura" id="dataAssinatura" class="app-input" title="Data Assinatura"><input type="date" data-field="vigenciaInicial" id="vigenciaInicial" class="app-input" title="Vigência Inicial">
                    <label for="vigenciaAtual" class="form-grid-full">Vigência Atual</label>
                    <input type="date" data-field="vigenciaAtual" id="vigenciaAtual" class="app-input form-grid-full" title="Vigência Atual">
                </div></details>
            </div>
            <div class="tabs-column">
                <div class="contract-tracking-tabs-v4">
                    <button class="contract-tab-button active" data-tab="dashboard"><i class="fas fa-chart-pie"></i> Dashboard</button>
                    <button class="contract-tab-button" data-tab="financial"><i class="fas fa-coins"></i> Financeiro</button>
                    <button class="contract-tab-button" data-tab="physical"><i class="fas fa-tasks"></i> Físico</button>
                    <button class="contract-tab-button" data-tab="amendments"><i class="fas fa-file-medical"></i> Aditivos</button>
                    <button class="contract-tab-button" data-tab="invoices"><i class="fas fa-receipt"></i> Notas Fiscais</button>
                </div>
                <div class="contract-tab-content-v4" data-tab-content="dashboard"></div>
                <div class="contract-tab-content-v4" data-tab-content="financial" style="display:none;"></div>
                <div class="contract-tab-content-v4" data-tab-content="physical" style="display:none;"></div>
                <div class="contract-tab-content-v4" data-tab-content="amendments" style="display:none;"></div>
                <div class="contract-tab-content-v4" data-tab-content="invoices" style="display:none;"></div>
            </div>
        </div>
    </div>
    <div class="modal-overlay" id="modalOverlay_${uniqueSuffix}">
        <div class="modal-content">
            <div class="modal-header"><h3 class="modal-title" id="modalTitle_${uniqueSuffix}"></h3><button class="modal-close" id="modalClose_${uniqueSuffix}">×</button></div>
            <div class="modal-body" id="modalBody_${uniqueSuffix}"></div>
            <div class="modal-footer"><button class="app-button secondary" id="modalCancelBtn_${uniqueSuffix}">Cancelar</button> <button class="app-button primary" id="modalSaveBtn_${uniqueSuffix}">Salvar</button></div>
        </div>
    </div>`;

    const dashboardHTML = `<div class="dashboard-grid"><div class="kpi-card"><div class="kpi-title">Vigência</div><div class="kpi-value" id="kpiDaysLeft_${uniqueSuffix}">-</div><div class="kpi-subtext">Dias Restantes</div></div><div class="kpi-card"><div class="kpi-title">Entregas</div><div class="kpi-value" id="kpiPendingDeliveries_${uniqueSuffix}">0</div><div class="kpi-subtext">Pendentes</div></div><div class="kpi-card"><div class="kpi-title">Pagamentos</div><div class="kpi-value" id="kpiOverduePayments_${uniqueSuffix}">0</div><div class="kpi-subtext">Atrasados</div></div></div><div class="chart-container"><div class="chart-wrapper"><div class="chart-title">Execução Financeira</div><div id="financialChart_${uniqueSuffix}"></div><ul class="chart-legend" id="financialChartLegend_${uniqueSuffix}"></ul></div><div class="chart-wrapper"><div class="chart-title">Acompanhamento Físico</div><div id="physicalChart_${uniqueSuffix}"></div><ul class="chart-legend" id="physicalChartLegend_${uniqueSuffix}"></ul></div></div>`;
    const financialHTML = `<button id="addFinancialBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Novo Lançamento</button><div class="app-section"><h4>Lançamentos Financeiros</h4><table class="app-table"><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="financialTableBody_${uniqueSuffix}"></tbody></table></div>`;
    const physicalHTML = `<button id="addPhysicalBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Novo Marco</button><div class="app-section"><h4>Marcos de Entrega</h4><table class="app-table"><thead><tr><th>Item</th><th>Previsto</th><th>Realizado</th><th>Status</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="physicalTableBody_${uniqueSuffix}"></tbody></table></div>`;
    const amendmentsHTML = `<button id="addAmendmentBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Novo Aditivo</button><div class="app-section"><h4>Termos Aditivos</h4><table class="app-table"><thead><tr><th>Nº</th><th>Tipo</th><th>Variação Valor</th><th>Nova Vigência</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="amendmentsTableBody_${uniqueSuffix}"></tbody></table></div>`;
    const invoicesHTML = `<button id="addInvoiceBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Nova NF</button><div class="app-section"><h4>Notas Fiscais</h4><table class="app-table"><thead><tr><th>Nº</th><th>Valor</th><th>Emissão</th><th>Vencimento</th><th>Status</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="invoicesTableBody_${uniqueSuffix}"></tbody></table></div>`;

    const winData = window.windowManager.windows.get(winId); 
    if (!winData) return winId; 
    const windowContent = winData.element.querySelector('.window-content');
    windowContent.innerHTML = content;
    
    const tabContentMap = { dashboard: dashboardHTML, financial: financialHTML, physical: physicalHTML, amendments: amendmentsHTML, invoices: invoicesHTML };
    Object.keys(tabContentMap).forEach(key => { windowContent.querySelector(`[data-tab-content="${key}"]`).innerHTML = tabContentMap[key]; });
    
    const appState = {
        winId, appDataType: 'contract-manager_v4.3',
        data: {
            details: { situacao: 'ativo', gestor:{}, fiscal:{}, valorGlobal: 0, numeroSei: '', linkSei: '' },
            items:[], financial:[], physical:[], amendments:[], invoices:[]
        },
        ui: {
            container: windowContent.querySelector('.contract-container-v4'),
            form: windowContent.querySelector('.main-form-column'),
            valorGlobalDisplay: windowContent.querySelector(`#valorGlobalDisplay_${uniqueSuffix}`),
            mainSeiContainer: windowContent.querySelector(`#mainSeiContainer_${uniqueSuffix}`),
            tabButtons: windowContent.querySelectorAll('.contract-tracking-tabs-v4 .contract-tab-button'),
            tabContents: windowContent.querySelectorAll('.contract-tab-content-v4'),
            buttons: {
                addItem: windowContent.querySelector(`#addItemBtn_${uniqueSuffix}`),
                addFinancial: windowContent.querySelector(`#addFinancialBtn_${uniqueSuffix}`),
                addPhysical: windowContent.querySelector(`#addPhysicalBtn_${uniqueSuffix}`),
                addAmendment: windowContent.querySelector(`#addAmendmentBtn_${uniqueSuffix}`),
                addInvoice: windowContent.querySelector(`#addInvoiceBtn_${uniqueSuffix}`),
            },
            tables: {
                items: windowContent.querySelector(`#itemsTable_${uniqueSuffix} tbody`),
                financial: windowContent.querySelector(`#financialTableBody_${uniqueSuffix}`),
                physical: windowContent.querySelector(`#physicalTableBody_${uniqueSuffix}`),
                amendments: windowContent.querySelector(`#amendmentsTableBody_${uniqueSuffix}`),
                invoices: windowContent.querySelector(`#invoicesTableBody_${uniqueSuffix}`),
            },
            dashboard: {
                kpiDaysLeft: windowContent.querySelector(`#kpiDaysLeft_${uniqueSuffix}`),
                kpiPendingDeliveries: windowContent.querySelector(`#kpiPendingDeliveries_${uniqueSuffix}`),
                kpiOverduePayments: windowContent.querySelector(`#kpiOverduePayments_${uniqueSuffix}`),
                financialChart: windowContent.querySelector(`#financialChart_${uniqueSuffix}`),
                financialChartLegend: windowContent.querySelector(`#financialChartLegend_${uniqueSuffix}`),
                physicalChart: windowContent.querySelector(`#physicalChart_${uniqueSuffix}`),
                physicalChartLegend: windowContent.querySelector(`#physicalChartLegend_${uniqueSuffix}`),
            },
            modal: {
                overlay: windowContent.querySelector(`#modalOverlay_${uniqueSuffix}`),
                title: windowContent.querySelector(`#modalTitle_${uniqueSuffix}`),
                body: windowContent.querySelector(`#modalBody_${uniqueSuffix}`),
                saveBtn: windowContent.querySelector(`#modalSaveBtn_${uniqueSuffix}`),
                closeBtn: windowContent.querySelector(`#modalClose_${uniqueSuffix}`),
                cancelBtn: windowContent.querySelector(`#modalCancelBtn_${uniqueSuffix}`),
            }
        },
        eventHandlers: {},
        currentModal: { mode: null, type: null, id: null },

        getData: function() { this.updateDetailsFromUI(); return this.data; },
        loadData: function(dataString, fileMeta) { 
            try { 
                const loadedData = JSON.parse(dataString);
                const defaultData = {
                    details: { situacao: 'ativo', gestor:{}, fiscal:{}, valorGlobal: 0, numeroSei:'', linkSei:'' },
                    items: [], financial: [], physical: [], amendments: [], invoices: []
                };
                // Deep merge para garantir compatibilidade com arquivos antigos
                this.data = {
                    ...defaultData, ...loadedData,
                    details: { ...defaultData.details, ...(loadedData.details || {}) }
                };
                this.fileId = fileMeta.id;
                this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name);
                this.renderAll(); 
            } catch (e) {
                showNotification("Erro ao carregar arquivo de contrato: " + e.message, 5000);
            }
        },

        init: function() { 
            setupAppToolbarActions(this);
            if (document.body.classList.contains('dark-mode')) {
                this.ui.container.classList.add('dark-mode');
            }
            this._registerEventListeners();
            this.renderAll();
        },
        
        _registerEventListeners: function() {
            this.eventHandlers.formInput = (e) => {
                if (e.target.dataset.field) { this.markDirty(); this.updateDetailsFromUI(); }
            };
            this.ui.form.addEventListener('input', this.eventHandlers.formInput);

            this.eventHandlers.tabClick = (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.ui.tabContents.forEach(content => content.style.display = 'none');
                e.currentTarget.classList.add('active');
                this.ui.container.querySelector(`[data-tab-content="${tabName}"]`).style.display = 'block';
                if(tabName === 'dashboard') this.renderDashboard();
            };
            this.ui.tabButtons.forEach(button => button.addEventListener('click', this.eventHandlers.tabClick));
            
            this.ui.buttons.addItem.addEventListener('click', () => this.openModal('add', 'items'));
            this.ui.buttons.addFinancial.addEventListener('click', () => this.openModal('add', 'financial'));
            this.ui.buttons.addPhysical.addEventListener('click', () => this.openModal('add', 'physical'));
            this.ui.buttons.addAmendment.addEventListener('click', () => this.openModal('add', 'amendments'));
            this.ui.buttons.addInvoice.addEventListener('click', () => this.openModal('add', 'invoices'));
            
            this.eventHandlers.tableClick = (e) => {
                const table = e.currentTarget;
                const type = table.dataset.tableType;
                this.handleTableAction(e, type);
            };
            Object.keys(this.ui.tables).forEach(type => {
                const tableBody = this.ui.tables[type];
                tableBody.dataset.tableType = type;
                tableBody.addEventListener('click', this.eventHandlers.tableClick);
            });

            this.eventHandlers.closeModal = () => this.closeModal();
            this.eventHandlers.saveModal = () => this.handleModalSave();
            this.eventHandlers.overlayClick = (e) => { if (e.target === this.ui.modal.overlay) this.closeModal(); };
            
            this.ui.modal.closeBtn.addEventListener('click', this.eventHandlers.closeModal);
            this.ui.modal.cancelBtn.addEventListener('click', this.eventHandlers.closeModal);
            this.ui.modal.saveBtn.addEventListener('click', this.eventHandlers.saveModal);
            this.ui.modal.overlay.addEventListener('click', this.eventHandlers.overlayClick);
        },

        updateDetailsFromUI: function() {
            this.ui.form.querySelectorAll('[data-field]').forEach(input => {
                const keys = input.dataset.field.split('.');
                let current = this.data.details;
                keys.forEach((key, index) => {
                    if (index === keys.length - 1) {
                        current[key] = input.type === 'number' ? parseFloat(input.value) || 0 : input.value;
                    } else {
                        if (!current[key]) current[key] = {};
                        current = current[key];
                    }
                });
            });
            this.renderMainSei();
        },
        
        renderAll: function() {
            this.renderMainForm();
            this.recalculateTotals();

            const formatCurrency = v => `R$ ${(parseFloat(v) || 0).toFixed(2).replace('.', ',')}`;
            const formatDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

            this._renderTable('items', this.ui.tables.items, [{ h: 'Nº SIAD', k: 'numeroSiad' }, { h: 'Descrição', k: 'descricao' }, { h: 'Valor (R$)', k: 'valorFinanceiro', f: formatCurrency }]);
            this._renderTable('financial', this.ui.tables.financial, [{ h: 'Data', k: 'date', f: formatDate }, { h: 'Tipo', k: 'type' }, { h: 'Valor', k: 'value', f: formatCurrency }]);
            this._renderTable('physical', this.ui.tables.physical, [{ h: 'Item', k: 'item' }, { h: 'Previsto', k: 'date_planned', f: formatDate }, { h: 'Realizado', k: 'date_done', f: formatDate }, { h: 'Status', k: 'status' }]);
            this._renderTable('amendments', this.ui.tables.amendments, [{ h: 'Nº', k: 'number' }, { h: 'Tipo', k: 'type' }, { h: 'Variação Valor', k: 'value_change', f: formatCurrency }, { h: 'Nova Vigência', k: 'new_end_date', f: formatDate }]);
            this._renderTable('invoices', this.ui.tables.invoices, [{ h: 'Nº', k: 'number' }, { h: 'Valor', k: 'value', f: formatCurrency }, { h: 'Vencimento', k: 'date_due', f: formatDate }, { h: 'Status', k: 'status' }]);

            this.renderDashboard();
        },

        renderMainForm: function() {
            this.ui.form.querySelectorAll('[data-field]').forEach(input => {
                const keys = input.dataset.field.split('.');
                const value = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', this.data.details);
                input.value = value;
            });
            this.renderMainSei();
        },
        
        renderMainSei: function() {
            const { numeroSei, linkSei } = this.data.details;
            if (linkSei && numeroSei) {
                this.ui.mainSeiContainer.innerHTML = `<b>Processo SEI:</b> <a href="${linkSei}" target="_blank" title="${linkSei}">${numeroSei}</a>`;
            } else if (numeroSei) {
                 this.ui.mainSeiContainer.innerHTML = `<b>Processo SEI:</b> ${numeroSei}`;
            } else {
                 this.ui.mainSeiContainer.innerHTML = '';
            }
        },

        _renderTable: function(type, tableBody, columns) {
            tableBody.innerHTML = '';
            const dataArray = this.data[type] || [];
            dataArray.forEach(item => {
                const row = tableBody.insertRow();
                row.dataset.id = item.id;
                
                const cellsHTML = columns.map(col => {
                    const value = col.k.split('.').reduce((o, i) => o?.[i], item) ?? '';
                    return `<td>${col.f ? col.f(value) : value}</td>`;
                }).join('');
                
                const seiCell = `<td>${this._getSeiLinkHTML(item)}</td>`;
                const actionsCell = `<td>
                    <button class="app-button secondary small" data-action="edit" title="Editar"><i class="fas fa-edit"></i></button> 
                    <button class="app-button danger small" data-action="delete" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>`;
                row.innerHTML = cellsHTML + seiCell + actionsCell;
            });
        },
        
        _getSeiLinkHTML: function(item) {
            if (item.sei_link && item.sei_number) return `<a href="${item.sei_link}" target="_blank" title="${item.sei_link}">${item.sei_number}</a>`;
            return item.sei_number || '-';
        },
        
        recalculateTotals: function() {
            const itemsTotal = (this.data.items || []).reduce((sum, item) => sum + (parseFloat(item.valorFinanceiro) || 0), 0);
            const amendmentsTotal = (this.data.amendments || []).reduce((sum, item) => sum + (parseFloat(item.value_change) || 0), 0);
            const globalTotal = itemsTotal + amendmentsTotal;
            this.data.details.valorGlobal = globalTotal;
            this.ui.valorGlobalDisplay.textContent = `R$ ${globalTotal.toFixed(2).replace('.', ',')}`;
        },
        
        openModal: function(mode, type, id = null) {
            this.currentModal = { mode, type, id };
            const { modal } = this.ui;
            let entry = {};
            const titleMap = {items:'Item', financial:'Lançamento Financeiro', physical:'Marco Físico', amendments:'Aditivo', invoices:'Nota Fiscal'};
            modal.title.textContent = (mode === 'edit' ? 'Editar ' : 'Adicionar ') + (titleMap[type] || 'Entrada');

            if (mode === 'edit') {
                entry = { ...(this.data[type]?.find(e => e.id === id) || {}) };
            }
            modal.body.innerHTML = this._getModalFormHTML(type, entry);
            modal.overlay.style.display = 'flex';
        },

        closeModal: function() { this.ui.modal.overlay.style.display = 'none'; this.ui.modal.body.innerHTML = ''; },

        _getModalFormHTML: function(type, entry = {}) {
            const today = new Date().toISOString().split('T')[0];
            const seiFields = `<input id="f_sei_number" class="app-input" placeholder="Nº Documento SEI" value="${entry.sei_number ?? ''}"><input id="f_sei_link" class="app-input" placeholder="Link do Documento SEI" value="${entry.sei_link ?? ''}">`;
            const getItemOptions = (selectedId) => this.data.items.map(i => `<option value="${i.id}" ${selectedId === i.id ? 'selected' : ''}>${i.descricao || '(Item sem descrição)'}</option>`).join('');

            switch(type) {
                case 'items': return `<div class="modal-form-grid"><input id="f_numeroSiad" class="app-input" placeholder="Nº SIAD" value="${entry.numeroSiad ?? ''}"><input type="number" step="0.01" id="f_valorFinanceiro" class="app-input" placeholder="Valor Financeiro (R$)" value="${entry.valorFinanceiro ?? ''}"><textarea id="f_descricao" class="app-textarea form-grid-full" placeholder="Descrição">${entry.descricao ?? ''}</textarea></div>`;
                case 'financial': return `<div class="modal-form-grid"><input type="date" id="f_date" class="app-input" value="${entry.date || today}"><select id="f_type" class="app-select"><option value="empenho" ${entry.type === 'empenho'?'selected':''}>Empenho</option><option value="liquidacao" ${entry.type === 'liquidacao'?'selected':''}>Liquidação</option><option value="pagamento" ${entry.type === 'pagamento'?'selected':''}>Pagamento</option><option value="anulacao" ${entry.type === 'anulacao'?'selected':''}>Anulação</option></select><input type="number" step="0.01" id="f_value" class="app-input" placeholder="Valor (R$)" value="${entry.value ?? ''}"><input id="f_description" class="app-input form-grid-full" placeholder="Descrição" value="${entry.description ?? ''}">${seiFields}</div>`;
                case 'physical': return `<div class="modal-form-grid"><select id="f_itemId" class="app-select form-grid-full"><option value="">Selecione um item...</option>${getItemOptions(entry.itemId)}</select><input type="date" id="f_date_planned" class="app-input" title="Data Prevista" value="${entry.date_planned ?? ''}"><input type="date" id="f_date_done" class="app-input" title="Data Realizada" value="${entry.date_done ?? ''}"><select id="f_status" class="app-select"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="andamento" ${entry.status==='andamento'?'selected':''}>Andamento</option><option value="concluido" ${entry.status==='concluido'?'selected':''}>Concluído</option><option value="atrasado" ${entry.status==='atrasado'?'selected':''}>Atrasado</option></select>${seiFields}</div>`;
                case 'amendments': return `<div class="modal-form-grid"><input id="f_number" class="app-input" placeholder="Nº Aditivo" value="${entry.number ?? ''}"><select id="f_type" class="app-select"><option value="valor" ${entry.type === 'valor'?'selected':''}>Valor</option><option value="prazo" ${entry.type === 'prazo'?'selected':''}>Prazo</option><option value="misto" ${entry.type === 'misto'?'selected':''}>Misto</option></select><input type="date" id="f_date" value="${entry.date||today}"><input type="number" step="0.01" id="f_value_change" placeholder="Variação de Valor (+/-)" value="${entry.value_change??''}"><input type="date" id="f_new_end_date" placeholder="Nova Vigência" value="${entry.new_end_date??''}"><textarea id="f_object" class="app-textarea form-grid-full" placeholder="Objeto">${entry.object??''}</textarea>${seiFields}</div>`;
                case 'invoices': return `<div class="modal-form-grid"><input id="f_number" placeholder="Nº NF" value="${entry.number??''}"><input type="number" step="0.01" id="f_value" placeholder="Valor (R$)" value="${entry.value??''}"><input type="date" id="f_date_issue" title="Data de Emissão" value="${entry.date_issue||today}"><input type="date" id="f_date_attested" title="Data de Atesto" value="${entry.date_attested??''}"><input type="date" id="f_date_due" title="Data de Vencimento" value="${entry.date_due??''}"><input type="date" id="f_date_payment" title="Data de Pagamento" value="${entry.date_payment??''}"><select id="f_status" class="form-grid-full"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="atestado" ${entry.status==='atestado'?'selected':''}>Atestado</option><option value="pago" ${entry.status==='pago'?'selected':''}>Pago</option><option value="cancelado" ${entry.status==='cancelado'?'selected':''}>Cancelado</option></select>${seiFields}</div>`;
                default: return `Formulário não encontrado para o tipo "${type}".`;
            }
        },

        handleModalSave: function() {
            const { mode, type, id } = this.currentModal;
            if (!this.data[type]) this.data[type] = [];
            
            let entry = (mode === 'edit') ? this.data[type].find(e => e.id === id) : { id: generateId(type) };
            if (!entry) { showNotification("Erro: item não encontrado para edição.", 4000, 'error'); return; }

            const form = this.ui.modal.body;
            const getVal = (fieldId) => form.querySelector(`#f_${fieldId}`)?.value;
            const getFloat = (fieldId) => parseFloat(getVal(fieldId)) || 0;
            const seiData = { sei_number: getVal('sei_number'), sei_link: getVal('sei_link') };

            switch(type) {
                case 'items': Object.assign(entry, { numeroSiad: getVal('numeroSiad'), descricao: getVal('descricao'), valorFinanceiro: getFloat('valorFinanceiro') }); break;
                case 'financial': Object.assign(entry, { date: getVal('date'), type: getVal('type'), value: getFloat('value'), description: getVal('description'), ...seiData }); break;
                case 'physical': const item = this.data.items.find(i => i.id === getVal('itemId')); Object.assign(entry, { itemId: getVal('itemId'), item: item ? item.descricao : 'Item inválido', date_planned: getVal('date_planned'), date_done: getVal('date_done'), status: getVal('status'), ...seiData }); break;
                case 'amendments': const newEndDate = getVal('new_end_date'); Object.assign(entry, { number: getVal('number'), type: getVal('type'), date: getVal('date'), value_change: getFloat('value_change'), new_end_date: newEndDate, object: getVal('object'), ...seiData }); if (newEndDate) { this.data.details.vigenciaAtual = newEndDate; this.renderMainForm(); } break;
                case 'invoices': const attested = getVal('date_attested'), payment = getVal('date_payment'), due = getVal('date_due'); let status = getVal('status'); if(payment) status='pago'; else if(attested) status='atestado'; Object.assign(entry, { number:getVal('number'), value:getFloat('value'), date_issue:getVal('date_issue'), date_attested:attested, date_due:due, date_payment:payment, status, ...seiData }); break;
            }

            if (mode === 'add') this.data[type].push(entry);
            
            this.markDirty(); this.renderAll(); this.closeModal();
        },

        handleTableAction: function(e, tableType) {
            const row = e.target.closest('tr'); if (!row) return;
            const editBtn = e.target.closest('button[data-action="edit"]');
            const deleteBtn = e.target.closest('button[data-action="delete"]');

            if(editBtn) this.openModal('edit', tableType, row.dataset.id);
            if(deleteBtn) {
                if (confirm(`Tem certeza que deseja excluir este item?`)) {
                    this.data[tableType] = this.data[tableType].filter(item => item.id !== row.dataset.id);
                    this.markDirty(); this.renderAll();
                }
            }
        },

        calculateFinancials: function() {
            let empenhado=0, liquidado=0, pago=0;
            (this.data.financial || []).forEach(f => {
                const v = f.value || 0;
                if(f.type==='empenho') empenhado += v; else if(f.type==='liquidacao') liquidado += v; else if(f.type==='pagamento') pago += v; else if(f.type==='anulacao') empenhado -= v;
            });
            return { totalValue: this.data.details.valorGlobal, empenhado, liquidado, pago };
        },
        
        renderDashboard: function() {
            const { dashboard } = this.ui;
            const { details, physical, invoices } = this.data;
            const today = new Date();
            today.setHours(0,0,0,0);

            if(details.vigenciaAtual){
                const end=new Date(details.vigenciaAtual + "T23:59:59"), days=Math.ceil((end - today)/864e5);
                dashboard.kpiDaysLeft.textContent = days;
                dashboard.kpiDaysLeft.className = 'kpi-value';
                if(days < 0) dashboard.kpiDaysLeft.classList.add('kpi-danger');
                else if(days <= 60) dashboard.kpiDaysLeft.classList.add('kpi-warn');
                else dashboard.kpiDaysLeft.classList.add('kpi-good');
            } else {
                dashboard.kpiDaysLeft.textContent = '-';
                dashboard.kpiDaysLeft.className = 'kpi-value';
            }

            const pending = (physical || []).filter(p => p.status !== 'concluido').length;
            dashboard.kpiPendingDeliveries.textContent = pending;
            dashboard.kpiPendingDeliveries.className = 'kpi-value ' + (pending > 0 ? 'kpi-warn' : 'kpi-good');

            const late = (invoices || []).filter(i => i.status !== 'pago' && i.date_due && (new Date(i.date_due + "T23:59:59") < today)).length;
            dashboard.kpiOverduePayments.textContent = late;
            dashboard.kpiOverduePayments.className = 'kpi-value ' + (late > 0 ? 'kpi-danger' : 'kpi-good');

            const fin = this.calculateFinancials();
            const finData=[{l:'Pago',v:fin.pago,c:'#28a745'}, {l:'A Pagar',v:fin.liquidado-fin.pago,c:'#ffc107'}, {l:'A Liquidar',v:fin.empenhado-fin.liquidado,c:'#17a2b8'}, {l:'Saldo a Empenhar',v:fin.totalValue-fin.empenhado,c:'#6c757d'}].filter(d=>d.v > 0.005);
            this._createDoughnutChart(dashboard.financialChart, dashboard.financialChartLegend, finData, `R$ ${fin.totalValue.toFixed(2).replace('.', ',')}`);

            const physStatus=(physical||[]).reduce((acc,p)=>{acc[p.status]=(acc[p.status]||0)+1;return acc;},{});
            const physData=[{l:'Concluído',v:physStatus.concluido||0,c:'#28a745'},{l:'Andamento',v:physStatus.andamento||0,c:'#17a2b8'},{l:'Pendente',v:physStatus.pendente||0,c:'#ffc107'},{l:'Atrasado',v:physStatus.atrasado||0,c:'#dc3545'}].filter(d=>d.v > 0);
            this._createDoughnutChart(dashboard.physicalChart, dashboard.physicalChartLegend, physData, `${(physical||[]).length} Itens`);
        },

        _createDoughnutChart: function(svgContainer, legendContainer, data, centerLabel) {
            svgContainer.innerHTML=''; legendContainer.innerHTML='';
            const total = data.reduce((s, item) => s + (item.v || 0), 0);
            if(total === 0){ svgContainer.innerHTML = '<p style="text-align:center; margin-top:50px;">Sem dados para exibir.</p>'; return; }
            const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            const r=45, ir=28; let startAngle = -Math.PI/2;
            data.forEach(item => {
                const angle = (item.v / total) * 2 * Math.PI; const endAngle = startAngle + angle;
                if(angle === 0) return;
                const [x1,y1] = [50 + r * Math.cos(startAngle), 50 + r * Math.sin(startAngle)],[x2,y2] = [50 + r * Math.cos(endAngle), 50 + r * Math.sin(endAngle)],[ix1,iy1] = [50 + ir * Math.cos(startAngle), 50 + ir * Math.sin(startAngle)],[ix2,iy2] = [50 + ir * Math.cos(endAngle),   50 + ir * Math.sin(endAngle)];
                const largeArcFlag = angle > Math.PI ? 1 : 0;
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`);
                path.setAttribute("fill", item.c); svg.appendChild(path);
                const isCurrency = item.l.includes('Pago') || item.l.includes('Pagar') || item.l.includes('Liquidar') || item.l.includes('Saldo');
                const valueDisplay = isCurrency ? `R$ ${item.v.toFixed(2).replace('.', ',')}` : item.v;
                legendContainer.innerHTML += `<li><span class="legend-label"><span class="legend-color" style="background-color:${item.c};"></span>${item.l}</span><span class="legend-value">${valueDisplay}</span></li>`;
                startAngle = endAngle;
            });
            const text = document.createElementNS("http://www.w3.org/2000/svg","text");
            text.setAttribute("x","50"); text.setAttribute("y","50"); text.setAttribute("text-anchor","middle"); text.setAttribute("dominant-baseline","middle");
            text.classList.add('doughnut-center-text'); text.textContent = centerLabel; svg.appendChild(text);
            svgContainer.appendChild(svg);
        },

        cleanup: function() {
            this.ui.form.removeEventListener('input', this.eventHandlers.formInput);
            this.ui.tabButtons.forEach(button => button.removeEventListener('click', this.eventHandlers.tabClick));
            
            Object.keys(this.ui.tables).forEach(type => {
                this.ui.tables[type].removeEventListener('click', this.eventHandlers.tableClick);
            });
            
            this.ui.modal.closeBtn.removeEventListener('click', this.eventHandlers.closeModal);
            this.ui.modal.cancelBtn.removeEventListener('click', this.eventHandlers.closeModal);
            this.ui.modal.saveBtn.removeEventListener('click', this.eventHandlers.saveModal);
            this.ui.modal.overlay.removeEventListener('click', this.eventHandlers.overlayClick);
            
            this.eventHandlers = {}; // Limpa o objeto de handlers
        }
    };
    
    initializeFileState(appState, 'Novo Contrato', 'contrato.gcontract', 'contract-manager_v4');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
