import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2; let numeros = cnpj.substring(0, tamanho); let digitos = cnpj.substring(tamanho); let soma = 0; let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) { soma += numeros.charAt(tamanho - i) * pos--; if (pos < 2) pos = 9; }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11; if (resultado !== parseInt(digitos.charAt(0))) return false;
    tamanho++; numeros = cnpj.substring(0, tamanho); soma = 0; pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) { soma += numeros.charAt(tamanho - i) * pos--; if (pos < 2) pos = 9; }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11; return resultado === parseInt(digitos.charAt(1));
}

export function openContractManager() {
    const uniqueSuffix = generateId('contract_v4');
    const winId = window.windowManager.createWindow('Gestão de Contratos 4.0', '', { width: '1350px', height: '900px', appType: 'contract-manager' });
    
    // -- TEMPLATE HTML V4.0 --
    const content = `
    <style>
        .contract-container-v4{display:flex;flex-direction:column;height:100%;overflow:hidden}.main-content-v4{display:flex;flex:1;overflow:hidden}.main-form-column{width:480px;border-right:1px solid var(--separator-color);padding:10px;overflow-y:auto}.tabs-column{flex:1;display:flex;flex-direction:column;overflow:hidden}.contract-tracking-tabs-v4{display:flex;flex-shrink:0;border-bottom:1px solid var(--separator-color);background-color:var(--toolbar-bg)}.contract-tab-button{padding:10px 15px}.contract-tab-content-v4{flex:1;padding:15px;overflow-y:auto}.form-section{border:1px solid var(--separator-color);border-radius:8px;margin-bottom:15px}.form-section summary{font-weight:700;padding:10px;background-color:var(--toolbar-bg);cursor:pointer;border-radius:7px 7px 0 0;position:relative}.form-section[open] summary{border-bottom:1px solid var(--separator-color)}.form-section summary::marker{content:''}.form-section summary::after{content:'\\25B6';position:absolute;right:15px;transition:transform .2s}.form-section[open] summary::after{transform:rotate(90deg)}.form-section-content{padding:15px;display:grid;grid-template-columns:1fr 1fr;gap:10px 15px}.form-grid-full{grid-column:1 / -1}.app-table{table-layout:fixed;width:100%}.app-table th,.app-table td{word-wrap:break-word;padding:8px}.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2000;display:none;align-items:center;justify-content:center}.modal-content{background:var(--window-bg);padding:20px;border-radius:8px;width:90%;max-width:700px;box-shadow:0 5px 15px rgba(0,0,0,0.3)}.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:10px;border-bottom:1px solid var(--separator-color)}.modal-title{font-size:1.3em;font-weight:700}.modal-close{background:0 0;border:0;font-size:1.8em;cursor:pointer;line-height:1}.modal-form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px}.modal-footer{text-align:right;margin-top:25px;padding-top:15px;border-top:1px solid var(--separator-color)}.chart-container{display:flex;gap:20px;margin-top:20px;justify-content:space-around;flex-wrap:wrap}.chart-wrapper{display:flex;flex-direction:column;align-items:center;background-color:var(--window-bg);padding:15px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);width:48%;min-width:300px}.chart-wrapper svg{font-size:14px}.chart-wrapper .chart-title{font-weight:700;margin-bottom:10px;font-size:1.1em}.chart-legend{list-style:none;padding:0;margin-top:15px;width:100%}.chart-legend li{display:flex;align-items:center;margin-bottom:5px;font-size:.9em}.chart-legend .legend-color{width:12px;height:12px;border-radius:50%;margin-right:8px}.chart-legend .legend-label{color:var(--secondary-text-color)}.chart-legend .legend-value{margin-left:auto;font-weight:700}.doughnut-center-text{fill:var(--text-color);font-size:1.5em;font-weight:700}.kpi-card .kpi-value.kpi-good{color: #28a745;}.kpi-card .kpi-value.kpi-warn{color: #ffc107;}.kpi-card .kpi-value.kpi-danger{color: #dc3545;}
    </style>
    <div class="app-toolbar">${getStandardAppToolbarHTML()}</div>
    <div class="contract-container-v4">
        <div class="main-content-v4">
            <div class="main-form-column" id="mainFormContainer_${uniqueSuffix}">
                <details class="form-section" open><summary>Identificação do Contrato</summary><div class="form-section-content">
                    <input type="text" data-field="numeroContrato" class="app-input" placeholder="Contrato Nº">
                    <select data-field="situacao" class="app-select"><option value="ativo">Ativo</option><option value="suspenso">Suspenso</option><option value="concluido">Concluído</option><option value="encerrado">Encerrado</option><option value="cancelado">Cancelado</option></select>
                    <input type="text" data-field="tipo" class="app-input form-grid-full" placeholder="Tipo de Contrato (Ex: Prestação de Serviço)">
                    <input type="text" data-field="contratante" class="app-input form-grid-full" placeholder="Contratante">
                    <input type="text" data-field="contratada" class="app-input form-grid-full" placeholder="Contratada (Nome/CNPJ)">
                </div></details>
                <details class="form-section"><summary>Partes e Responsáveis</summary><div class="form-section-content">
                    <b class="form-grid-full">GESTOR</b>
                    <input type="text" data-field="gestor.nome" class="app-input form-grid-full" placeholder="Nome do Gestor">
                    <input type="text" data-field="gestor.masp" class="app-input" placeholder="MASP"><input type="text" data-field="gestor.setor" class="app-input" placeholder="Setor">
                    <input type="email" data-field="gestor.email" class="app-input" placeholder="E-mail"><input type="tel" data-field="gestor.telefone" class="app-input" placeholder="Telefone">
                    <b class="form-grid-full">GESTOR SUBSTITUTO</b>
                    <input type="text" data-field="gestorSubstituto.nome" class="app-input" placeholder="Nome"><input type="text" data-field="gestorSubstituto.masp" class="app-input" placeholder="MASP">
                    <b class="form-grid-full">FISCAL</b>
                    <input type="text" data-field="fiscal.nome" class="app-input" placeholder="Nome"><input type="text" data-field="fiscal.masp" class="app-input" placeholder="MASP">
                    <b class="form-grid-full">FISCAL SUBSTITUTO</b>
                    <input type="text" data-field="fiscalSubstituto.nome" class="app-input" placeholder="Nome"><input type="text" data-field="fiscalSubstituto.masp" class="app-input" placeholder="MASP">
                </div></details>
                <details class="form-section" open><summary>Objeto e Valores</summary><div class="form-section-content">
                    <textarea data-field="objeto" class="app-textarea form-grid-full" placeholder="Objeto do Contrato"></textarea>
                    <input type="text" data-field="modalidade" class="app-input" placeholder="Modalidade Licitação"><input type="text" data-field="dotacao" class="app-input" placeholder="Dotação Orçamentária">
                    <input type="text" data-field="numeroSei" class="app-input" placeholder="Nº Processo SEI"><input type="text" data-field="linkSei" class="app-input" placeholder="Link do Processo SEI">
                    <div class="form-grid-full"><h3>Valor Global Atual: <span id="valorGlobalDisplay_${uniqueSuffix}">R$ 0,00</span></h3></div>
                </div></details>
                <details class="form-section" open><summary>Itens do Contrato</summary><div class="form-section-content">
                    <div class="form-grid-full"><table class="app-table" id="itemsTable_${uniqueSuffix}"><thead><tr><th>Nº SIAD</th><th>Descrição</th><th>Valor (R$)</th><th>Ações</th></tr></thead><tbody></tbody></table></div>
                    <button id="addItemBtn_${uniqueSuffix}" class="app-button secondary form-grid-full"><i class="fas fa-plus"></i> Adicionar Item</button>
                </div></details>
                <details class="form-section"><summary>Prazos e Vigência</summary><div class="form-section-content">
                    <input type="date" data-field="dataAssinatura" class="app-input" title="Data Assinatura">
                    <input type="date" data-field="vigenciaInicial" class="app-input" title="Vigência Inicial">
                    <input type="date" data-field="vigenciaAtual" class="app-input" title="Vigência Atual">
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
                <div class="contract-tab-content-v4" data-tab-content="dashboard"><div class="dashboard-grid">...</div><div class="chart-container">...</div></div>
                <div class="contract-tab-content-v4" data-tab-content="financial" style="display:none;">...</div>
                <div class="contract-tab-content-v4" data-tab-content="physical" style="display:none;">...</div>
                <div class="contract-tab-content-v4" data-tab-content="amendments" style="display:none;">...</div>
                <div class="contract-tab-content-v4" data-tab-content="invoices" style="display:none;">...</div>
            </div>
        </div>
    </div>
    <div class="modal-overlay" id="modalOverlay_${uniqueSuffix}"><div class="modal-content"><div class="modal-header"><h3 class="modal-title" id="modalTitle_${uniqueSuffix}"></h3><button class="modal-close" id="modalClose_${uniqueSuffix}">×</button></div><div class="modal-body" id="modalBody_${uniqueSuffix}"></div><div class="modal-footer"><button class="app-button secondary" id="modalCancelBtn_${uniqueSuffix}">Cancelar</button> <button class="app-button primary" id="modalSaveBtn_${uniqueSuffix}">Salvar</button></div></div></div>
    `;
    
    // Simplification for brevity in the provided example
    const dashboardHTML = `<div class="dashboard-grid"><div class="kpi-card"><div class="kpi-title">Vigência</div><div class="kpi-value" id="kpiDaysLeft_${uniqueSuffix}">-</div><div class="kpi-subtext">Dias Restantes</div></div><div class="kpi-card"><div class="kpi-title">Entregas</div><div class="kpi-value" id="kpiPendingDeliveries_${uniqueSuffix}">0</div><div class="kpi-subtext">Pendentes</div></div><div class="kpi-card"><div class="kpi-title">Pagamentos</div><div class="kpi-value" id="kpiOverduePayments_${uniqueSuffix}">0</div><div class="kpi-subtext">Atrasados</div></div></div><div class="chart-container" id="chartsContainer_${uniqueSuffix}"><div class="chart-wrapper"><div class="chart-title">Execução Financeira</div><div id="financialChart_${uniqueSuffix}"></div><ul class="chart-legend" id="financialChartLegend_${uniqueSuffix}"></ul></div><div class="chart-wrapper"><div class="chart-title">Acompanhamento Físico</div><div id="physicalChart_${uniqueSuffix}"></div><ul class="chart-legend" id="physicalChartLegend_${uniqueSuffix}"></ul></div></div>`;
    const financialHTML = `<div class="app-section"><h4>Lançamentos Financeiros</h4><table class="app-table"><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr></thead><tbody id="financialTableBody_${uniqueSuffix}"></tbody></table><button id="addFinancialBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-plus"></i> Novo Lançamento</button></div>`;
    const physicalHTML = `<div class="app-section"><h4>Marcos de Entrega</h4><table class="app-table"><thead><tr><th>Item</th><th>Previsto</th><th>Realizado</th><th>Status</th><th>Ações</th></tr></thead><tbody id="physicalTableBody_${uniqueSuffix}"></tbody></table><button id="addPhysicalBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-plus"></i> Novo Marco</button></div>`;
    const amendmentsHTML = `<div class="app-section"><h4>Termos Aditivos</h4><table class="app-table"><thead><tr><th>Nº</th><th>Tipo</th><th>Variação Valor</th><th>Nova Vigência</th><th>Ações</th></tr></thead><tbody id="amendmentsTableBody_${uniqueSuffix}"></tbody></table><button id="addAmendmentBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-plus"></i> Novo Aditivo</button></div>`;
    const invoicesHTML = `<div class="app-section"><h4>Notas Fiscais</h4><table class="app-table"><thead><tr><th>Nº</th><th>Valor</th><th>Emissão</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead><tbody id="invoicesTableBody_${uniqueSuffix}"></tbody></table><button id="addInvoiceBtn_${uniqueSuffix}" class="app-button secondary"><i class="fas fa-plus"></i> Nova NF</button></div>`;

    const winData = window.windowManager.windows.get(winId); 
    if (!winData) return winId; 
    
    const windowContent = winData.element.querySelector('.window-content');
    windowContent.innerHTML = content;
    
    // Inject tab content
    const tabContents = windowContent.querySelectorAll('.contract-tab-content-v4');
    tabContents[0].innerHTML = dashboardHTML;
    tabContents[1].innerHTML = financialHTML;
    tabContents[2].innerHTML = physicalHTML;
    tabContents[3].innerHTML = amendmentsHTML;
    tabContents[4].innerHTML = invoicesHTML;

    // ESTADO DO APP (appState) V4.0
    const appState = {
        winId, appDataType: 'contract-manager_v4',
        data: {
            details: { situacao: 'ativo', gestor: {}, gestorSubstituto: {}, fiscal: {}, fiscalSubstituto: {}, valorGlobal: 0 },
            items: [], financial: [], physical: [], amendments: [], invoices: []
        },
        ui: {
            form: windowContent.querySelector('.main-form-column'), valorGlobalDisplay: windowContent.querySelector(`#valorGlobalDisplay_${uniqueSuffix}`),
            itemsTableBody: windowContent.querySelector(`#itemsTable_${uniqueSuffix} tbody`), addItemBtn: windowContent.querySelector(`#addItemBtn_${uniqueSuffix}`),
            tabButtons: windowContent.querySelectorAll('.contract-tracking-tabs-v4 .contract-tab-button'), tabContents: windowContent.querySelectorAll('.contract-tab-content-v4'),
            financialTableBody: windowContent.querySelector(`#financialTableBody_${uniqueSuffix}`), physicalTableBody: windowContent.querySelector(`#physicalTableBody_${uniqueSuffix}`),
            amendmentsTableBody: windowContent.querySelector(`#amendmentsTableBody_${uniqueSuffix}`), invoicesTableBody: windowContent.querySelector(`#invoicesTableBody_${uniqueSuffix}`),
            dashboard: {
                kpiDaysLeft: windowContent.querySelector(`#kpiDaysLeft_${uniqueSuffix}`), kpiPendingDeliveries: windowContent.querySelector(`#kpiPendingDeliveries_${uniqueSuffix}`),
                kpiOverduePayments: windowContent.querySelector(`#kpiOverduePayments_${uniqueSuffix}`), financialChart: windowContent.querySelector(`#financialChart_${uniqueSuffix}`),
                financialChartLegend: windowContent.querySelector(`#financialChartLegend_${uniqueSuffix}`), physicalChart: windowContent.querySelector(`#physicalChart_${uniqueSuffix}`),
                physicalChartLegend: windowContent.querySelector(`#physicalChartLegend_${uniqueSuffix}`)
            },
            modal: {
                overlay: windowContent.querySelector(`#modalOverlay_${uniqueSuffix}`), title: windowContent.querySelector(`#modalTitle_${uniqueSuffix}`),
                body: windowContent.querySelector(`#modalBody_${uniqueSuffix}`), saveBtn: windowContent.querySelector(`#modalSaveBtn_${uniqueSuffix}`),
                closeBtn: windowContent.querySelector(`#modalClose_${uniqueSuffix}`), cancelBtn: windowContent.querySelector(`#modalCancelBtn_${uniqueSuffix}`)
            }
        },
        currentModal: { mode: null, type: null, id: null },
        getData: function() { this.updateDetailsFromUI(); return this.data; },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString);
                this.data = { details: { gestor: {}, gestorSubstituto: {}, fiscal: {}, fiscalSubstituto: {}, valorGlobal: 0 }, items: [], financial: [], physical: [], amendments: [], invoices: [], ...data }; 
                this.fileId = fileMeta.id; this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
            } catch (e) { showNotification("Erro ao carregar arquivo: " + e.message, 5000); }
        },
        init: function() { 
            setupAppToolbarActions(this);
            this.ui.form.addEventListener('input', (e) => { if (e.target.dataset.field) { this.markDirty(); this.updateDetailsFromUI(); }});
            this.ui.itemsTableBody.addEventListener('click', (e) => this.handleTableAction(e, 'items'));
            this.ui.addItemBtn.onclick = () => this.openModal('add', 'item');

            this.ui.tabButtons.forEach(button => button.onclick = (e) => {
                this.ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.ui.tabContents.forEach(content => content.style.display = 'none');
                e.currentTarget.classList.add('active');
                Array.from(this.ui.tabContents).find(tc => tc.dataset.tabContent === e.currentTarget.dataset.tab).style.display = 'block';
            });
            
            // Botões de "Adicionar" nas abas
            windowContent.querySelector(`#addFinancialBtn_${uniqueSuffix}`).onclick = () => this.openModal('add', 'financial');
            windowContent.querySelector(`#addPhysicalBtn_${uniqueSuffix}`).onclick = () => this.openModal('add', 'physical');
            windowContent.querySelector(`#addAmendmentBtn_${uniqueSuffix}`).onclick = () => this.openModal('add', 'amendment');
            windowContent.querySelector(`#addInvoiceBtn_${uniqueSuffix}`).onclick = () => this.openModal('add', 'invoice');
            
            // Ações nas tabelas das abas
            this.ui.financialTableBody.addEventListener('click', (e) => this.handleTableAction(e, 'financial'));
            this.ui.physicalTableBody.addEventListener('click', (e) => this.handleTableAction(e, 'physical'));
            this.ui.amendmentsTableBody.addEventListener('click', (e) => this.handleTableAction(e, 'amendments'));
            this.ui.invoicesTableBody.addEventListener('click', (e) => this.handleTableAction(e, 'invoices'));

            // Ações do modal
            this.ui.modal.closeBtn.onclick = () => this.closeModal(); this.ui.modal.cancelBtn.onclick = () => this.closeModal();
            this.ui.modal.overlay.onclick = (e) => { if (e.target === this.ui.modal.overlay) this.closeModal(); };
            this.ui.modal.saveBtn.onclick = () => this.handleModalSave();
            
            this.renderAll();
        },
        openModal: function(mode, type, id = null) {
            this.currentModal = { mode, type, id };
            const { modal } = this.ui;
            let entry = {};
            let title = (mode === 'edit' ? 'Editar ' : 'Adicionar ') + {item: 'Item', financial: 'Lançamento Financeiro', physical: 'Marco Físico', amendment: 'Aditivo', invoice: 'Nota Fiscal'}[type];

            if (mode === 'edit') {
                const dataArray = type === 'item' ? this.data.items : this.data[type];
                entry = { ...(dataArray.find(e => e.id === id) || {}) };
            }

            modal.title.textContent = title;
            modal.body.innerHTML = this.getModalFormHTML(type, entry);
            modal.overlay.style.display = 'flex';
        },
        closeModal: function() { this.ui.modal.overlay.style.display = 'none'; this.ui.modal.body.innerHTML = ''; },
        getModalFormHTML: function(type, entry) {
            const today = new Date().toISOString().split('T')[0];
            switch(type) {
                case 'item': return `<div class="modal-form-grid"><input id="f_numeroSiad" class="app-input" placeholder="Nº SIAD" value="${entry.numeroSiad || ''}"><input type="number" id="f_valorFinanceiro" class="app-input" placeholder="Valor Financeiro (R$)" value="${entry.valorFinanceiro || ''}"><textarea id="f_descricao" class="app-textarea form-grid-full" placeholder="Descrição">${entry.descricao || ''}</textarea></div>`;
                case 'financial': return `<div class="modal-form-grid"><input type="date" id="f_date" class="app-input" value="${entry.date || today}"><select id="f_type" class="app-select"><option value="empenho" ${entry.type === 'empenho' ? 'selected' : ''}>Empenho</option><option value="liquidacao" ${entry.type === 'liquidacao' ? 'selected' : ''}>Liquidação</option><option value="pagamento" ${entry.type === 'pagamento' ? 'selected' : ''}>Pagamento</option><option value="anulacao" ${entry.type === 'anulacao' ? 'selected' : ''}>Anulação</option></select><input type="number" id="f_value" class="app-input" placeholder="Valor (R$)" value="${entry.value || ''}"><input id="f_description" class="app-input form-grid-full" placeholder="Descrição" value="${entry.description || ''}"></div>`;
                case 'physical':
                    const itemOptions = this.data.items.map(i => `<option value="${i.id}" ${entry.itemId === i.id ? 'selected' : ''}>${i.descricao}</option>`).join('');
                    return `<div class="modal-form-grid"><select id="f_itemId" class="app-select form-grid-full">${itemOptions}</select><input type="date" id="f_date_planned" class="app-input" placeholder="Data Prevista" value="${entry.date_planned || ''}"><input type="date" id="f_date_done" class="app-input" placeholder="Data Realizada" value="${entry.date_done || ''}"><select id="f_status" class="app-select"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="andamento" ${entry.status==='andamento'?'selected':''}>Andamento</option><option value="concluido" ${entry.status==='concluido'?'selected':''}>Concluído</option><option value="atrasado" ${entry.status==='atrasado'?'selected':''}>Atrasado</option></select></div>`;
                case 'amendment': return `<div class="modal-form-grid"><input id="f_number" class="app-input" placeholder="Nº Aditivo" value="${entry.number || ''}"><select id="f_type" class="app-select"><option value="valor" ${entry.type==='valor'?'selected':''}>Valor</option><option value="prazo" ${entry.type==='prazo'?'selected':''}>Prazo</option><option value="misto" ${entry.type==='misto'?'selected':''}>Misto</option></select><input type="date" id="f_date" class="app-input" value="${entry.date || today}"><input type="number" id="f_value_change" class="app-input" placeholder="Variação de Valor (+/-)" value="${entry.value_change || ''}"><input type="date" id="f_new_end_date" class="app-input" placeholder="Nova Vigência" value="${entry.new_end_date || ''}"><textarea id="f_object" class="app-textarea form-grid-full" placeholder="Objeto">${entry.object || ''}</textarea></div>`;
                case 'invoice': return `<div class="modal-form-grid"><input id="f_number" class="app-input" placeholder="Nº da NF" value="${entry.number || ''}"><input type="number" id="f_value" class="app-input" placeholder="Valor (R$)" value="${entry.value || ''}"><input type="date" id="f_date_issue" class="app-input" title="Data de Emissão" value="${entry.date_issue || today}"><input type="date" id="f_date_attested" class="app-input" title="Data de Atesto" value="${entry.date_attested || ''}"><input type="date" id="f_date_due" class="app-input" title="Data de Vencimento" value="${entry.date_due || ''}"><input type="date" id="f_date_payment" class="app-input" title="Data de Pagamento" value="${entry.date_payment || ''}"><select id="f_status" class="app-select form-grid-full"><option value="pendente" ${entry.status==='pendente'?'selected':''}>Pendente</option><option value="atestado" ${entry.status==='atestado'?'selected':''}>Atestado</option><option value="pago" ${entry.status==='pago'?'selected':''}>Pago</option><option value="cancelado" ${entry.status==='cancelado'?'selected':''}>Cancelado</option></select></div>`;
                default: return ``;
            }
        },
        handleModalSave: function() {
            const { mode, type, id } = this.currentModal;
            const dataArray = type === 'item' ? this.data.items : this.data[type];
            let entry = mode === 'edit' ? dataArray.find(e => e.id === id) : { id: generateId(type) };

            const form = this.ui.modal.body;
            const getVal = (fieldId) => form.querySelector(`#f_${fieldId}`).value;
            const getFloat = (fieldId) => parseFloat(getVal(fieldId)) || 0;

            switch(type) {
                case 'item': Object.assign(entry, { numeroSiad: getVal('numeroSiad'), descricao: getVal('descricao'), valorFinanceiro: getFloat('valorFinanceiro') }); break;
                case 'financial': Object.assign(entry, { date: getVal('date'), type: getVal('type'), value: getFloat('value'), description: getVal('description') }); break;
                case 'physical': const item = this.data.items.find(i => i.id === getVal('itemId')); Object.assign(entry, { itemId: getVal('itemId'), item: item ? item.descricao : 'Item não encontrado', date_planned: getVal('date_planned'), date_done: getVal('date_done'), status: getVal('status') }); break;
                case 'amendment': const valueChange = getFloat('value_change'); const newEndDate = getVal('new_end_date'); Object.assign(entry, { number: getVal('number'), type: getVal('type'), date: getVal('date'), value_change: valueChange, new_end_date: newEndDate, object: getVal('object') }); if(valueChange) this.data.details.valorGlobal += valueChange; if(newEndDate) this.data.details.vigenciaAtual = newEndDate; break;
                case 'invoice': const attestedDate = getVal('date_attested'); const paymentDate = getVal('date_payment'); let dueDate = getVal('date_due'); if (attestedDate && !dueDate) { const d = new Date(attestedDate + "T00:00:00"); d.setDate(d.getDate() + 30); dueDate = d.toISOString().split('T')[0]; } let status = getVal('status'); if(paymentDate) status = 'pago'; else if(attestedDate) status = 'atestado'; Object.assign(entry, { number: getVal('number'), value: getFloat('value'), date_issue: getVal('date_issue'), date_attested: attestedDate, date_due: dueDate, date_payment: paymentDate, status: status }); break;
            }

            if (mode === 'add') dataArray.push(entry);
            this.markDirty(); this.renderAll(); this.closeModal();
        },
        handleTableAction: function(e, tableType) {
            const editBtn = e.target.closest('button[data-action="edit"]');
            const deleteBtn = e.target.closest('button[data-action="delete"]');
            if(editBtn) this.openModal('edit', tableType, editBtn.closest('tr').dataset.id);
            if(deleteBtn) {
                const dataArray = tableType === 'item' ? this.data.items : this.data[tableType];
                this.data[tableType] = dataArray.filter(item => item.id !== deleteBtn.closest('tr').dataset.id);
                this.markDirty(); this.renderAll();
            }
        },
        calculateFinancials: function() {
            let empenhado = 0, liquidado = 0, pago = 0;
            (this.data.financial || []).forEach(f => {
                const val = f.value || 0;
                if (f.type === 'empenho') empenhado += val;
                else if (f.type === 'liquidacao') liquidado += val;
                else if (f.type === 'pagamento') pago += val;
                else if (f.type === 'anulacao') empenhado -= val;
            });
            return { totalValue: this.data.details.valorGlobal, empenhado, liquidado, pago };
        },
        renderDashboard: function() {
            const { dashboard } = this.ui; const { details, physical, invoices } = this.data;
            const today = new Date(); today.setHours(0, 0, 0, 0);

            if (details.vigenciaAtual) {
                const endDate = new Date(details.vigenciaAtual + "T23:59:59");
                const diffDays = Math.ceil((endDate - today) / 864e5);
                dashboard.kpiDaysLeft.textContent = diffDays; dashboard.kpiDaysLeft.className = 'kpi-value';
                if (diffDays < 0) dashboard.kpiDaysLeft.classList.add('kpi-danger'); else if (diffDays <= 30) dashboard.kpiDaysLeft.classList.add('kpi-warn'); else dashboard.kpiDaysLeft.classList.add('kpi-good');
            } else { dashboard.kpiDaysLeft.textContent = '-'; }

            const pendingDeliveries = (physical || []).filter(p => p.status !== 'concluido').length;
            dashboard.kpiPendingDeliveries.textContent = pendingDeliveries; dashboard.kpiPendingDeliveries.classList.toggle('kpi-warn', pendingDeliveries > 0);
            const lateInvoices = (invoices || []).filter(i => i.status !== 'pago' && i.date_due && new Date(i.date_due + "T23:59:59") < today).length;
            dashboard.kpiOverduePayments.textContent = lateInvoices; dashboard.kpiOverduePayments.classList.toggle('kpi-danger', lateInvoices > 0);

            const financials = this.calculateFinancials();
            const financialData = [
                { label: 'Pago', value: financials.pago, color: '#28a745' },
                { label: 'A Pagar (Liquidado)', value: financials.liquidado - financials.pago, color: '#ffc107' },
                { label: 'A Liquidar (Empenhado)', value: financials.empenhado - financials.liquidado, color: '#17a2b8' },
                { label: 'Saldo Contratual', value: financials.totalValue - financials.empenhado, color: '#6c757d' }
            ].filter(d => d.value > 0);
            this.createDoughnutChart(dashboard.financialChart, dashboard.financialChartLegend, financialData, `R$ ${financials.totalValue.toFixed(2)}`);
            
            const physicalStatus = (physical || []).reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
            const physicalData = [
                { label: 'Concluído', value: physicalStatus.concluido || 0, color: '#28a745' },
                { label: 'Em Andamento', value: physicalStatus.andamento || 0, color: '#17a2b8' },
                { label: 'Pendente', value: physicalStatus.pendente || 0, color: '#ffc107' },
                { label: 'Atrasado', value: physicalStatus.atrasado || 0, color: '#dc3545' }
            ].filter(d => d.value > 0);
            this.createDoughnutChart(dashboard.physicalChart, dashboard.physicalChartLegend, physicalData, `${(physical||[]).length} Itens`);
        },
        createDoughnutChart: function(svgContainer, legendContainer, data, centerLabel) {
            svgContainer.innerHTML = ''; legendContainer.innerHTML = '';
            const total = data.reduce((sum, item) => sum + item.value, 0);
            if (total === 0) { svgContainer.innerHTML = '<p style="color: var(--secondary-text-color); text-align: center; margin-top: 50px;">Sem dados.</p>'; return; }
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100"); const r = 40; const ir = 25; let startAngle = -Math.PI / 2;
            data.forEach(item => {
                const angle = (item.value / total) * 2 * Math.PI; const endAngle = startAngle + angle;
                const [x1, y1] = [50 + r*Math.cos(startAngle), 50 + r*Math.sin(startAngle)];
                const [x2, y2] = [50 + r*Math.cos(endAngle), 50 + r*Math.sin(endAngle)];
                const [hx1, hy1] = [50 + ir*Math.cos(startAngle), 50 + ir*Math.sin(startAngle)];
                const [hx2, hy2] = [50 + ir*Math.cos(endAngle), 50 + ir*Math.sin(endAngle)];
                const largeArcFlag = angle > Math.PI ? 1 : 0;
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${hx2} ${hy2} A ${ir} ${ir} 0 ${largeArcFlag} 0 ${hx1} ${hy1} Z`);
                path.setAttribute("fill", item.color); svg.appendChild(path);
                legendContainer.innerHTML += `<li><span class="legend-color" style="background-color:${item.color};"></span><span class="legend-label">${item.label}</span><span class="legend-value">${typeof item.value==='number' && item.value % 1 !== 0 ? 'R$ ' + item.value.toFixed(2) : item.value}</span></li>`;
                startAngle = endAngle;
            });
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", "50"); text.setAttribute("y", "50"); text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "middle");
            text.classList.add('doughnut-center-text'); text.textContent = centerLabel; svg.appendChild(text);
            svgContainer.appendChild(svg);
        },
        cleanup: () => {}
    };
    
    initializeFileState(appState, 'Novo Contrato 4.0', 'contrato_v4.contract', 'contract-manager_v4');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
