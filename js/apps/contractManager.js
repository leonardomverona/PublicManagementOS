/**
 * @module ContractManagerCombined
 * @description A comprehensive contract management application for a virtual OS.
 * This module merges a dashboard-centric list view with a detailed, tabbed contract editor view.
 *
 * @version 7.0 - "Catalina Clean" (Major UI/UX Overhaul). Redesigned the contract
 * editor with a modern, single-pane layout for improved simplicity and usability.
 * Replaced collapsible sections with clear, open sections and introduced a cleaner,
 * integrated tab navigation style.
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
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
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
// #region CONTRACT DETAIL EDITOR (Catalina Clean Redesign)
// ===================================================================================

export function openContractDetailEditor(initialData, fileId, onSaveCallback) {
    const uniqueSuffix = generateId('contract_detail');
    const windowTitle = `Editor de Contrato - ${initialData.details.numeroContrato || 'Novo Contrato'}`;
    const winId = window.windowManager.createWindow(windowTitle, '', { width: '1200px', height: '900px', appType: 'contract-editor' });

    const content = `
    <style>
        /* Catalina Clean Theme Variables */
        :root {
            --radius-large: 12px; --radius-medium: 8px; --radius-small: 6px;
            --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            
            /* Light Mode */
            --accent-primary-light: #007aff; --accent-secondary-light: #e9e9eb; --divider-light: #e5e5ea;
            --text-primary-light: #1d1d1f; --text-secondary-light: #6e6e73; --text-tertiary-light: #8e8e93;
            --bg-window-light: #f5f5f7; --bg-content-light: #ffffff;
            --glass-bg-light: rgba(248, 248, 250, 0.8); --glass-border-light: rgba(230, 230, 235, 0.9);
            --shadow-color-light: rgba(0, 0, 0, 0.05);
        }
        .dark-mode {
             /* Dark Mode */
            --accent-primary-dark: #0a84ff; --accent-secondary-dark: #3a3a3c; --divider-dark: #444446;
            --text-primary-dark: #f5f5f7; --text-secondary-dark: #8e8e93; --text-tertiary-dark: #636366;
            --bg-window-dark: #1c1c1e; --bg-content-dark: #2c2c2e;
            --glass-bg-dark: rgba(40, 40, 42, 0.7); --glass-border-dark: rgba(60, 60, 60, 0.8);
            --shadow-color-dark: rgba(0, 0, 0, 0.2);
        }
        
        /* Main Container */
        .contract-editor-v7 {
            display: flex; flex-direction: column; height: 100%; overflow-y: auto;
            background-color: var(--bg-window-light); font-family: var(--font-main);
            color: var(--text-primary-light); padding: 0 25px;
            position: relative;
        }
        .dark-mode .contract-editor-v7 { background-color: var(--bg-window-dark); color: var(--text-primary-dark); }

        /* Header */
        .editor-header-v7 {
            padding: 20px 0; display: flex; align-items: center; gap: 20px;
            border-bottom: 1px solid var(--divider-light);
        }
        .dark-mode .editor-header-v7 { border-bottom: 1px solid var(--divider-dark); }
        .editor-header-v7 h1 { font-size: 1.8em; margin: 0; flex-grow: 1; }
        .editor-header-v7 .app-select { width: 150px; font-weight: 500; }

        /* Sections */
        .editor-section-v7 { padding: 25px 0; border-bottom: 1px solid var(--divider-light); }
        .dark-mode .editor-section-v7 { border-bottom: 1px solid var(--divider-dark); }
        .editor-section-v7:last-of-type { border-bottom: none; }
        .section-title-v7 {
            font-size: 1.3em; font-weight: 600; margin: 0 0 20px 0;
            color: var(--text-primary-light);
        }
        .dark-mode .section-title-v7 { color: var(--text-primary-dark); }
        
        .form-grid-v7 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px 25px;
        }
        .form-grid-v7 .form-grid-full { grid-column: 1 / -1; }
        .form-grid-v7 label {
            display: block; font-size: 0.9em; font-weight: 500;
            color: var(--text-secondary-light); margin-bottom: 8px;
        }
        .dark-mode .form-grid-v7 label { color: var(--text-secondary-dark); }

        /* Tabs */
        .contract-tabs-v7 {
            display: flex; gap: 25px;
            border-bottom: 1px solid var(--divider-light);
        }
        .dark-mode .contract-tabs-v7 { border-bottom: 1px solid var(--divider-dark); }
        .tab-button-v7 {
            background: none; border: none; cursor: pointer;
            padding: 15px 5px; font-size: 1em; font-weight: 500;
            color: var(--text-secondary-light);
            border-bottom: 2px solid transparent;
            transition: color 0.2s, border-color 0.2s;
        }
        .dark-mode .tab-button-v7 { color: var(--text-secondary-dark); }
        .tab-button-v7:hover { color: var(--text-primary-light); }
        .dark-mode .tab-button-v7:hover { color: var(--text-primary-dark); }
        .tab-button-v7.active {
            color: var(--accent-primary-light);
            border-bottom-color: var(--accent-primary-light);
        }
        .dark-mode .tab-button-v7.active {
            color: var(--accent-primary-dark);
            border-bottom-color: var(--accent-primary-dark);
        }
        .tab-button-v7 i { margin-right: 8px; }

        .tab-content-v7 {
            padding: 25px;
            margin-top: -1px; /* Overlap the border */
            background: var(--glass-bg-light);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid var(--glass-border-light);
            border-top: none;
            border-radius: 0 0 var(--radius-large) var(--radius-large);
        }
        .dark-mode .tab-content-v7 {
             background: var(--glass-bg-dark);
             border: 1px solid var(--glass-border-dark);
             border-top: none;
        }

        /* Modal Styles from v6.4, they are already good */
        @keyframes modal-pop-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; align-items: center; justify-content: center; z-index: 2000; -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); background: rgba(0,0,0,0.5); }
        .modal-content { animation: modal-pop-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); max-width: 750px; width: 95%; background-color: var(--bg-content-light); border-radius: var(--radius-large); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .dark-mode .modal-content { background-color: var(--bg-content-dark); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .modal-header { padding: 15px 20px; border-bottom: 1px solid var(--divider-light); display:flex; justify-content:space-between; align-items:center; }
        .dark-mode .modal-header { border-bottom: 1px solid var(--divider-dark); }
        .modal-body { padding: 25px 20px; }
        .modal-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .modal-form-grid label { display: block; font-size: 0.85em; font-weight: 500; color: var(--text-secondary-light); margin-bottom: 6px; }
        .dark-mode .modal-form-grid label { color: var(--text-secondary-dark); }
        .modal-footer { padding: 15px 20px; border-top: 1px solid var(--divider-light); display: flex; justify-content: flex-end; gap: 12px; }
        .dark-mode .modal-footer { border-top: 1px solid var(--divider-dark); }
    </style>
    <div class="app-toolbar">${getStandardAppToolbarHTML({ save: true, open: false, new: false })}</div>
    <div class="contract-editor-v7" id="editorContainer_${uniqueSuffix}">
        
        <header class="editor-header-v7">
            <h1 id="contractTitle_${uniqueSuffix}">Carregando...</h1>
            <select data-field="situacao" class="app-select">
                <option value="ativo">Ativo</option><option value="suspenso">Suspenso</option>
                <option value="concluido">Concluído</option><option value="encerrado">Encerrado</option>
                <option value="cancelado">Cancelado</option>
            </select>
        </header>

        <main class="editor-main-content-v7">
            <section class="editor-section-v7">
                <h2 class="section-title-v7">Detalhes do Contrato</h2>
                <div class="form-grid-v7">
                    <div><label for="f_numeroContrato">Número do Contrato</label><input id="f_numeroContrato" type="text" data-field="numeroContrato" class="app-input" placeholder="Contrato Nº"></div>
                    <div class="form-grid-full"><label for="f_tipo">Tipo de Contrato</label><input id="f_tipo" type="text" data-field="tipo" class="app-input" placeholder="Ex: Prestação de Serviço"></div>
                    <div class="form-grid-full"><label for="f_objeto">Objeto</label><textarea id="f_objeto" data-field="objeto" class="app-textarea" placeholder="Objeto do Contrato"></textarea></div>
                    <div><label for="f_modalidade">Modalidade Licitação</label><input id="f_modalidade" type="text" data-field="modalidade" class="app-input" placeholder="Modalidade"></div>
                    <div><label for="f_dotacao">Dotação Orçamentária</label><input id="f_dotacao" type="text" data-field="dotacao" class="app-input" placeholder="Dotação"></div>
                    <div><label for="f_dataAssinatura">Data de Assinatura</label><input id="f_dataAssinatura" type="date" data-field="dataAssinatura" class="app-input"></div>
                    <div><label for="f_vigenciaInicial">Vigência Inicial</label><input id="f_vigenciaInicial" type="date" data-field="vigenciaInicial" class="app-input"></div>
                    <div><label for="f_vigenciaAtual">Vigência Atual</label><input id="f_vigenciaAtual" type="date" data-field="vigenciaAtual" class="app-input"></div>
                    <div id="mainSeiContainer_${uniqueSuffix}" class="form-grid-full"></div>
                </div>
            </section>

            <section class="editor-section-v7">
                <h2 class="section-title-v7">Partes Envolvidas</h2>
                <div class="form-grid-v7">
                    <div class="form-grid-full"><b>Contratante</b></div>
                    <div><label>Nome</label><input type="text" data-field="contratante.nome" class="app-input" placeholder="Nome da Contratante"></div>
                    <div><label>CNPJ</label><input type="text" data-field="contratante.cnpj" class="app-input" placeholder="CNPJ da Contratante"></div>
                    <div class="form-grid-full"><b>Contratada</b></div>
                    <div><label>Nome</label><input type="text" data-field="contratada.nome" class="app-input" placeholder="Nome da Contratada"></div>
                    <div><label>CNPJ</label><input type="text" data-field="contratada.cnpj" class="app-input" placeholder="CNPJ da Contratada"></div>
                </div>
            </section>

            <section class="editor-section-v7">
                <h2 class="section-title-v7">Responsáveis</h2>
                <div class="form-grid-v7">
                     <div class="form-grid-full"><b>Gestor do Contrato</b></div>
                     <div><label>Nome do Gestor</label><input type="text" data-field="gestor.nome" class="app-input" placeholder="Nome Completo"></div>
                     <div><label>MASP</label><input type="text" data-field="gestor.masp" class="app-input" placeholder="MASP"></div>
                     <div><label>Setor</label><input type="text" data-field="gestor.setor" class="app-input" placeholder="Setor de Lotação"></div>
                     <div class="form-grid-full"><b>Fiscal do Contrato</b></div>
                     <div class="form-grid-full"><label>Nome do Fiscal</label><input type="text" data-field="fiscal.nome" class="app-input" placeholder="Nome Completo"></div>
                </div>
            </section>

             <section class="editor-section-v7">
                <h2 class="section-title-v7">Execução Contratual</h2>
                <nav class="contract-tabs-v7">
                    <button class="tab-button-v7 active" data-tab="dashboard"><i class="fas fa-chart-pie"></i> Dashboard</button>
                    <button class="tab-button-v7" data-tab="items"><i class="fas fa-list-ol"></i> Itens e Valores</button>
                    <button class="tab-button-v7" data-tab="financial"><i class="fas fa-coins"></i> Financeiro</button>
                    <button class="tab-button-v7" data-tab="physical"><i class="fas fa-tasks"></i> Físico</button>
                    <button class="tab-button-v7" data-tab="amendments"><i class="fas fa-file-medical"></i> Aditivos</button>
                    <button class="tab-button-v7" data-tab="invoices"><i class="fas fa-receipt"></i> Notas Fiscais</button>
                </nav>
                <div class="tab-content-v7" data-tab-content="dashboard"></div>
                <div class="tab-content-v7" data-tab-content="items" style="display:none;"></div>
                <div class="tab-content-v7" data-tab-content="financial" style="display:none;"></div>
                <div class="tab-content-v7" data-tab-content="physical" style="display:none;"></div>
                <div class="tab-content-v7" data-tab-content="amendments" style="display:none;"></div>
                <div class="tab-content-v7" data-tab-content="invoices" style="display:none;"></div>
            </section>
        </main>
    </div>
    <div class="modal-overlay" id="modalOverlay_${uniqueSuffix}">
        <div class="modal-content">
            <div class="modal-header"><h3 class="modal-title" id="modalTitle_${uniqueSuffix}"></h3><button class="modal-close" id="modalClose_${uniqueSuffix}">×</button></div>
            <div class="modal-body" id="modalBody_${uniqueSuffix}"></div>
            <div class="modal-footer"><button class="app-button secondary" id="modalCancelBtn_${uniqueSuffix}">Cancelar</button> <button class="app-button primary" id="modalSaveBtn_${uniqueSuffix}">Salvar</button></div>
        </div>
    </div>
    `;
    const dashboardHTML = `<div class="dashboard-grid">
        <div class="kpi-card"><div class="kpi-title">Vigência</div><div class="kpi-value kpi-good" id="kpiDaysLeft_${uniqueSuffix}">-</div><div class="kpi-subtext">Dias Restantes</div></div>
        <div class="kpi-card"><div class="kpi-title">Entregas</div><div class="kpi-value kpi-good" id="kpiPendingDeliveries_${uniqueSuffix}">0</div><div class="kpi-subtext">Pendentes</div></div>
        <div class="kpi-card"><div class="kpi-title">Pagamentos</div><div class="kpi-value kpi-good" id="kpiOverduePayments_${uniqueSuffix}">0</div><div class="kpi-subtext">Atrasados</div></div>
    </div>`;
    const itemsHTML = `<h3>Valor Global Atual: <span id="valorGlobalDisplay_${uniqueSuffix}">R$ 0,00</span></h3><button id="addItemBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Adicionar Item</button><div class="app-section"><h4>Itens do Contrato</h4><table class="app-table"><thead><tr><th>Nº SIAD</th><th>Descrição</th><th>Valor (R$)</th><th>Ações</th></tr></thead><tbody id="itemsTableBody_${uniqueSuffix}"></tbody></table></div>`;
    const financialHTML = `<button id="addFinancialBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Novo Lançamento</button><div class="app-section"><h4>Lançamentos Financeiros</h4><table class="app-table"><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="financialTableBody_${uniqueSuffix}"></tbody></table></div>`;
    const physicalHTML = `<button id="addPhysicalBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Novo Marco</button><div class="app-section"><h4>Marcos de Entrega</h4><table class="app-table"><thead><tr><th>Item</th><th>Previsto</th><th>Realizado</th><th>Status</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="physicalTableBody_${uniqueSuffix}"></tbody></table></div>`;
    const amendmentsHTML = `<button id="addAmendmentBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Novo Aditivo</button><div class="app-section"><h4>Termos Aditivos</h4><table class="app-table"><thead><tr><th>Nº</th><th>Tipo</th><th>Variação Valor</th><th>Nova Vigência</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="amendmentsTableBody_${uniqueSuffix}"></tbody></table></div>`;
    const invoicesHTML = `<button id="addInvoiceBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Nova NF</button><div class="app-section"><h4>Notas Fiscais</h4><table class="app-table"><thead><tr><th>Nº</th><th>Valor</th><th>Emissão</th><th>Vencimento</th><th>Status</th><th>Nº SEI</th><th>Ações</th></tr></thead><tbody id="invoicesTableBody_${uniqueSuffix}"></tbody></table></div>`;

    const winData = window.windowManager.windows.get(winId); 
    if (!winData) return winId; 
    const windowContent = winData.element.querySelector('.window-content');
    windowContent.innerHTML = content;
    
    const tabContentMap = { dashboard: dashboardHTML, items: itemsHTML, financial: financialHTML, physical: physicalHTML, amendments: amendmentsHTML, invoices: invoicesHTML };
    Object.keys(tabContentMap).forEach(key => { windowContent.querySelector(`[data-tab-content="${key}"]`).innerHTML = tabContentMap[key]; });
    
    const appState = {
        winId,
        appDataType: 'contract-editor_v7.0',
        data: {},
        onSaveCallback: onSaveCallback,
        themeObserver: null,
        ui: {
            container: windowContent.querySelector(`#editorContainer_${uniqueSuffix}`),
            contractTitle: windowContent.querySelector(`#contractTitle_${uniqueSuffix}`),
            valorGlobalDisplay: windowContent.querySelector(`#valorGlobalDisplay_${uniqueSuffix}`),
            mainSeiContainer: windowContent.querySelector(`#mainSeiContainer_${uniqueSuffix}`),
            tabButtons: windowContent.querySelectorAll('.tab-button-v7'),
            tabContents: windowContent.querySelectorAll('.tab-content-v7'),
            buttons: {
                addItem: windowContent.querySelector(`#addItemBtn_${uniqueSuffix}`),
                addFinancial: windowContent.querySelector(`#addFinancialBtn_${uniqueSuffix}`),
                addPhysical: windowContent.querySelector(`#addPhysicalBtn_${uniqueSuffix}`),
                addAmendment: windowContent.querySelector(`#addAmendmentBtn_${uniqueSuffix}`),
                addInvoice: windowContent.querySelector(`#addInvoiceBtn_${uniqueSuffix}`),
            },
            tables: {
                items: windowContent.querySelector(`#itemsTableBody_${uniqueSuffix}`),
                financial: windowContent.querySelector(`#financialTableBody_${uniqueSuffix}`),
                physical: windowContent.querySelector(`#physicalTableBody_${uniqueSuffix}`),
                amendments: windowContent.querySelector(`#amendmentsTableBody_${uniqueSuffix}`),
                invoices: windowContent.querySelector(`#invoicesTableBody_${uniqueSuffix}`),
            },
            dashboard: {
                kpiDaysLeft: windowContent.querySelector(`#kpiDaysLeft_${uniqueSuffix}`),
                kpiPendingDeliveries: windowContent.querySelector(`#kpiPendingDeliveries_${uniqueSuffix}`),
                kpiOverduePayments: windowContent.querySelector(`#kpiOverduePayments_${uniqueSuffix}`),
            },
            modal: {
                overlay: windowContent.querySelector(`#modalOverlay_${uniqueSuffix}`),
                content: windowContent.querySelector('.modal-content'),
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
            this.data = JSON.parse(JSON.stringify(data));
            this.renderAll(); 
        },

        init: function() {
            const toolbar = winData.element.querySelector('.app-toolbar');
            const saveBtn = toolbar.querySelector('.save-file-btn');
            if(saveBtn) saveBtn.onclick = () => this.saveChanges();
            
            this._registerEventListeners();
            this.loadData(initialData);
            this.setupThemeObserver(); 
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
            const applyTheme = () => {
                const isDark = document.body.classList.contains('dark-mode');
                this.ui.container.classList.toggle('dark-mode', isDark);
                this.ui.modal.content.classList.toggle('dark-mode', isDark);
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
                if (e.target.dataset.field && e.target.dataset.field.endsWith('.cnpj')) {
                    e.target.value = formatCNPJ(e.target.value);
                }
            };
            this.ui.container.addEventListener('input', this.eventHandlers.formInput);

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
            this.ui.container.addEventListener('blur', this.eventHandlers.cnpjBlur, true);

            this.eventHandlers.tabClick = (e) => {
                const tabButton = e.target.closest('.tab-button-v7');
                if (!tabButton) return;
                const tabName = tabButton.dataset.tab;
                this.ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.ui.tabContents.forEach(content => content.style.display = 'none');
                tabButton.classList.add('active');
                this.ui.container.querySelector(`[data-tab-content="${tabName}"]`).style.display = 'block';
            };
            this.ui.container.querySelector('.contract-tabs-v7').addEventListener('click', this.eventHandlers.tabClick);
            
            Object.keys(this.ui.buttons).forEach(key => {
                if (this.ui.buttons[key]) {
                    const type = key.replace('add', '').replace('Btn', '').toLowerCase();
                    this.ui.buttons[key].addEventListener('click', () => this.openModal('add', type));
                }
            });
            
            this.eventHandlers.tableClick = (e, type) => this.handleTableAction(e, type);
            Object.keys(this.ui.tables).forEach(type => {
                if(this.ui.tables[type]) {
                    this.ui.tables[type].addEventListener('click', (e) => this.eventHandlers.tableClick(e, type));
                }
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
            this.ui.container.querySelectorAll('[data-field]').forEach(input => {
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
            const title = this.data.details.numeroContrato || 'Novo Contrato';
            window.windowManager.updateWindowTitle(this.winId, `Editor de Contrato - ${title}`);
            this.ui.contractTitle.textContent = title;
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
            this.ui.container.querySelectorAll('[data-field]').forEach(input => {
                const keys = input.dataset.field.split('.');
                let value = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', this.data.details);
                if (input.dataset.field.endsWith('.cnpj')) {
                    value = formatCNPJ(value);
                }
                input.value = value;
            });
            const title = this.data.details.numeroContrato || 'Novo Contrato';
            this.ui.contractTitle.textContent = title;
            window.windowManager.updateWindowTitle(this.winId, `Editor de Contrato - ${title}`);
            this.renderMainSei();
        },
        
        renderMainSei: function() {
            const { numeroSei, linkSei } = this.data.details;
            let html = '';
            if (numeroSei) {
                html = `<div class="form-grid-full" style="margin-top: 20px;"><b>Processo SEI:</b> `;
                if (linkSei) {
                    html += `<a href="${linkSei}" target="_blank" title="Abrir processo no SEI">${numeroSei}</a>`;
                } else {
                    html += numeroSei;
                }
                html += '</div>';
            }
            this.ui.mainSeiContainer.innerHTML = html;
        },

        _renderTable: function(type, tableBody, columns) {
            if (!tableBody) return;
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
            if (this.ui.valorGlobalDisplay) {
                this.ui.valorGlobalDisplay.textContent = formatCurrency(globalTotal);
            }
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
            const seiFields = `
                <div class="form-grid-full">
                    <label for="f_sei_number">Nº Documento SEI</label>
                    <input id="f_sei_number" class="app-input" placeholder="Nº Documento SEI" value="${entry.sei_number || ''}">
                </div>
                <div class="form-grid-full">
                    <label for="f_sei_link">Link do Documento SEI</label>
                    <input id="f_sei_link" class="app-input" placeholder="Link do Documento SEI" value="${entry.sei_link || ''}">
                </div>`;
            const getItemOptions = (selectedId) => (this.data.items || []).map(i => `<option value="${i.id}" ${selectedId === i.id ? 'selected' : ''}>${i.descricao || '(Item sem descrição)'}</option>`).join('');

            switch(type) {
                case 'items': 
                    return `<div class="modal-form-grid">
                                <div><label for="f_numeroSiad">Nº SIAD</label><input id="f_numeroSiad" class="app-input" placeholder="Nº SIAD" value="${entry.numeroSiad || ''}"></div>
                                <div><label for="f_valorFinanceiro">Valor Financeiro (R$)</label><input type="number" step="0.01" id="f_valorFinanceiro" class="app-input" placeholder="R$ 0,00" value="${entry.valorFinanceiro || ''}"></div>
                                <div class="form-grid-full"><label for="f_descricao">Descrição</label><textarea id="f_descricao" class="app-textarea" placeholder="Descrição do item">${entry.descricao || ''}</textarea></div>
                            </div>`;
                case 'financial': 
                    return `<div class="modal-form-grid">
                                <div><label for="f_date">Data</label><input type="date" id="f_date" class="app-input" value="${entry.date || today}"></div>
                                <div><label for="f_type">Tipo</label><select id="f_type" class="app-select"><option value="empenho" ${entry.type === 'empenho'?'selected':''}>Empenho</option><option value="liquidacao" ${entry.type === 'liquidacao'?'selected':''}>Liquidação</option><option value="pagamento" ${entry.type === 'pagamento'?'selected':''}>Pagamento</option><option value="anulacao" ${entry.type === 'anulacao'?'selected':''}>Anulação</option></select></div>
                                <div class="form-grid-full"><label for="f_value">Valor (R$)</label><input type="number" step="0.01" id="f_value" class="app-input" placeholder="R$ 0,00" value="${entry.value || ''}"></div>
                                <div class="form-grid-full"><label for="f_description">Descrição</label><input id="f_description" class="app-input" placeholder="Descrição Opcional" value="${entry.description || ''}"></div>
                                ${seiFields}
                            </div>`;
                case 'physical': 
                    return `<div class="modal-form-grid">
                                <div class="form-grid-full"><label for="f_itemId">Item do Contrato</label><select id="f_itemId" class="app-select">${getItemOptions(entry.itemId)}</select></div>
                                <div><label for="f_date_planned">Data Prevista</label><input type="date" id="f_date_planned" class="app-input" title="Data Prevista" value="${entry.date_planned || ''}"></div>
                                <div><label for="f_date_done">Data Realizada</label><input type="date" id="f_date_done" class="app-input" title="Data Realizada" value="${entry.date_done || ''}"></div>
                                <div class="form-grid-full"><label for="f_status">Status</label><select id="f_status" class="app-select"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="andamento" ${entry.status==='andamento'?'selected':''}>Andamento</option><option value="concluido" ${entry.status==='concluido'?'selected':''}>Concluído</option><option value="atrasado" ${entry.status==='atrasado'?'selected':''}>Atrasado</option></select></div>
                                ${seiFields}
                            </div>`;
                case 'amendments': 
                    return `<div class="modal-form-grid">
                                <div><label for="f_number">Nº Aditivo</label><input id="f_number" class="app-input" placeholder="Nº Aditivo" value="${entry.number || ''}"></div>
                                <div><label for="f_type">Tipo</label><select id="f_type" class="app-select"><option value="valor">Valor</option><option value="prazo">Prazo</option><option value="misto">Misto</option></select></div>
                                <div><label for="f_date">Data</label><input type="date" id="f_date" class="app-input" value="${entry.date||today}"></div>
                                <div><label for="f_value_change">Variação de Valor (+/-)</label><input type="number" step="0.01" id="f_value_change" class="app-input" placeholder="R$ 0,00" value="${entry.value_change||''}"></div>
                                <div class="form-grid-full"><label for="f_new_end_date">Nova Vigência</label><input type="date" id="f_new_end_date" class="app-input" value="${entry.new_end_date||''}"></div>
                                <div class="form-grid-full"><label for="f_object">Objeto</label><textarea id="f_object" class="app-textarea" placeholder="Objeto do aditivo">${entry.object||''}</textarea></div>
                                ${seiFields}
                            </div>`;
                case 'invoices': 
                    return `<div class="modal-form-grid">
                                <div><label for="f_number">Nº NF</label><input id="f_number" class="app-input" placeholder="Nº NF" value="${entry.number||''}"></div>
                                <div><label for="f_value">Valor (R$)</label><input type="number" step="0.01" id="f_value" class="app-input" placeholder="R$ 0,00" value="${entry.value||''}"></div>
                                <div><label for="f_date_issue">Data de Emissão</label><input type="date" id="f_date_issue" class="app-input" title="Data de Emissão" value="${entry.date_issue||today}"></div>
                                <div><label for="f_date_attested">Data de Atesto</label><input type="date" id="f_date_attested" class="app-input" title="Data de Atesto" value="${entry.date_attested||''}"></div>
                                <div><label for="f_date_due">Data de Vencimento</label><input type="date" id="f_date_due" class="app-input" title="Data de Vencimento" value="${entry.date_due||''}"></div>
                                <div><label for="f_date_payment">Data de Pagamento</label><input type="date" id="f_date_payment" class="app-input" title="Data de Pagamento" value="${entry.date_payment||''}"></div>
                                <div class="form-grid-full"><label for="f_status">Status</label><select id="f_status" class="app-select"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="atestado" ${entry.status==='atestado'?'selected':''}>Atestado</option><option value="pago" ${entry.status==='pago'?'selected':''}>Pago</option><option value="cancelado" ${entry.status==='cancelado'?'selected':''}>Cancelado</option></select></div>
                                ${seiFields}
                            </div>`;
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
            
            this.updateDetailsFromUI();
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

        renderDashboard: function() {
            const { dashboard } = this.ui;
            if (!dashboard || !dashboard.kpiDaysLeft) return; 
            const { details, physical, invoices } = this.data;
            const today = new Date();
            today.setHours(0,0,0,0);

            if(details.vigenciaAtual){
                const end=new Date(details.vigenciaAtual + "T23:59:59"), days=Math.ceil((end - today)/864e5);
                dashboard.kpiDaysLeft.textContent = days;
                dashboard.kpiDaysLeft.className = 'kpi-value';
                if(days<0) dashboard.kpiDaysLeft.classList.add('kpi-danger');
                else if(days<=90) dashboard.kpiDaysLeft.classList.add('kpi-warn');
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
// #region MAIN CONTRACT MANAGER / DASHBOARD (REMAINS LARGELY UNCHANGED)
// ===================================================================================

export function openContractManager() {
    const uniqueSuffix = generateId('contract_manager');
    const winId = window.windowManager.createWindow('Gestão de Contratos 7.0', '', { 
        width: '1400px', 
        height: '900px', 
        appType: 'contract-manager' 
    });
    
    const content = `
    <style>
        /* Sonoma Glass Theme Variables */
        :root {
            --radius-large: 16px; --radius-medium: 12px; --radius-small: 8px;
            --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            
            /* Light Mode */
            --accent-primary-light: #007aff; --accent-secondary-light: #e9e9eb;
            --text-primary-light: #1d1d1f; --text-secondary-light: #6e6e73;
            --bg-window-light: #f5f5f7;
            --glass-bg-light: rgba(240, 240, 245, 0.6); --glass-border-light: rgba(255, 255, 255, 0.4);
            --shadow-color-light: rgba(0, 0, 0, 0.08);
        }
        .dark-mode {
             /* Dark Mode */
            --accent-primary-dark: #0a84ff; --accent-secondary-dark: #3a3a3c;
            --text-primary-dark: #f5f5f7; --text-secondary-dark: #8e8e93;
            --bg-window-dark: #1c1c1e;
            --glass-bg-dark: rgba(40, 40, 42, 0.7); --glass-border-dark: rgba(60, 60, 60, 0.5);
            --shadow-color-dark: rgba(0, 0, 0, 0.3);
        }
        
        /* Glassmorphism Effect */
        .glass-effect {
            background: var(--glass-bg-light);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid var(--glass-border-light);
            box-shadow: 0 4px 20px 0 var(--shadow-color-light);
            transition: all 0.3s ease;
        }
        .dark-mode .glass-effect {
            background: var(--glass-bg-dark);
            border: 1px solid var(--glass-border-dark);
            box-shadow: 0 4px 20px 0 var(--shadow-color-dark);
        }

        /* Main Layout: Sidebar + Content */
        .contract-manager-container { display: flex; height: 100%; font-family: var(--font-main); background: var(--bg-window-light); color: var(--text-primary-light); }
        .dark-mode .contract-manager-container { background: var(--bg-window-dark); color: var(--text-primary-dark); }
        
        .manager-sidebar {
            width: 280px; flex-shrink: 0; padding: 20px;
            display: flex; flex-direction: column; gap: 25px;
            overflow-y: auto;
        }

        .manager-main-content {
            flex: 1; padding: 20px;
            display: flex; flex-direction: column; gap: 20px;
            overflow-y: auto;
        }

        /* Sidebar Components */
        .sidebar-header h3 { margin: 0 0 5px 0; }
        .sidebar-header p { margin: 0; font-size: 14px; color: var(--text-secondary-light); }
        .dark-mode .sidebar-header p { color: var(--text-secondary-dark); }
        
        .sidebar-section { display: flex; flex-direction: column; gap: 10px; }
        .sidebar-section h4 { margin: 0 0 5px 0; font-size: 1em; }
        
        .kpi-card { padding: 15px; border-radius: var(--radius-medium); }
        .kpi-card:hover { transform: scale(1.03); box-shadow: 0 8px 25px 0 var(--shadow-color-light); }
        .dark-mode .kpi-card:hover { box-shadow: 0 8px 25px 0 var(--shadow-color-dark); }
        .kpi-label { font-size: 14px; color: var(--text-secondary-light); margin-bottom: 5px; }
        .dark-mode .kpi-label { color: var(--text-secondary-dark); }
        .kpi-value { font-size: 22px; font-weight: 600; }

        /* Main Content Components */
        .main-header { display: flex; justify-content: space-between; align-items: center; }
        .search-box { position: relative; width: 300px; }
        .search-box input { width: 100%; padding-left: 35px; }
        .search-box i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary-light); }
        .dark-mode .search-box i { color: var(--text-secondary-dark); }

        .dashboard-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .chart-wrapper-main { padding: 20px; border-radius: var(--radius-large); }
        .chart-wrapper-main h4 { margin: 0 0 15px 0; text-align: center; font-weight: 600; }
        
        .contracts-list-container { padding: 20px; border-radius: var(--radius-large); flex: 1; display: flex; flex-direction: column; }
        .list-table-wrapper { flex: 1; overflow-y: auto; }

        /* Table Redesign */
        .app-table { border-collapse: separate; border-spacing: 0 8px; width: 100%; }
        .app-table th { text-align: left; padding: 10px 15px; font-size: 13px; text-transform: uppercase; color: var(--text-secondary-light); }
        .dark-mode .app-table th { color: var(--text-secondary-dark); }
        .app-table tbody tr {
            background: var(--glass-bg-light); border-radius: var(--radius-small);
            box-shadow: 0 2px 5px var(--shadow-color-light); transition: all 0.2s ease-in-out;
        }
        .dark-mode .app-table tbody tr { background: var(--glass-bg-dark); box-shadow: 0 2px 5px var(--shadow-color-dark); }
        .app-table tbody tr:hover { transform: translateY(-2px); box-shadow: 0 4px 10px var(--shadow-color-light); }
        .dark-mode .app-table tbody tr:hover { box-shadow: 0 4px 10px var(--shadow-color-dark); }
        .app-table td { padding: 15px; border: none; vertical-align: middle; }
        .app-table td:first-child { border-radius: var(--radius-small) 0 0 var(--radius-small); }
        .app-table td:last-child { border-radius: 0 var(--radius-small) var(--radius-small) 0; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .app-table tbody tr { animation: fadeIn 0.5s ease-out; }

        .pagination-controls { text-align: center; padding-top: 15px; }

    </style>
    <div class="app-toolbar">${getStandardAppToolbarHTML({ export: true })}</div>
    <div class="contract-manager-container" id="managerContainer_${uniqueSuffix}">
        <!-- Sidebar -->
        <aside class="manager-sidebar glass-effect">
            <div class="sidebar-header">
                <h3>Dashboard</h3>
                <p>Visão geral dos contratos</p>
            </div>
            <div class="sidebar-section">
                <h4>Filtros</h4>
                <select id="timeFilter_${uniqueSuffix}" class="app-select">
                    <option value="all" selected>Todos os vencimentos</option>
                    <option value="30">Vencem em 30 dias</option>
                    <option value="90">Vencem em 90 dias</option>
                    <option value="365">Vencem no próximo ano</option>
                </select>
                <select id="statusFilter_${uniqueSuffix}" class="app-select">
                    <option value="all">Todos os status</option>
                    <option value="ativo">Ativos</option>
                    <option value="suspenso">Suspensos</option>
                    <option value="concluido">Concluídos</option>
                </select>
            </div>
            <div class="sidebar-section">
                <h4>Estatísticas Rápidas</h4>
                <div class="kpi-card glass-effect"><div class="kpi-label">Valor Total</div><div class="kpi-value" id="totalValue_${uniqueSuffix}">R$ 0,00</div></div>
                <div class="kpi-card glass-effect"><div class="kpi-label">Contratos Ativos</div><div class="kpi-value" id="activeContracts_${uniqueSuffix}">0</div></div>
                <div class="kpi-card glass-effect"><div class="kpi-label">Vencendo em 90 dias</div><div class="kpi-value" id="expiringSoon_${uniqueSuffix}">0</div></div>
                <div class="kpi-card glass-effect"><div class="kpi-label">Total de Contratos</div><div class="kpi-value" id="totalContracts_${uniqueSuffix}">0</div></div>
            </div>
             <button id="addContractBtn_${uniqueSuffix}" class="app-button primary" style="margin-top: auto;"><i class="fas fa-plus"></i> Novo Contrato</button>
        </aside>

        <!-- Main Content -->
        <main class="manager-main-content">
            <div class="main-header">
                <div class="search-box">
                    <input type="text" id="searchContracts_${uniqueSuffix}" class="app-input" placeholder="Buscar por número ou contratada...">
                    <i class="fas fa-search"></i>
                </div>
                <button id="refreshDashboard_${uniqueSuffix}" class="app-button secondary" title="Atualizar Dashboard"><i class="fas fa-sync-alt"></i></button>
            </div>

            <div class="dashboard-charts">
                <div class="chart-wrapper-main glass-effect"><h4>Valor por Contrato</h4><canvas id="financialChart_${uniqueSuffix}"></canvas></div>
                <div class="chart-wrapper-main glass-effect"><h4>Distribuição por Status</h4><canvas id="statusChart_${uniqueSuffix}"></canvas></div>
            </div>

            <div class="contracts-list-container glass-effect">
                <div class="list-table-wrapper">
                    <table class="app-table" id="contractsTable_${uniqueSuffix}">
                        <thead><tr><th>Número</th><th>Contratada</th><th>Valor Global</th><th>Status</th><th>Vencimento</th><th>Ações</th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>
                <div class="pagination-controls">
                    <button id="prevPage_${uniqueSuffix}" class="app-button secondary" disabled><i class="fas fa-chevron-left"></i></button>
                    <span id="pageInfo_${uniqueSuffix}">Página 1 de 1</span>
                    <button id="nextPage_${uniqueSuffix}" class="app-button secondary" disabled><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </main>
    </div>
    `;
    
    const winData = window.windowManager.windows.get(winId);
    if (!winData) return winId;
    
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId,
        appDataType: 'contract-manager_v7.0',
        contracts: [],
        charts: {},
        themeObserver: null,
        currentPage: 0,
        pageSize: 10,
        fileId: null,
        isDirty: false,
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
                const isDark = document.body.classList.contains('dark-mode');
                appContainer.classList.toggle('dark-mode', isDark);
                if (typeof Chart !== 'undefined' && this.charts.financial) {
                    this.renderCharts();
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

        getData: function() { return JSON.stringify(this.contracts, null, 2); },

        exportData: function() {
            const dataStr = this.getData();
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
        
        markDirty: function() { this.isDirty = true; },
        markClean: function() { this.isDirty = false; },

        loadSampleData: function() {
            this.contracts = [
                {
                    id: 'ctr-smp-001', details: { numeroContrato: 'CTR/2023/001', contratada: { nome: 'Empresa Fornecedora Ltda', cnpj: '11.222.333/0001-44' }, contratante: { nome: 'Ministério da Tecnologia', cnpj: '00.394.460/0001-41' }, valorGlobal: 150000, situacao: 'ativo', dataAssinatura: '2023-01-15', vigenciaAtual: new Date(new Date().setDate(new Date().getDate() + 85)).toISOString().split('T')[0] },
                    items: [{ id: generateId('item'), descricao: 'Serviços de Consultoria', valorFinanceiro: 150000 }], financial: [], physical: [], amendments: [], invoices: []
                },
                {
                    id: 'ctr-smp-002', details: { numeroContrato: 'CTR/2023/045', contratada: { nome: 'Tech Solutions SA', cnpj: '55.666.777/0001-88' }, contratante: { nome: 'Secretaria de Educação', cnpj: '00.360.335/0001-00' }, valorGlobal: 230000, situacao: 'concluido', dataAssinatura: '2022-11-01', vigenciaAtual: '2023-12-31' },
                    items: [{ id: generateId('item'), descricao: 'Equipamentos de TI', valorFinanceiro: 230000 }], financial: [], physical: [], amendments: [], invoices: []
                },
                 {
                    id: 'ctr-smp-003', details: { numeroContrato: 'CTR/2024/012', contratada: { nome: 'Inovações Construtivas', cnpj: '88.999.000/0001-12' }, contratante: { nome: 'Departamento de Infraestrutura', cnpj: '00.360.335/0001-00' }, valorGlobal: 580000, situacao: 'ativo', dataAssinatura: '2024-02-20', vigenciaAtual: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString().split('T')[0] },
                    items: [{ id: generateId('item'), descricao: 'Reforma Estrutural Bloco C', valorFinanceiro: 580000 }], financial: [], physical: [], amendments: [], invoices: []
                }
            ];
        },
        
        getFilteredContracts: function() {
            const filter = this.ui.timeFilter.value;
            const statusFilter = this.ui.statusFilter.value;
            const searchTerm = this.ui.searchInput.value.toLowerCase();
            const today = new Date();
            
            let filtered = this.contracts;
            
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
            
            if (statusFilter !== 'all') {
                filtered = filtered.filter(c => c.details.situacao === statusFilter);
            }
            
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
                return diffDays <= 90 && diffDays > 0;
            }).length;
            
            this.ui.totalValue.textContent = formatCurrency(totalValue);
            this.ui.activeContracts.textContent = activeContracts;
            this.ui.expiringSoon.textContent = expiringSoon;
            this.ui.totalContracts.textContent = this.contracts.length;
            
            this.renderContractsTable();
            
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
            
            if (this.currentPage >= totalPages && totalPages > 0) {
                this.currentPage = totalPages - 1;
            } else if (this.currentPage < 0) {
                this.currentPage = 0;
            }
            
            const startIdx = this.currentPage * this.pageSize;
            const pageContracts = filteredContracts.slice(startIdx, startIdx + this.pageSize);
            
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
            const textColor = isDarkMode ? '#f5f5f7' : '#1d1d1f';
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            const accentPrimary = isDarkMode ? '#0a84ff' : '#007aff';
            
            const ctx = this.ui.financialChart.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, accentPrimary);
            gradient.addColorStop(1, isDarkMode ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.2)');

            const contractValues = this.contracts.map(c => c.details.valorGlobal || 0);
            const contractNames = this.contracts.map(c => c.details.numeroContrato || 'Sem Número');
            const statusCounts = this.contracts.reduce((acc, c) => {
                const status = this.getStatusText(c.details.situacao || 'indefinido');
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
                        backgroundColor: gradient, 
                        borderColor: accentPrimary, 
                        borderWidth: 2,
                        borderRadius: 6,
                    }] 
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatCurrency(c.raw) } } }, 
                    scales: { 
                        y: { beginAtZero: true, ticks: { color: textColor, callback: (v) => `R$ ${v/1000}k` }, grid: { color: gridColor } }, 
                        x: { ticks: { color: textColor }, grid: { display: false } } 
                    } 
                }
            });
            
            this.charts.status = new Chart(this.ui.statusChart, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusCounts),
                    datasets: [{ 
                        data: Object.values(statusCounts), 
                        backgroundColor: ['#34c759', '#ff9500', '#ff3b30', '#8e8e93', '#007aff', '#5856d6'], 
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, cutout: '70%',
                    plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 12 } } } }
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
                openContractDetailEditor(JSON.parse(JSON.stringify(contractData)), null, (data) => this.handleContractSave(data));
            } else {
                showNotification(`Erro: Contrato com ID ${contractId} não encontrado.`, 4000, 'error');
            }
        },
        
        refreshDashboard: function() {
            const icon = this.ui.refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            this.renderDashboard();
            setTimeout(() => icon.classList.remove('fa-spin'), 500);
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
