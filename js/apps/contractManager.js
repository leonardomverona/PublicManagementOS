/**
 * @module ContractManagerCombined
 * @description A comprehensive contract management application for a virtual OS.
 * This module merges a dashboard-centric list view with a detailed, tabbed contract editor view.
 *
 * @version 5.2 - Added search/filter, pagination, export, responsive design, and enhanced validation.
 */

import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

// ===================================================================================
// #region SHARED UTILITY FUNCTIONS
// ===================================================================================

function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function validateCNPJ(cnpj) {
    if (!cnpj) return false;
    cnpj = cnpj.replace(/[^\d]+/g, '');
    
    // Improved validation with more efficient digit calculation
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    
    const calcDigit = (slice, factor) => {
        let sum = 0;
        for (let i = 0; i < slice.length; i++) {
            sum += parseInt(slice[i]) * (factor-- > 2 ? factor : 9);
        }
        const result = 11 - (sum % 11);
        return result > 9 ? 0 : result;
    };

    const digits = cnpj.substring(12);
    const digit1 = calcDigit(cnpj.substring(0, 12), 5);
    if (parseInt(digits[0]) !== digit1) return false;

    const digit2 = calcDigit(cnpj.substring(0, 13), 6);
    return parseInt(digits[1]) === digit2;
}

function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ===================================================================================
// #endregion
// ===================================================================================
// #region CONTRACT DETAIL EDITOR
// ===================================================================================

export function openContractDetailEditor(initialData, fileId, onSaveCallback) {
    const uniqueSuffix = generateId('contract_detail');
    const windowTitle = `Editor de Contrato - ${initialData.details.numeroContrato || 'Novo Contrato'}`;
    const winId = window.windowManager.createWindow(windowTitle, '', { width: '1350px', height: '900px', appType: 'contract-editor' });

    const content = `
    <style>
        :root { /* Light Mode Defaults */
            --separator-color: #e2e8f0; --toolbar-bg: #f8fafc; --window-bg: #fff; --text-color: #212529;
            --input-bg: #fff; --input-border: #cbd5e1;
            --kpi-good: #28a745; --kpi-warn: #ffc107; --kpi-danger: #dc3545;
        }
        .dark-mode { /* Dark Mode Overrides */
            --separator-color: #4a5568; --toolbar-bg: #2d3748; --window-bg: #1a202c; --text-color: #e2e8f0;
            --input-bg: #2d3748; --input-border: #4a5568;
        }
        .contract-editor-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; background-color: var(--window-bg); color: var(--text-color); }
        .main-content-v4 { display: flex; flex: 1; overflow: hidden; }
        .main-form-column { width: 480px; min-width: 480px; border-right: 1px solid var(--separator-color); padding: 10px; overflow-y: auto; }
        .tabs-column { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .contract-tracking-tabs-v4 { display: flex; flex-shrink: 0; border-bottom: 1px solid var(--separator-color); background-color: var(--toolbar-bg); }
        .contract-tab-button { background: transparent; border: none; padding: 10px 15px; cursor: pointer; color: var(--text-color); border-bottom: 3px solid transparent; margin-bottom: -1px; }
        .contract-tab-button:hover { background-color: var(--separator-color); }
        .contract-tab-button.active { font-weight: bold; border-bottom-color: #3498db; }
        .contract-tab-content-v4 { flex: 1; padding: 15px; overflow-y: auto; }
        .form-section { border: 1px solid var(--separator-color); border-radius: 8px; margin-bottom: 15px; }
        .form-section summary { font-weight: 700; padding: 10px; background-color: var(--toolbar-bg); cursor: pointer; border-radius: 7px 7px 0 0; position: relative; list-style: none; }
        .form-section[open] summary { border-bottom: 1px solid var(--separator-color); }
        .form-section summary::-webkit-details-marker { display: none; }
        .form-section summary::after { content: '▶'; position: absolute; right: 15px; transition: transform .2s; }
        .form-section[open] summary::after { transform: rotate(90deg); }
        .form-section-content { padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 15px; }
        .form-grid-full { grid-column: 1 / -1; }
        /* Other styles */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: none; align-items: center; justify-content: center; }
        .modal-content { background: var(--window-bg); color: var(--text-color); padding: 20px; border-radius: 8px; width: 90%; max-width: 700px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--separator-color); }
        .modal-title { font-size: 1.3em; font-weight: 700; }
        .modal-close { background: none; border: 0; font-size: 1.8em; cursor: pointer; line-height: 1; color: var(--text-color); }
        .modal-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .modal-footer { text-align: right; margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--separator-color); }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .kpi-card { background: var(--toolbar-bg); padding: 15px; border-radius: 8px; text-align: center; }
        .kpi-title { font-size: 0.9em; text-transform: uppercase; margin-bottom: 5px; opacity: 0.8; }
        .kpi-value { font-size: 2em; font-weight: 700; }
        .kpi-subtext { font-size: 0.8em; opacity: 0.7; }
        .kpi-value.kpi-good { color: var(--kpi-good); } .kpi-value.kpi-warn { color: var(--kpi-warn); } .kpi-value.kpi-danger { color: var(--kpi-danger); }
        .chart-container { display: flex; gap: 20px; justify-content: space-around; flex-wrap: wrap; }
        .chart-wrapper { display: flex; flex-direction: column; align-items: center; background-color: var(--toolbar-bg); padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 48%; min-width: 300px; }
        .chart-title { font-weight: bold; margin-bottom: 10px; }
        .chart-legend { list-style: none; padding: 0; margin-top: 15px; width: 100%; }
        .chart-legend li { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: .9em; }
        .chart-legend .legend-label { display: flex; align-items: center; }
        .chart-legend .legend-color { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .doughnut-center-text { fill: var(--text-color); font-size: 1.5em; font-weight: 700; }
        
        /* Responsive styles */
        @media (max-width: 1200px) {
            .main-content-v4 {
                flex-direction: column;
            }
            .main-form-column {
                width: 100%;
                min-width: 100%;
                border-right: none;
                border-bottom: 1px solid var(--separator-color);
            }
        }
        @media (max-width: 768px) {
            .dashboard-cards {
                grid-template-columns: 1fr 1fr;
            }
            .contract-tracking-tabs-v4 {
                flex-wrap: wrap;
            }
            .contract-tab-button {
                flex: 1 0 33%;
                font-size: 0.9em;
                padding: 8px 5px;
            }
            .chart-wrapper {
                width: 100%;
            }
        }
        @media (max-width: 480px) {
            .dashboard-cards {
                grid-template-columns: 1fr;
            }
            .contract-tab-button {
                flex: 1 0 50%;
            }
        }
    </style>
    <div class="app-toolbar">${getStandardAppToolbarHTML({ save: true, open: false, new: false })}</div>
    <div class="contract-editor-container" id="editorContainer_${uniqueSuffix}">
        <div class="main-content-v4">
            <div class="main-form-column" id="mainFormContainer_${uniqueSuffix}">
                <details class="form-section" open><summary>Identificação do Contrato</summary><div class="form-section-content">
                    <input type="text" data-field="numeroContrato" class="app-input" placeholder="Contrato Nº"><select data-field="situacao" class="app-select"><option value="ativo">Ativo</option><option value="suspenso">Suspenso</option><option value="concluido">Concluído</option><option value="encerrado">Encerrado</option><option value="cancelado">Cancelado</option></select>
                    <input type="text" data-field="tipo" class="app-input form-grid-full" placeholder="Tipo de Contrato (Ex: Prestação de Serviço)">
                    <input type="text" data-field="contratante.nome" class="app-input form-grid-full" placeholder="Contratante (Nome)"><input type="text" data-field="contratante.cnpj" class="app-input form-grid-full" placeholder="Contratante (CNPJ)">
                    <input type="text" data-field="contratada.nome" class="app-input form-grid-full" placeholder="Contratada (Nome)"><input type="text" data-field="contratada.cnpj" class="app-input form-grid-full" placeholder="Contratada (CNPJ)">
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
                    <label>Assinatura</label><label>Vigência Inicial</label>
                    <input type="date" data-field="dataAssinatura" class="app-input" title="Data Assinatura"><input type="date" data-field="vigenciaInicial" class="app-input" title="Vigência Inicial">
                    <label class="form-grid-full">Vigência Atual</label>
                    <input type="date" data-field="vigenciaAtual" class="app-input form-grid-full" title="Vigência Atual">
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
    </div>
    `;
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
        winId, appDataType: 'contract-editor_v5.2',
        data: {},
        onSaveCallback: onSaveCallback,
        themeObserver: null,
        ui: {
            container: windowContent.querySelector(`#editorContainer_${uniqueSuffix}`),
            form: windowContent.querySelector(`#mainFormContainer_${uniqueSuffix}`),
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
        loadData: function(data) { 
            this.data = JSON.parse(JSON.stringify(data)); // Deep copy
            this.renderAll(); 
        },

        init: function() {
            const toolbar = winData.element.querySelector('.app-toolbar');
            const saveBtn = toolbar.querySelector('.save-file-btn');
            if(saveBtn) saveBtn.onclick = () => this.saveChanges();
            
            this.setupThemeObserver();
            this._registerEventListeners();
            this.loadData(initialData);
        },

        saveChanges: function() {
            try {
                if (this.onSaveCallback) {
                    this.updateDetailsFromUI();
                    this.onSaveCallback(this.data);
                    showNotification("Alterações salvas com sucesso!", 3000, "success");
                } else {
                    showNotification("Nenhuma ação de salvamento configurada.", 4000, "error");
                }
            } catch (error) {
                console.error("Erro ao salvar contrato:", error);
                showNotification(`Falha ao salvar: ${error.message}`, 5000, "error");
            }
        },
        
        setupThemeObserver: function() {
            const appContainer = this.ui.container;
            const applyTheme = () => {
                if(document.body.classList.contains('dark-mode')) {
                    appContainer.classList.add('dark-mode');
                } else {
                    appContainer.classList.remove('dark-mode');
                }
            };

            this.themeObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === 'class') {
                        applyTheme();
                    }
                });
            });

            this.themeObserver.observe(document.body, { attributes: true });
            applyTheme();
        },
        
        _registerEventListeners: function() {
            this.eventHandlers.formInput = (e) => {
                const field = e.target.dataset.field;
                if (field) {
                    if(field.endsWith('.cnpj')) {
                        e.target.value = formatCNPJ(e.target.value);
                    }
                    this.updateDetailsFromUI();
                }
            };
            this.ui.form.addEventListener('input', this.eventHandlers.formInput);

            this.eventHandlers.cnpjBlur = (e) => {
                if (e.target.dataset.field && e.target.dataset.field.endsWith('.cnpj')) {
                    if (e.target.value && !validateCNPJ(e.target.value)) {
                        showNotification(`CNPJ "${e.target.placeholder}" inválido.`, 3000, 'error');
                        e.target.classList.add('invalid-input');
                    } else {
                        e.target.classList.remove('invalid-input');
                    }
                }
            };
            this.ui.form.addEventListener('blur', this.eventHandlers.cnpjBlur, true);

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
            
            this.eventHandlers.tableClick = (e, type) => this.handleTableAction(e, type);
            Object.keys(this.ui.tables).forEach(type => {
                this.ui.tables[type].addEventListener('click', (e) => this.eventHandlers.tableClick(e, type));
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
                        if (!current[key] || typeof current[key] !== 'object') current[key] = {};
                        current = current[key];
                    }
                });
            });
            window.windowManager.updateWindowTitle(this.winId, `Editor de Contrato - ${this.data.details.numeroContrato}`);
            this.recalculateTotals();
            this.renderMainSei();
        },
        
        renderAll: function() {
            this.renderMainForm();
            this.recalculateTotals();

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
                let value = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', this.data.details);
                
                if (input.dataset.field.endsWith('.cnpj')) {
                    value = formatCNPJ(value);
                }
                
                input.value = value;
            });
            this.renderMainSei();
        },
        
        renderMainSei: function() {
            const { numeroSei, linkSei } = this.data.details;
            let html = '';
            if (numeroSei) {
                html = `<b>Processo SEI:</b> `;
                if (linkSei) {
                    html += `<a href="${linkSei}" target="_blank" title="Abrir processo no SEI">${numeroSei}</a>`;
                } else {
                    html += numeroSei;
                }
            }
            this.ui.mainSeiContainer.innerHTML = html;
        },

        _renderTable: function(type, tableBody, columns) {
            tableBody.innerHTML = '';
            const dataArray = this.data[type];
            (dataArray || []).forEach(item => {
                const row = tableBody.insertRow();
                row.dataset.id = item.id;
                
                let cellsHTML = columns.map(col => {
                    const value = item[col.k] || '';
                    return `<td>${col.f ? col.f(value) : value}</td>`;
                }).join('');
                
                if (item.hasOwnProperty('sei_number') || item.hasOwnProperty('sei_link')) {
                    cellsHTML += `<td>${this._getSeiLinkHTML(item)}</td>`;
                }
                
                cellsHTML += `<td>
                    <button class="app-button secondary small" data-action="edit" title="Editar"><i class="fas fa-edit"></i></button> 
                    <button class="app-button danger small" data-action="delete" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>`;
                row.innerHTML = cellsHTML;
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
            this.ui.valorGlobalDisplay.textContent = formatCurrency(globalTotal);
        },
        
        openModal: function(mode, type, id = null) {
            this.currentModal = { mode, type, id };
            const { modal } = this.ui;
            let entry = {};
            const titleMap = {items:'Item', financial:'Lançamento Financeiro', physical:'Marco Físico', amendments:'Aditivo', invoices:'Nota Fiscal'};
            modal.title.textContent = (mode === 'edit' ? 'Editar ' : 'Adicionar ') + titleMap[type];

            if (mode === 'edit') {
                const dataArray = this.data[type];
                entry = { ...(dataArray.find(e => e.id === id) || {}) };
            }
            modal.body.innerHTML = this._getModalFormHTML(type, entry);
            modal.overlay.style.display = 'flex';
        },

        closeModal: function() { this.ui.modal.overlay.style.display = 'none'; this.ui.modal.body.innerHTML = ''; },

        _getModalFormHTML: function(type, entry = {}) {
            const today = new Date().toISOString().split('T')[0];
            const seiFields = `<input id="f_sei_number" class="app-input" placeholder="Nº Documento SEI" value="${entry.sei_number || ''}"><input id="f_sei_link" class="app-input" placeholder="Link do Documento SEI" value="${entry.sei_link || ''}">`;
            const getItemOptions = (selectedId) => (this.data.items || []).map(i => `<option value="${i.id}" ${selectedId === i.id ? 'selected' : ''}>${i.descricao || '(Item sem descrição)'}</option>`).join('');

            switch(type) {
                case 'items': return `<div class="modal-form-grid"><input id="f_numeroSiad" class="app-input" placeholder="Nº SIAD" value="${entry.numeroSiad || ''}"><input type="number" step="0.01" id="f_valorFinanceiro" class="app-input" placeholder="Valor Financeiro (R$)" value="${entry.valorFinanceiro || ''}"><textarea id="f_descricao" class="app-textarea form-grid-full" placeholder="Descrição">${entry.descricao || ''}</textarea></div>`;
                case 'financial': return `<div class="modal-form-grid"><input type="date" id="f_date" class="app-input" value="${entry.date || today}"><select id="f_type" class="app-select"><option value="empenho" ${entry.type === 'empenho'?'selected':''}>Empenho</option><option value="liquidacao" ${entry.type === 'liquidacao'?'selected':''}>Liquidação</option><option value="pagamento" ${entry.type === 'pagamento'?'selected':''}>Pagamento</option><option value="anulacao" ${entry.type === 'anulacao'?'selected':''}>Anulação</option></select><input type="number" step="0.01" id="f_value" class="app-input" placeholder="Valor (R$)" value="${entry.value || ''}"><input id="f_description" class="app-input form-grid-full" placeholder="Descrição" value="${entry.description || ''}">${seiFields}</div>`;
                case 'physical': return `<div class="modal-form-grid"><select id="f_itemId" class="app-select form-grid-full">${getItemOptions(entry.itemId)}</select><label>Data Prevista</label><label>Data Realizada</label><input type="date" id="f_date_planned" class="app-input" title="Data Prevista" value="${entry.date_planned || ''}"><input type="date" id="f_date_done" class="app-input" title="Data Realizada" value="${entry.date_done || ''}"><select id="f_status" class="app-select"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="andamento" ${entry.status==='andamento'?'selected':''}>Andamento</option><option value="concluido" ${entry.status==='concluido'?'selected':''}>Concluído</option><option value="atrasado" ${entry.status==='atrasado'?'selected':''}>Atrasado</option></select>${seiFields}</div>`;
                case 'amendments': return `<div class="modal-form-grid"><input id="f_number" class="app-input" placeholder="Nº Aditivo" value="${entry.number || ''}"><select id="f_type" class="app-select"><option value="valor">Valor</option><option value="prazo">Prazo</option><option value="misto">Misto</option></select><input type="date" id="f_date" value="${entry.date||today}"><input type="number" step="0.01" id="f_value_change" placeholder="Variação de Valor (+/-)" value="${entry.value_change||''}"><input type="date" id="f_new_end_date" placeholder="Nova Vigência" value="${entry.new_end_date||''}"><textarea id="f_object" class="app-textarea form-grid-full" placeholder="Objeto">${entry.object||''}</textarea>${seiFields}</div>`;
                case 'invoices': return `<div class="modal-form-grid"><input id="f_number" placeholder="Nº NF" value="${entry.number||''}"><input type="number" step="0.01" id="f_value" placeholder="Valor (R$)" value="${entry.value||''}"><label>Emissão</label><label>Atesto</label><input type="date" id="f_date_issue" title="Data de Emissão" value="${entry.date_issue||today}"><input type="date" id="f_date_attested" title="Data de Atesto" value="${entry.date_attested||''}"><label>Vencimento</label><label>Pagamento</label><input type="date" id="f_date_due" title="Data de Vencimento" value="${entry.date_due||''}"><input type="date" id="f_date_payment" title="Data de Pagamento" value="${entry.date_payment||''}"><select id="f_status" class="form-grid-full"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="atestado" ${entry.status==='atestado'?'selected':''}>Atestado</option><option value="pago" ${entry.status==='pago'?'selected':''}>Pago</option><option value="cancelado" ${entry.status==='cancelado'?'selected':''}>Cancelado</option></select>${seiFields}</div>`;
                default: return `Formulário não encontrado para o tipo: ${type}.`;
            }
        },

        handleModalSave: function() {
            const { mode, type, id } = this.currentModal;
            const dataArrayName = type;
            if (!this.data[dataArrayName]) this.data[dataArrayName] = [];
            
            let entry = (mode === 'edit') ? this.data[dataArrayName].find(e => e.id === id) : { id: generateId(type) };
            if (!entry) { showNotification("Erro: item não encontrado para edição.", 4000, 'error'); return; }

            const form = this.ui.modal.body;
            const getVal = (fieldId) => form.querySelector(`#f_${fieldId}`)?.value;
            const getFloat = (fieldId) => parseFloat(getVal(fieldId)) || 0;
            const seiData = { sei_number: getVal('sei_number'), sei_link: getVal('sei_link') };

            switch(type) {
                case 'items': Object.assign(entry, { numeroSiad: getVal('numeroSiad'), descricao: getVal('descricao'), valorFinanceiro: getFloat('valorFinanceiro') }); break;
                case 'financial': Object.assign(entry, { date: getVal('date'), type: getVal('type'), value: getFloat('value'), description: getVal('description'), ...seiData }); break;
                case 'physical': const item = this.data.items.find(i => i.id === getVal('itemId')); Object.assign(entry, { itemId: getVal('itemId'), item: item ? item.descricao : 'Item inválido', date_planned: getVal('date_planned'), date_done: getVal('date_done'), status: getVal('status'), ...seiData }); break;
                case 'amendments': const newEndDate = getVal('new_end_date'); Object.assign(entry, { number: getVal('number'), type: getVal('type'), date: getVal('date'), value_change: getFloat('value_change'), new_end_date: newEndDate, object: getVal('object'), ...seiData }); if (newEndDate) { this.data.details.vigenciaAtual = newEndDate; }; break;
                case 'invoices': const attested = getVal('date_attested'), payment = getVal('date_payment'); let status = getVal('status'); if(payment) status='pago'; else if(attested) status='atestado'; Object.assign(entry, { number:getVal('number'), value:getFloat('value'), date_issue:getVal('date_issue'), date_attested:attested, date_due:getVal('date_due'), date_payment:payment, status, ...seiData }); break;
            }

            if (mode === 'add') this.data[dataArrayName].push(entry);
            
            this.renderAll();
            this.closeModal();
        },

        handleTableAction: function(e, tableType) {
            const row = e.target.closest('tr');
            if (!row) return;

            const editBtn = e.target.closest('button[data-action="edit"]');
            const deleteBtn = e.target.closest('button[data-action="delete"]');

            if(editBtn) this.openModal('edit', tableType, row.dataset.id);
            if(deleteBtn) {
                const itemType = this.getItemTypeName(tableType);
                if (confirm(`Tem certeza que deseja excluir este ${itemType}?`)) {
                    this.data[tableType] = this.data[tableType].filter(item => item.id !== row.dataset.id);
                    this.renderAll();
                }
            }
        },
        
        getItemTypeName: function(type) {
            const names = {
                items: 'item',
                financial: 'lançamento financeiro',
                physical: 'marco físico',
                amendments: 'aditivo',
                invoices: 'nota fiscal'
            };
            return names[type] || 'item';
        },

        calculateFinancials: function() {
            let empenhado=0, liquidado=0, pago=0;
            (this.data.financial || []).forEach(f => {
                const v = f.value || 0;
                if(f.type==='empenho') empenhado += v;
                else if(f.type==='liquidacao') liquidado += v;
                else if(f.type==='pagamento') pago += v;
                else if(f.type==='anulacao') empenhado -= v;
            });
            return { totalValue: this.data.details.valorGlobal || 0, empenhado, liquidado, pago };
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
                if(days<0) dashboard.kpiDaysLeft.classList.add('kpi-danger');
                else if(days<=60) dashboard.kpiDaysLeft.classList.add('kpi-warn');
                else dashboard.kpiDaysLeft.classList.add('kpi-good');
            } else {
                dashboard.kpiDaysLeft.textContent = '-';
            }

            const pending = (physical || []).filter(p => p.status !== 'concluido').length;
            dashboard.kpiPendingDeliveries.textContent = pending;
            dashboard.kpiPendingDeliveries.className = 'kpi-value ' + (pending > 0 ? 'kpi-warn' : 'kpi-good');

            const late = (invoices || []).filter(i => i.status !== 'pago' && i.date_due && (new Date(i.date_due + "T23:59:59") < today)).length;
            dashboard.kpiOverduePayments.textContent = late;
            dashboard.kpiOverduePayments.className = 'kpi-value ' + (late > 0 ? 'kpi-danger' : 'kpi-good');

            const fin = this.calculateFinancials();
            const finData=[{l:'Pago',v:fin.pago,c:'#28a745'}, {l:'A Pagar',v:fin.liquidado-fin.pago,c:'#ffc107'}, {l:'A Liquidar',v:fin.empenhado-fin.liquidado,c:'#17a2b8'}, {l:'Saldo a Empenhar',v:fin.totalValue-fin.empenhado,c:'#6c757d'}].filter(d=>d.v>0.005);
            this._createDoughnutChart(dashboard.financialChart, dashboard.financialChartLegend, finData, formatCurrency(fin.totalValue));

            const physStatus=(physical||[]).reduce((acc,p)=>{acc[p.status]=(acc[p.status]||0)+1;return acc;},{});
            const physData=[{l:'Concluído',v:physStatus.concluido||0,c:'#28a745'},{l:'Andamento',v:physStatus.andamento||0,c:'#17a2b8'},{l:'Pendente',v:physStatus.pendente||0,c:'#ffc107'},{l:'Atrasado',v:physStatus.atrasado||0,c:'#dc3545'}].filter(d=>d.v>0);
            this._createDoughnutChart(dashboard.physicalChart, dashboard.physicalChartLegend, physData, `${(physical||[]).length} Itens`);
        },

        _createDoughnutChart: function(svgContainer, legendContainer, data, centerLabel) {
            svgContainer.innerHTML=''; legendContainer.innerHTML='';
            const total = data.reduce((s, item) => s + item.v, 0);
            if(total === 0){ svgContainer.innerHTML = '<p style="text-align:center; margin-top:50px;">Sem dados para exibir.</p>'; return; }

            const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            const r=45, ir=28; let startAngle = -Math.PI/2;

            data.forEach(item => {
                const angle = (item.v / total) * 2 * Math.PI;
                const endAngle = startAngle + angle;
                if(angle === 0) return;
                
                const [x1,y1] = [50 + r * Math.cos(startAngle), 50 + r * Math.sin(startAngle)];
                const [x2,y2] = [50 + r * Math.cos(endAngle),   50 + r * Math.sin(endAngle)];
                const [ix1,iy1] = [50 + ir * Math.cos(startAngle), 50 + ir * Math.sin(startAngle)];
                const [ix2,iy2] = [50 + ir * Math.cos(endAngle),   50 + ir * Math.sin(endAngle)];
                const largeArcFlag = angle > Math.PI ? 1 : 0;
                
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`);
                path.setAttribute("fill", item.c);
                svg.appendChild(path);
                
                const isCurrency = item.l.includes('Pago') || item.l.includes('Pagar') || item.l.includes('Liquidar') || item.l.includes('Saldo');
                const valueDisplay = isCurrency ? formatCurrency(item.v) : item.v;

                legendContainer.innerHTML += `<li><span class="legend-label"><span class="legend-color" style="background-color:${item.c};"></span>${item.l}</span><span class="legend-value">${valueDisplay}</span></li>`;
                startAngle = endAngle;
            });
            
            const text = document.createElementNS("http://www.w3.org/2000/svg","text");
            text.setAttribute("x","50"); text.setAttribute("y","50"); text.setAttribute("text-anchor","middle"); text.setAttribute("dominant-baseline","middle");
            text.classList.add('doughnut-center-text'); text.textContent = centerLabel;
            svg.appendChild(text);

            svgContainer.appendChild(svg);
        },

        cleanup: function() {
            if (this.themeObserver) {
                this.themeObserver.disconnect();
            }
        }
    };
    
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}

// ===================================================================================
// #endregion
// ===================================================================================
// #region MAIN CONTRACT MANAGER / DASHBOARD
// ===================================================================================

export function openContractManager() {
    const uniqueSuffix = generateId('contract_manager');
    const winId = window.windowManager.createWindow('Gestão de Contratos 5.2', '', { 
        width: '1400px', 
        height: '900px', 
        appType: 'contract-manager' 
    });
    
    const content = `
    <div class="app-toolbar">${getStandardAppToolbarHTML({ export: true })}</div>
    <div class="contract-manager-container" id="managerContainer_${uniqueSuffix}">
        <div class="contract-dashboard">
            <div class="dashboard-header">
                <h3><i class="fas fa-chart-line"></i> Dashboard de Contratos</h3>
                <div class="dashboard-filters">
                    <select id="timeFilter_${uniqueSuffix}" class="app-select">
                        <option value="30">Vencem nos próximos 30 dias</option>
                        <option value="90">Vencem nos próximos 90 dias</option>
                        <option value="365">Vencem no próximo ano</option>
                        <option value="all" selected>Todos</option>
                    </select>
                    <button id="refreshDashboard_${uniqueSuffix}" class="app-button" title="Atualizar Dashboard"><i class="fas fa-sync-alt"></i></button>
                </div>
            </div>
            
            <div class="dashboard-controls">
                <div class="search-box">
                    <input type="text" id="searchContracts_${uniqueSuffix}" placeholder="Buscar contratos...">
                    <i class="fas fa-search"></i>
                </div>
                <select id="statusFilter_${uniqueSuffix}" class="app-select">
                    <option value="all">Todos status</option>
                    <option value="ativo">Ativos</option>
                    <option value="suspenso">Suspensos</option>
                    <option value="concluido">Concluídos</option>
                    <option value="encerrado">Encerrados</option>
                    <option value="cancelado">Cancelados</option>
                </select>
            </div>
            
            <div class="dashboard-cards">
                <div class="dashboard-card">
                    <div class="card-value" id="totalValue_${uniqueSuffix}">R$ 0,00</div>
                    <div class="card-label">Valor Total dos Contratos</div>
                    <div class="card-icon"><i class="fas fa-money-bill-wave"></i></div>
                </div>
                <div class="dashboard-card">
                    <div class="card-value" id="activeContracts_${uniqueSuffix}">0</div>
                    <div class="card-label">Contratos Ativos</div>
                    <div class="card-icon"><i class="fas fa-file-contract"></i></div>
                </div>
                <div class="dashboard-card">
                    <div class="card-value" id="expiringSoon_${uniqueSuffix}">0</div>
                    <div class="card-label">Vencem em 30 dias</div>
                    <div class="card-icon"><i class="fas fa-exclamation-triangle"></i></div>
                </div>
                 <div class="dashboard-card">
                    <div class="card-value" id="totalContracts_${uniqueSuffix}">0</div>
                    <div class="card-label">Total de Contratos</div>
                    <div class="card-icon"><i class="fas fa-folder-open"></i></div>
                </div>
            </div>
            
            <div class="dashboard-charts">
                <div class="chart-wrapper-main">
                    <h4>Valor por Contrato</h4>
                    <canvas id="financialChart_${uniqueSuffix}"></canvas>
                </div>
                <div class="chart-wrapper-main">
                    <h4>Distribuição por Status</h4>
                    <canvas id="statusChart_${uniqueSuffix}"></canvas>
                </div>
            </div>
            
            <div class="contracts-list">
                <div class="list-header">
                    <h4><i class="fas fa-list"></i> Lista de Contratos</h4>
                    <button id="addContractBtn_${uniqueSuffix}" class="app-button primary">
                        <i class="fas fa-plus"></i> Novo Contrato
                    </button>
                </div>
                <div class="table-container">
                    <table class="app-table" id="contractsTable_${uniqueSuffix}">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Contratada</th>
                                <th>Valor Global</th>
                                <th>Status</th>
                                <th>Vencimento</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                
                <div class="pagination-controls">
                    <button id="prevPage_${uniqueSuffix}" class="app-button secondary" disabled>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span id="pageInfo_${uniqueSuffix}">Página 1 de 1</span>
                    <button id="nextPage_${uniqueSuffix}" class="app-button secondary" disabled>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
        
    <style>
        .contract-manager-container { display: flex; flex-direction: column; height: 100%; padding: 15px; background: var(--window-bg); color: var(--text-color); }
        .contract-dashboard { display: flex; flex-direction: column; gap: 20px; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--separator-color); }
        .dashboard-filters { display: flex; gap: 10px; }
        .dashboard-controls { display: flex; gap: 15px; margin-bottom: 20px; }
        .search-box { position: relative; flex: 1; }
        .search-box input { padding-left: 35px; width: 100%; }
        .search-box i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #718096; }
        .dashboard-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; }
        .dashboard-card { background: var(--toolbar-bg); border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative; overflow: hidden; border-left: 4px solid #3498db; }
        .dashboard-card:nth-child(2) { border-left-color: #2ecc71; }
        .dashboard-card:nth-child(3) { border-left-color: #f39c12; }
        .dashboard-card:nth-child(4) { border-left-color: #9b59b6; }
        .card-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .card-label { color: #718096; font-size: 14px; }
        .card-icon { position: absolute; top: 15px; right: 15px; font-size: 24px; color: #e2e8f0; }
        .dark-mode .card-icon { color: #4a5568; }
        .dark-mode .card-label { color: #a0aec0; }
        .dashboard-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .chart-wrapper-main { background: var(--toolbar-bg); border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .chart-wrapper-main h4 { margin-top: 0; margin-bottom: 15px; text-align: center; }
        .contracts-list { background: var(--toolbar-bg); border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
        
        /* Responsive styles */
        @media (max-width: 1200px) {
            .dashboard-charts {
                grid-template-columns: 1fr;
            }
        }
        @media (max-width: 768px) {
            .dashboard-cards {
                grid-template-columns: 1fr 1fr;
            }
            .dashboard-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            .dashboard-controls {
                flex-direction: column;
                gap: 10px;
            }
        }
        @media (max-width: 480px) {
            .dashboard-cards {
                grid-template-columns: 1fr;
            }
            .list-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    </style>`;
    
    const winData = window.windowManager.windows.get(winId);
    if (!winData) return winId;
    
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId,
        appDataType: 'contract-manager_v5.2',
        contracts: [],
        charts: {},
        themeObserver: null,
        currentPage: 0,
        pageSize: 10,
        ui: {
            container: document.getElementById(`managerContainer_${uniqueSuffix}`),
            totalValue: document.getElementById(`totalValue_${uniqueSuffix}`),
            activeContracts: document.getElementById(`activeContracts_${uniqueSuffix}`),
            expiringSoon: document.getElementById(`expiringSoon_${uniqueSuffix}`),
            totalContracts: document.getElementById(`totalContracts_${uniqueSuffix}`),
            financialChart: document.getElementById(`financialChart_${uniqueSuffix}`),
            statusChart: document.getElementById(`statusChart_${uniqueSuffix}`),
            contractsTable: document.getElementById(`contractsTable_${uniqueSuffix}`).querySelector('tbody'),
            addContractBtn: document.getElementById(`addContractBtn_${uniqueSuffix}`),
            refreshBtn: document.getElementById(`refreshDashboard_${uniqueSuffix}`),
            timeFilter: document.getElementById(`timeFilter_${uniqueSuffix}`),
            searchInput: document.getElementById(`searchContracts_${uniqueSuffix}`),
            statusFilter: document.getElementById(`statusFilter_${uniqueSuffix}`),
            prevPageBtn: document.getElementById(`prevPage_${uniqueSuffix}`),
            nextPageBtn: document.getElementById(`nextPage_${uniqueSuffix}`),
            pageInfo: document.getElementById(`pageInfo_${uniqueSuffix}`)
        },
        
        init: function() {
            setupAppToolbarActions(this);
            this.setupThemeObserver();
            this.loadSampleData();
            
            this.ui.addContractBtn.onclick = () => this.createNewContract();
            this.ui.refreshBtn.onclick = () => this.refreshDashboard();
            this.ui.timeFilter.onchange = () => this.renderContractsTable();
            this.ui.searchInput.oninput = () => this.renderContractsTable();
            this.ui.statusFilter.onchange = () => this.renderContractsTable();
            this.ui.prevPageBtn.onclick = () => this.changePage(-1);
            this.ui.nextPageBtn.onclick = () => this.changePage(1);
            
            this.renderDashboard();
        },
        
        setupThemeObserver: function() {
            const appContainer = this.ui.container;
            const applyTheme = () => {
                if(document.body.classList.contains('dark-mode')) {
                    appContainer.classList.add('dark-mode');
                } else {
                    appContainer.classList.remove('dark-mode');
                }
                if (this.charts.financial) this.renderCharts();
            };

            this.themeObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === 'class') {
                        applyTheme();
                    }
                });
            });

            this.themeObserver.observe(document.body, { attributes: true });
            applyTheme();
        },

        loadData: function(dataString, fileMeta) {
            try {
                const parsedData = JSON.parse(dataString);
                if (Array.isArray(parsedData)) {
                    this.contracts = parsedData;
                    this.fileId = fileMeta.id;
                    this.markClean();
                    window.windowManager.updateWindowTitle(this.winId, fileMeta.name);
                    this.renderDashboard();
                    showNotification("Lista de contratos carregada com sucesso.", 3000, "success");
                } else { throw new Error("O arquivo não contém uma lista de contratos válida."); }
            } catch (e) { showNotification(`Erro ao carregar arquivo: ${e.message}`, 5000, "error"); }
        },

        getData: function() { return this.contracts; },

        exportData: function() {
            const dataStr = JSON.stringify(this.contracts, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `contratos-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification("Dados exportados com sucesso!", 3000, "success");
        },

        loadSampleData: function() {
            this.contracts = [
                {
                    id: 'ctr-smp-001', details: { numeroContrato: 'CTR/2023/001', contratada: { nome: 'Empresa Fornecedora Ltda', cnpj: '11.222.333/0001-44' }, contratante: { nome: 'Ministério da Tecnologia', cnpj: '00.394.460/0001-41' }, valorGlobal: 150000, situacao: 'ativo', dataAssinatura: '2023-01-15', vigenciaAtual: '2025-01-14' },
                    items: [{ id: generateId('item'), descricao: 'Serviços de Consultoria', valorFinanceiro: 150000 }], financial: [], physical: [], amendments: [], invoices: []
                },
                {
                    id: 'ctr-smp-002', details: { numeroContrato: 'CTR/2023/045', contratada: { nome: 'Tech Solutions SA', cnpj: '55.666.777/0001-88' }, contratante: { nome: 'Secretaria de Educação', cnpj: '00.360.335/0001-00' }, valorGlobal: 230000, situacao: 'concluido', dataAssinatura: '2022-11-01', vigenciaAtual: '2023-12-31' },
                    items: [{ id: generateId('item'), descricao: 'Equipamentos de TI', valorFinanceiro: 230000 }], financial: [], physical: [], amendments: [], invoices: []
                }
            ];
        },
        
        getFilteredContracts: function() {
            const filter = this.ui.timeFilter.value;
            const statusFilter = this.ui.statusFilter.value;
            const searchTerm = this.ui.searchInput.value.toLowerCase();
            const today = new Date();
            
            let filtered = this.contracts;
            
            // Filter by expiration
            if (filter !== 'all') {
                const days = parseInt(filter, 10);
                const limitDate = new Date();
                limitDate.setDate(today.getDate() + days);
                filtered = filtered.filter(c => {
                    if (!c.details.vigenciaAtual) return false;
                    const endDate = new Date(c.details.vigenciaAtual + 'T23:59:59');
                    return endDate > today && endDate <= limitDate;
                });
            }
            
            // Filter by status
            if (statusFilter !== 'all') {
                filtered = filtered.filter(c => c.details.situacao === statusFilter);
            }
            
            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(c => 
                    (c.details.numeroContrato?.toLowerCase().includes(searchTerm) ||
                    (c.details.contratada.nome?.toLowerCase().includes(searchTerm)) ||
                    (c.details.contratante.nome?.toLowerCase().includes(searchTerm))));
            }
            
            return filtered;
        },
        
        changePage: function(delta) {
            this.currentPage += delta;
            this.renderContractsTable();
        },
        
        renderDashboard: function() {
            this.markDirty();
            const totalValue = this.contracts.reduce((sum, c) => sum + (c.details.valorGlobal || 0), 0);
            const activeContracts = this.contracts.filter(c => c.details.situacao === 'ativo').length;
            const expiringSoon = this.contracts.filter(c => {
                if (!c.details.vigenciaAtual) return false;
                const endDate = new Date(c.details.vigenciaAtual + 'T23:59:59');
                const today = new Date();
                const diffTime = endDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays > 0;
            }).length;
            
            this.ui.totalValue.textContent = formatCurrency(totalValue);
            this.ui.activeContracts.textContent = activeContracts;
            this.ui.expiringSoon.textContent = expiringSoon;
            this.ui.totalContracts.textContent = this.contracts.length;
            
            this.renderContractsTable();
            
            // Only render charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                this.renderCharts();
            } else {
                console.warn("Chart.js não está carregado. Os gráficos não serão renderizados.");
            }
        },
        
        renderContractsTable: function() {
            const tbody = this.ui.contractsTable;
            tbody.innerHTML = '';
            const filteredContracts = this.getFilteredContracts();
            const totalPages = Math.ceil(filteredContracts.length / this.pageSize);
            
            // Adjust current page if out of bounds
            if (this.currentPage >= totalPages && totalPages > 0) {
                this.currentPage = totalPages - 1;
            }
            
            const startIdx = this.currentPage * this.pageSize;
            const pageContracts = filteredContracts.slice(startIdx, startIdx + this.pageSize);
            
            // Update pagination controls
            this.ui.prevPageBtn.disabled = this.currentPage === 0;
            this.ui.nextPageBtn.disabled = this.currentPage >= totalPages - 1 || totalPages === 0;
            this.ui.pageInfo.textContent = totalPages > 0 
                ? `Página ${this.currentPage + 1} de ${totalPages}` 
                : 'Nenhum contrato encontrado';
            
            pageContracts.forEach(contract => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contract.details.numeroContrato || '-'}</td>
                    <td>${contract.details.contratada.nome || '-'}</td>
                    <td>${formatCurrency(contract.details.valorGlobal)}</td>
                    <td><span class="status-badge ${contract.details.situacao}">${this.getStatusText(contract.details.situacao)}</span></td>
                    <td>${contract.details.vigenciaAtual ? new Date(contract.details.vigenciaAtual + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    <td><button class="app-button small" data-action="edit" data-id="${contract.id}" title="Editar Contrato"><i class="fas fa-edit"></i></button></td>
                `;
                tbody.appendChild(row);
            });
            
            tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
                btn.onclick = () => this.editContract(btn.dataset.id);
            });
        },
        
        getStatusText: function(status) {
            const statusMap = { 'ativo': 'Ativo', 'suspenso': 'Suspenso', 'concluido': 'Concluído', 'encerrado': 'Encerrado', 'cancelado': 'Cancelado' };
            return statusMap[status] || status;
        },
        
        renderCharts: function() {
            if (typeof Chart === 'undefined') return;
            
            if (this.charts.financial) this.charts.financial.destroy();
            if (this.charts.status) this.charts.status.destroy();
            
            const isDarkMode = document.body.classList.contains('dark-mode');
            const textColor = isDarkMode ? '#e2e8f0' : '#666';
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const bgColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

            const contractValues = this.contracts.map(c => c.details.valorGlobal || 0);
            const contractNames = this.contracts.map(c => c.details.numeroContrato || 'Sem Número');
            const statusCounts = this.contracts.reduce((acc, c) => {
                const status = c.details.situacao || 'indefinido';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});
            
            this.charts.financial = new Chart(this.ui.financialChart, {
                type: 'bar',
                data: { 
                    labels: contractNames, 
                    datasets: [{ 
                        label: 'Valor do Contrato (R$)', 
                        data: contractValues, 
                        backgroundColor: 'rgba(54, 162, 235, 0.7)', 
                        borderColor: 'rgba(54, 162, 235, 1)', 
                        borderWidth: 1 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return formatCurrency(context.raw);
                                }
                            }
                        }
                    }, 
                    scales: { 
                        y: { 
                            ticks: { 
                                color: textColor, 
                                callback: (value) => formatCurrency(value) 
                            }, 
                            grid: { color: gridColor },
                            beginAtZero: true
                        }, 
                        x: { 
                            ticks: { 
                                color: textColor,
                                maxRotation: 45,
                                minRotation: 45
                            }, 
                            grid: { 
                                color: gridColor,
                                display: false
                            } 
                        } 
                    } 
                }
            });
            
            this.charts.status = new Chart(this.ui.statusChart, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusCounts).map(s => this.getStatusText(s)),
                    datasets: [{ 
                        data: Object.values(statusCounts), 
                        backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c', '#95a5a6', '#3498db', '#9b59b6'], 
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { 
                            position: 'top', 
                            labels: { 
                                color: textColor,
                                font: {
                                    size: 12
                                }
                            } 
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw} contrato(s)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        },

        handleContractSave: function(savedData) {
            try {
                const index = this.contracts.findIndex(c => c.id === savedData.id);
                if (index > -1) {
                    this.contracts[index] = savedData;
                    showNotification(`Contrato "${savedData.details.numeroContrato}" atualizado.`, 3000, "success");
                } else {
                    this.contracts.push(savedData);
                    showNotification(`Contrato "${savedData.details.numeroContrato}" criado.`, 3000, "success");
                }
                this.renderDashboard();
            } catch (error) {
                console.error("Erro ao salvar contrato:", error);
                showNotification(`Falha ao salvar contrato: ${error.message}`, 5000, "error");
            }
        },

        createNewContract: function() {
            const newContract = {
                id: generateId('ctr'),
                details: {
                    numeroContrato: `CTR/${new Date().getFullYear()}/NOVO`, 
                    situacao: 'ativo',
                    contratada: { nome: '', cnpj: ''}, 
                    contratante: { nome: '', cnpj: ''},
                    valorGlobal: 0, 
                    dataAssinatura: new Date().toISOString().split('T')[0],
                    vigenciaAtual: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
                },
                items: [], financial: [], physical: [], amendments: [], invoices: []
            };
            openContractDetailEditor(newContract, null, (data) => this.handleContractSave(data));
        },

        editContract: function(contractId) {
            const contractData = this.contracts.find(c => c.id === contractId);
            if (contractData) {
                openContractDetailEditor(contractData, null, (data) => this.handleContractSave(data));
            } else {
                showNotification(`Erro: Contrato com ID ${contractId} não encontrado.`, 4000, 'error');
            }
        },
        
        refreshDashboard: function() {
            this.renderDashboard();
            showNotification('Dashboard atualizado.', 2000, 'info');
        },

        cleanup: function() {
            if (this.themeObserver) {
                this.themeObserver.disconnect();
            }
            if(this.charts.financial) this.charts.financial.destroy();
            if(this.charts.status) this.charts.status.destroy();
        }
    };
    
    initializeFileState(appState, 'Meus Contratos', 'contracts.clist', 'contract-manager');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
// ===================================================================================
// #endregion
