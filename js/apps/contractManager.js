import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

// Função de validação de CNPJ local (mantida)
function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    tamanho++;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado === parseInt(digitos.charAt(1));
}

export function openContractManager() {
    const uniqueSuffix = generateId('contract_v3');
    const winId = window.windowManager.createWindow('Gestão de Contratos 3.0', '', { 
        width: '1300px', 
        height: '900px', 
        appType: 'contract-manager' 
    });
    
    // -- TEMPLATE HTML V3.0 --
    const content = `
    <style>
        .chart-container { display: flex; gap: 20px; margin-top: 20px; justify-content: space-around; }
        .chart-wrapper { display: flex; flex-direction: column; align-items: center; background-color: var(--window-bg); padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 48%; }
        .chart-wrapper svg { font-size: 14px; }
        .chart-wrapper .chart-title { font-weight: bold; margin-bottom: 10px; font-size: 1.1em; color: var(--text-color); }
        .chart-legend { list-style: none; padding: 0; margin-top: 15px; width: 100%; }
        .chart-legend li { display: flex; align-items: center; margin-bottom: 5px; font-size: 0.9em; }
        .chart-legend .legend-color { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .chart-legend .legend-label { color: var(--secondary-text-color); }
        .chart-legend .legend-value { margin-left: auto; font-weight: bold; color: var(--text-color); }
        .doughnut-center-text { fill: var(--text-color); font-size: 1.5em; font-weight: bold; }
        .doughnut-center-subtext { fill: var(--secondary-text-color); font-size: 0.8em; }
    </style>
    <div class="app-toolbar">${getStandardAppToolbarHTML()}</div>
    <div class="contract-container">
        <div class="contract-main-form">
            <h4><i class="fas fa-file-signature"></i> Detalhes do Contrato</h4>
            <div class="form-grid">
                <input type="text" id="contractProcess_${uniqueSuffix}" class="app-input" placeholder="Número do Processo" required>
                <input type="text" id="contractNumber_${uniqueSuffix}" class="app-input" placeholder="Número do Contrato">
                <input type="text" id="contractVendor_${uniqueSuffix}" class="app-input" placeholder="Contratado/Fornecedor" required>
                <input type="text" id="contractVendorCNPJ_${uniqueSuffix}" class="app-input" placeholder="CNPJ do Fornecedor">
                <select id="contractBiddingType_${uniqueSuffix}" class="app-select"><option value="">Modalidade Licitatória</option><option value="pregão">Pregão</option><option value="concorrência">Concorrência</option><option value="tomada">Tomada de Preços</option><option value="inexigibilidade">Inexigibilidade</option><option value="dispensa">Dispensa</option></select>
                <select id="contractStatus_${uniqueSuffix}" class="app-select contract-status-select"><option value="elaboracao">Em Elaboração</option><option value="ativo" selected>Ativo/Vigente</option><option value="suspenso">Suspenso</option><option value="concluido">Concluído</option><option value="encerrado">Encerrado</option><option value="cancelado">Cancelado</option></select>
                <textarea id="contractObject_${uniqueSuffix}" class="app-textarea" placeholder="Objeto do Contrato" style="min-height:60px; grid-column: span 3;" required></textarea>
                <input type="number" id="contractTotalValue_${uniqueSuffix}" class="app-input" placeholder="Valor Total (R$)" step="0.01" min="0" required>
                <input type="date" id="contractSignatureDate_${uniqueSuffix}" class="app-input" title="Data de Assinatura">
                <input type="date" id="contractStartDate_${uniqueSuffix}" class="app-input" title="Data de Início/Vigência" required>
                <input type="date" id="contractEndDate_${uniqueSuffix}" class="app-input" title="Data de Término da Vigência" required>
                <input type="text" id="contractManagerName_${uniqueSuffix}" class="app-input" placeholder="Fiscal/Gestor do Contrato">
                <input type="text" id="contractManagerContact_${uniqueSuffix}" class="app-input" placeholder="Contato do Fiscal">
            </div>
        </div>
        
        <div class="contract-tracking-tabs">
            <button class="contract-tab-button active" data-tab="dashboard_${uniqueSuffix}"><i class="fas fa-chart-pie"></i> Dashboard</button>
            <button class="contract-tab-button" data-tab="financial_${uniqueSuffix}"><i class="fas fa-coins"></i> Financeiro</button>
            <button class="contract-tab-button" data-tab="physical_${uniqueSuffix}"><i class="fas fa-tasks"></i> Físico</button>
            <button class="contract-tab-button" data-tab="amendments_${uniqueSuffix}"><i class="fas fa-file-medical"></i> Aditivos</button>
            <button class="contract-tab-button" data-tab="invoices_${uniqueSuffix}"><i class="fas fa-receipt"></i> Notas Fiscais</button>
            <button class="contract-tab-button" data-tab="documents_${uniqueSuffix}"><i class="fas fa-folder-plus"></i> Documentos</button>
        </div>
        
        <div id="dashboard_${uniqueSuffix}" class="contract-tab-content">
             <div class="dashboard-grid">
                <div class="kpi-card"><div class="kpi-title">Vigência do Contrato</div><div class="kpi-value" id="kpiDaysLeft_${uniqueSuffix}">-</div><div class="kpi-subtext">Dias Restantes</div></div>
                <div class="kpi-card"><div class="kpi-title">Entregas Físicas</div><div class="kpi-value" id="kpiPendingDeliveries_${uniqueSuffix}">0</div><div class="kpi-subtext">Pendentes</div></div>
                <div class="kpi-card"><div class="kpi-title">Pagamentos</div><div class="kpi-value" id="kpiOverduePayments_${uniqueSuffix}">0</div><div class="kpi-subtext">Atrasados</div></div>
            </div>
            <div class="chart-container" id="chartsContainer_${uniqueSuffix}">
                <div class="chart-wrapper"><div class="chart-title">Execução Financeira</div><div id="financialChart_${uniqueSuffix}"></div><ul class="chart-legend" id="financialChartLegend_${uniqueSuffix}"></ul></div>
                <div class="chart-wrapper"><div class="chart-title">Acompanhamento Físico</div><div id="physicalChart_${uniqueSuffix}"></div><ul class="chart-legend" id="physicalChartLegend_${uniqueSuffix}"></ul></div>
            </div>
        </div>

        <div id="financial_${uniqueSuffix}" class="contract-tab-content" style="display:none;"><div class="app-section"><h4>Execução Financeira</h4><table class="app-table" id="financialTable_${uniqueSuffix}"><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor (R$)</th><th>Nº Doc. SEI</th><th>Ações</th></tr></thead><tbody></tbody></table><button id="addFinancialEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Lançamento</button></div><div class="app-section"><h4>Resumo Financeiro</h4><div class="summary-grid"><div>Valor Contratado:</div><div><strong id="summaryTotalValue_${uniqueSuffix}">0.00 R$</strong></div><div>Total Empenhado:</div><div><strong id="summaryTotalEmpenhado_${uniqueSuffix}">0.00 R$</strong></div><div>Total Liquidado:</div><div><strong id="summaryTotalLiquidado_${uniqueSuffix}">0.00 R$</strong></div><div>Total Pago:</div><div><strong id="summaryTotalPago_${uniqueSuffix}">0.00 R$</strong></div><div>Saldo a Empenhar:</div><div><strong id="summarySaldoEmpenhar_${uniqueSuffix}">0.00 R$</strong></div><div>Saldo a Liquidar:</div><div><strong id="summarySaldoLiquidar_${uniqueSuffix}">0.00 R$</strong></div><div>Saldo a Pagar:</div><div><strong id="summarySaldoPagar_${uniqueSuffix}">0.00 R$</strong></div></div></div></div>
        <div id="physical_${uniqueSuffix}" class="contract-tab-content" style="display:none;"><div class="app-section"><h4>Marcos/Entregas</h4><table class="app-table" id="physicalTable_${uniqueSuffix}"><thead><tr><th>Item</th><th>Qtde</th><th>Un.</th><th>Previsto</th><th>Realizado</th><th>% Exec.</th><th>Status</th><th>Nº Doc. SEI</th><th>Ações</th></tr></thead><tbody></tbody></table><button id="addPhysicalEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Marco</button></div></div>
        <div id="amendments_${uniqueSuffix}" class="contract-tab-content" style="display:none;"><div class="app-section"><h4>Aditivos/Alterações</h4><table class="app-table" id="amendmentsTable_${uniqueSuffix}"><thead><tr><th>Tipo</th><th>Nº Aditivo</th><th>Data</th><th>Objeto</th><th>Variação Valor (R$)</th><th>Nova Data Fim</th><th>Nº Doc. SEI</th><th>Ações</th></tr></thead><tbody></tbody></table><button id="addAmendmentEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Aditivo</button></div></div>
        <div id="invoices_${uniqueSuffix}" class="contract-tab-content" style="display:none;"><div class="app-section"><h4>Notas Fiscais</h4><table class="app-table" id="invoiceTable_${uniqueSuffix}"><thead><tr><th>Nº NF</th><th>Emissão</th><th>Valor NF</th><th>Atesto</th><th>Vencimento</th><th>Pagamento</th><th>Status</th><th>Nº Doc. SEI</th><th>Ações</th></tr></thead><tbody></tbody></table><button id="addInvoiceEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> NF</button></div></div>
        <div id="documents_${uniqueSuffix}" class="contract-tab-content" style="display:none;"><div class="app-section"><h4>Documentos</h4><table class="app-table" id="documentsTable_${uniqueSuffix}"><thead><tr><th>Tipo</th><th>Nome</th><th>Data</th><th>Nº Doc. SEI</th><th>Ações</th></tr></thead><tbody></tbody></table><button id="addDocumentEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-link"></i> Adicionar</button></div></div>
    </div>`;
    
    const winData = window.windowManager.windows.get(winId); 
    if (!winData) return winId; 
    
    winData.element.querySelector('.window-content').innerHTML = content;
    
    // -- ESTADO DO APP (appState) V3.0 --
    const appState = {
        winId, 
        appDataType: 'contract-manager_v3',
        data: { details: { status: 'ativo', totalValue: 0 }, financial: [], physical: [], amendments: [], invoices: [], documents: [], history: [] },
        ui: { 
            detailsForm: {
                process: winData.element.querySelector(`#contractProcess_${uniqueSuffix}`),
                number: winData.element.querySelector(`#contractNumber_${uniqueSuffix}`),
                vendor: winData.element.querySelector(`#contractVendor_${uniqueSuffix}`),
                vendorCNPJ: winData.element.querySelector(`#contractVendorCNPJ_${uniqueSuffix}`),
                biddingType: winData.element.querySelector(`#contractBiddingType_${uniqueSuffix}`),
                object: winData.element.querySelector(`#contractObject_${uniqueSuffix}`),
                totalValue: winData.element.querySelector(`#contractTotalValue_${uniqueSuffix}`),
                signatureDate: winData.element.querySelector(`#contractSignatureDate_${uniqueSuffix}`),
                startDate: winData.element.querySelector(`#contractStartDate_${uniqueSuffix}`),
                endDate: winData.element.querySelector(`#contractEndDate_${uniqueSuffix}`),
                managerName: winData.element.querySelector(`#contractManagerName_${uniqueSuffix}`),
                managerContact: winData.element.querySelector(`#contractManagerContact_${uniqueSuffix}`),
                status: winData.element.querySelector(`#contractStatus_${uniqueSuffix}`)
            },
            tabButtons: winData.element.querySelectorAll('.contract-tab-button'),
            tabContents: winData.element.querySelectorAll('.contract-tab-content'),
            financialTableBody: winData.element.querySelector(`#financialTable_${uniqueSuffix} tbody`),
            physicalTableBody: winData.element.querySelector(`#physicalTable_${uniqueSuffix} tbody`),
            amendmentsTableBody: winData.element.querySelector(`#amendmentsTable_${uniqueSuffix} tbody`),
            invoicesTableBody: winData.element.querySelector(`#invoiceTable_${uniqueSuffix} tbody`),
            documentsTableBody: winData.element.querySelector(`#documentsTable_${uniqueSuffix} tbody`),
            summary: { 
                totalValue: winData.element.querySelector(`#summaryTotalValue_${uniqueSuffix}`), totalEmpenhado: winData.element.querySelector(`#summaryTotalEmpenhado_${uniqueSuffix}`),
                totalLiquidado: winData.element.querySelector(`#summaryTotalLiquidado_${uniqueSuffix}`), totalPago: winData.element.querySelector(`#summaryTotalPago_${uniqueSuffix}`),
                saldoEmpenhar: winData.element.querySelector(`#summarySaldoEmpenhar_${uniqueSuffix}`), saldoLiquidar: winData.element.querySelector(`#summarySaldoLiquidar_${uniqueSuffix}`),
                saldoPagar: winData.element.querySelector(`#summarySaldoPagar_${uniqueSuffix}`)
            },
            dashboard: {
                kpiDaysLeft: winData.element.querySelector(`#kpiDaysLeft_${uniqueSuffix}`), kpiPendingDeliveries: winData.element.querySelector(`#kpiPendingDeliveries_${uniqueSuffix}`),
                kpiOverduePayments: winData.element.querySelector(`#kpiOverduePayments_${uniqueSuffix}`), financialChart: winData.element.querySelector(`#financialChart_${uniqueSuffix}`),
                financialChartLegend: winData.element.querySelector(`#financialChartLegend_${uniqueSuffix}`), physicalChart: winData.element.querySelector(`#physicalChart_${uniqueSuffix}`),
                physicalChartLegend: winData.element.querySelector(`#physicalChartLegend_${uniqueSuffix}`)
            },
            addFinancialBtn: winData.element.querySelector(`#addFinancialEntryBtn_${uniqueSuffix}`), addPhysicalBtn: winData.element.querySelector(`#addPhysicalEntryBtn_${uniqueSuffix}`),
            addAmendmentBtn: winData.element.querySelector(`#addAmendmentEntryBtn_${uniqueSuffix}`), addInvoiceBtn: winData.element.querySelector(`#addInvoiceEntryBtn_${uniqueSuffix}`),
            addDocumentBtn: winData.element.querySelector(`#addDocumentEntryBtn_${uniqueSuffix}`)
        },
        getData: function() { this.updateDetailsFromUI(); return this.data; },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString);
                this.data = { details: {}, financial: [], physical: [], amendments: [], invoices: [], documents: [], history: [], ...data }; 
                this.fileId = fileMeta.id; this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
            } catch (e) { showNotification("Erro ao ler arquivo de contrato: " + e.message, 5000); }
        },
        init: function() { 
            setupAppToolbarActions(this);
            this.ui.tabButtons.forEach(button => button.onclick = () => {
                this.ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.ui.tabContents.forEach(content => content.style.display = 'none');
                button.classList.add('active');
                winData.element.querySelector(`#${button.dataset.tab}`).style.display = 'block';
            });
            
            const today = new Date().toISOString().split('T')[0];
            this.ui.addFinancialBtn.onclick = () => this.addEntry('financial', { date: today, type: 'empenho', sei_number: '', sei_link: '' }); 
            this.ui.addPhysicalBtn.onclick = () => this.addEntry('physical', { status: 'pendente', percent_complete: 0, sei_number: '', sei_link: '' }); 
            this.ui.addAmendmentBtn.onclick = () => this.addEntry('amendments', { date: today, sei_number: '', sei_link: '' }); 
            this.ui.addInvoiceBtn.onclick = () => this.addEntry('invoices', { date_issue: today, status: 'pendente', sei_number: '', sei_link: '' }); 
            this.ui.addDocumentBtn.onclick = () => this.addEntry('documents', { date: today, sei_number: '', sei_link: '' }); 
            
            ['financial', 'physical', 'amendments', 'invoices', 'documents'].forEach(type => {
                this.ui[`${type}TableBody`].addEventListener('click', (e) => {
                    this.handleTableAction(e, type);
                    if (e.target.matches('.sei-link-button, .sei-link-button *')) {
                         const rowId = e.target.closest('tr').dataset.id;
                         const entry = (this.data[type] || []).find(item => item.id === rowId);
                         if(entry) this.promptForSeiLink(entry);
                    }
                });
                this.ui[`${type}TableBody`].addEventListener('input', (e) => this.handleTableInput(e, type));
            });
            
            this.ui.detailsForm.vendorCNPJ.addEventListener('blur', (e) => {
                if (e.target.value && !validateCNPJ(e.target.value)) { showNotification("CNPJ inválido!", 3000); e.target.classList.add('input-error'); }
                else { e.target.classList.remove('input-error'); }
            });
            
            Object.values(this.ui.detailsForm).forEach(input => input.oninput = () => { this.markDirty(); this.updateDetailsFromUI(); });
            
            this.renderAll();
        },
        promptForSeiLink: function(entry) {
            const newLink = prompt("Cole o link completo do documento SEI:", entry.sei_link || '');
            if (newLink !== null) { entry.sei_link = newLink; this.markDirty(); this.renderAll(); }
        },
        updateDetailsFromUI: function() {
            for(const key in this.ui.detailsForm) this.data.details[key] = this.ui.detailsForm[key].type === 'number' ? parseFloat(this.ui.detailsForm[key].value) || 0 : this.ui.detailsForm[key].value;
            this.renderAll();
        },
        renderAll: function() {
            for(const key in this.ui.detailsForm) if(this.data.details[key] !== undefined) this.ui.detailsForm[key].value = this.data.details[key];
            
            const createSeiCell = (entry) => {
                const seiNumber = entry.sei_number || '';
                const seiLink = entry.sei_link || '';
                const linkIcon = `<button class="app-button sei-link-button" title="Editar Link SEI"><i class="fas fa-link"></i></button>`;
                if (seiLink && seiNumber) return `<td><a href="${seiLink}" target="_blank" rel="noopener noreferrer">${seiNumber}</a> ${linkIcon}</td>`;
                return `<td><input type="text" class="app-input" value="${seiNumber}" data-field="sei_number" placeholder="Nº SEI"> ${linkIcon}</td>`;
            };

            this.renderTable('financial', (e) => `<td><input type="date" class="app-input" value="${e.date||''}" data-field="date"></td><td><select class="app-select" data-field="type"><option value="empenho" ${e.type==='empenho'?'selected':''}>Empenho</option><option value="liquidacao" ${e.type==='liquidacao'?'selected':''}>Liquidação</option><option value="pagamento" ${e.type==='pagamento'?'selected':''}>Pagamento</option><option value="anulacao" ${e.type==='anulacao'?'selected':''}>Anulação</option></select></td><td><input type="text" class="app-input" value="${e.description||''}" data-field="description"></td><td><input type="number" class="app-input" value="${e.value||0}" step="0.01" data-field="value"></td>${createSeiCell(e)}`);
            this.renderTable('physical', (e) => `<td><input type="text" class="app-input" value="${e.item||''}" data-field="item"></td><td><input type="number" class="app-input" value="${e.quantity||1}" data-field="quantity"></td><td><input class="app-input" value="${e.unit||'Un'}" data-field="unit"></td><td><input type="date" class="app-input" value="${e.date_planned||''}" data-field="date_planned"></td><td><input type="date" class="app-input" value="${e.date_done||''}" data-field="date_done"></td><td><input type="number" class="app-input" value="${e.percent_complete||0}" min="0" max="100" data-field="percent_complete"></td><td><select class="app-select" data-field="status"><option value="pendente" ${e.status==='pendente'?'selected':''}>Pendente</option><option value="andamento" ${e.status==='andamento'?'selected':''}>Andamento</option><option value="concluido" ${e.status==='concluido'?'selected':''}>Concluído</option><option value="atrasado" ${e.status==='atrasado'?'selected':''}>Atrasado</option></select></td>${createSeiCell(e)}`);
            this.renderTable('amendments', (e) => `<td><select class="app-select" data-field="type"><option value="valor" ${e.type==='valor'?'selected':''}>Valor</option><option value="prazo" ${e.type==='prazo'?'selected':''}>Prazo</option><option value="misto" ${e.type==='misto'?'selected':''}>Misto</option><option value="outro" ${e.type==='outro'?'selected':''}>Outro</option></select></td><td><input type="text" class="app-input" value="${e.number||''}" data-field="number"></td><td><input type="date" class="app-input" value="${e.date||''}" data-field="date"></td><td><input type="text" class="app-input" value="${e.object_change||''}" data-field="object_change"></td><td><input type="number" class="app-input" value="${e.value_change||0}" data-field="value_change" title="Variação do valor"></td><td><input type="date" class="app-input" value="${e.new_end_date||''}" data-field="new_end_date" title="Nova data de término"></td>${createSeiCell(e)}`);
            this.renderTable('invoices', (e) => `<td><input type="text" class="app-input" value="${e.number||''}" data-field="number"></td><td><input type="date" class="app-input" value="${e.date_issue||''}" data-field="date_issue"></td><td><input type="number" class="app-input" value="${e.value||0}" data-field="value"></td><td><input type="date" class="app-input" value="${e.date_attested||''}" data-field="date_attested"></td><td><input type="date" class="app-input" value="${e.date_due||''}" data-field="date_due" title="Vencimento"></td><td><input type="date" class="app-input" value="${e.date_payment||''}" data-field="date_payment"></td><td><select class="app-select" data-field="status"><option value="pendente" ${e.status==='pendente'?'selected':''}>Pendente</option><option value="atestado" ${e.status==='atestado'?'selected':''}>Atestado</option><option value="pago" ${e.status==='pago'?'selected':''}>Pago</option><option value="cancelado" ${e.status==='cancelado'?'selected':''}>Cancelado</option></select></td>${createSeiCell(e)}`);
            this.renderTable('documents', (e) => `<td><select class="app-select" data-field="type"><option value="contrato" ${e.type==='contrato'?'selected':''}>Contrato</option><option value="aditivo" ${e.type==='aditivo'?'selected':''}>Aditivo</option><option value="garantia" ${e.type==='garantia'?'selected':''}>Garantia</option><option value="outro" ${e.type==='outro'?'selected':''}>Outro</option></select></td><td><input type="text" class="app-input" value="${e.name||''}" data-field="name"></td><td><input type="date" class="app-input" value="${e.date||''}" data-field="date"></td>${createSeiCell(e)}`);
            
            this.renderFinancialSummary();
            this.renderDashboard();
        },
        renderTable: function(type, rowRenderFn) {
            const tableBody = this.ui[`${type}TableBody`];
            tableBody.innerHTML = '';
            (this.data[type] = this.data[type] || []).forEach((entry) => {
                const row = tableBody.insertRow();
                row.dataset.id = entry.id;
                row.innerHTML = rowRenderFn(entry) + `<td><button class="app-button danger action-button" data-action="delete" title="Excluir"><i class="fas fa-trash"></i></button></td>`;
            });
        },
        renderFinancialSummary: function() {
            const totals = this.calculateFinancials();
            this.ui.summary.totalValue.textContent = `${totals.totalValue.toFixed(2)} R$`; this.ui.summary.totalEmpenhado.textContent = `${totals.empenhado.toFixed(2)} R$`;
            this.ui.summary.totalLiquidado.textContent = `${totals.liquidado.toFixed(2)} R$`; this.ui.summary.totalPago.textContent = `${totals.pago.toFixed(2)} R$`;
            this.ui.summary.saldoEmpenhar.textContent = `${(totals.totalValue - totals.empenhado).toFixed(2)} R$`;
            this.ui.summary.saldoLiquidar.textContent = `${(totals.empenhado - totals.liquidado).toFixed(2)} R$`;
            this.ui.summary.saldoPagar.textContent = `${(totals.liquidado - totals.pago).toFixed(2)} R$`;
        },
        calculateFinancials: function() {
            const totalValue = this.data.details.totalValue || 0;
            let empenhado = 0, liquidado = 0, pago = 0;
            (this.data.financial || []).forEach(f => {
                const val = f.value || 0;
                if (f.type === 'empenho') empenhado += val;
                else if (f.type === 'liquidacao') liquidado += val;
                else if (f.type === 'pagamento') pago += val;
                else if (f.type === 'anulacao') empenhado -= val;
            });
            return { totalValue, empenhado, liquidado, pago };
        },
        addEntry: function(type, template) {
            (this.data[type] = this.data[type] || []).push({ id: generateId(type.slice(0, 3)), ...template });
            this.markDirty(); this.renderAll();
        },
        handleTableAction: function(e, tableType) {
            if (e.target.closest('button[data-action="delete"]')) {
                const rowId = e.target.closest('tr').dataset.id;
                this.data[tableType] = (this.data[tableType] || []).filter(item => item.id !== rowId);
                this.markDirty(); this.renderAll();
            }
        },
        handleTableInput: function(e, tableType) {
            const input = e.target.closest('input, select'); if (!input) return;
            const rowId = input.closest('tr').dataset.id; const field = input.dataset.field;
            const entry = (this.data[tableType] || []).find(item => item.id === rowId); if (!entry) return;
            const oldValue = entry[field];
            entry[field] = (input.type === 'number') ? parseFloat(input.value) || 0 : input.value;
            if (oldValue === entry[field] && input.type !== 'date') return;
            this.markDirty();

            if (tableType === 'amendments' && (field === 'value_change' || field === 'new_end_date')) {
                if (field === 'value_change' && entry.value_change !== 0) {
                    this.data.details.totalValue = (this.data.details.totalValue || 0) + entry.value_change;
                    entry.value_change = 0; 
                }
                if (field === 'new_end_date' && entry.new_end_date) this.data.details.endDate = entry.new_end_date;
            }
            if (tableType === 'physical' && field === 'percent_complete' && entry.percent_complete >= 100) entry.status = 'concluido';
            if (tableType === 'invoices' && field === 'date_attested' && entry.date_attested) {
                const attestedDate = new Date(entry.date_attested + "T00:00:00");
                attestedDate.setDate(attestedDate.getDate() + 30);
                entry.date_due = attestedDate.toISOString().split('T')[0];
            }
            this.renderAll();
        },
        renderDashboard: function() {
            const { dashboard } = this.ui; const { details, physical, invoices } = this.data;
            const today = new Date(); today.setHours(0, 0, 0, 0);

            if (details.endDate) {
                const endDate = new Date(details.endDate + "T23:59:59");
                const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                dashboard.kpiDaysLeft.textContent = diffDays; dashboard.kpiDaysLeft.className = 'kpi-value';
                if (diffDays < 0) dashboard.kpiDaysLeft.classList.add('kpi-danger'); else if (diffDays <= 30) dashboard.kpiDaysLeft.classList.add('kpi-warn'); else dashboard.kpiDaysLeft.classList.add('kpi-good');
            } else { dashboard.kpiDaysLeft.textContent = '-'; dashboard.kpiDaysLeft.className = 'kpi-value'; }

            const pendingDeliveries = (physical || []).filter(p => p.status !== 'concluido').length;
            dashboard.kpiPendingDeliveries.textContent = pendingDeliveries; dashboard.kpiPendingDeliveries.classList.toggle('kpi-warn', pendingDeliveries > 0);
            const lateInvoices = (invoices || []).filter(i => i.status !== 'pago' && i.date_due && new Date(i.date_due + "T23:59:59") < today).length;
            dashboard.kpiOverduePayments.textContent = lateInvoices; dashboard.kpiOverduePayments.classList.toggle('kpi-danger', lateInvoices > 0);

            const financials = this.calculateFinancials();
            const financialData = [];
            if (financials.pago > 0) financialData.push({ label: 'Pago', value: financials.pago, color: '#28a745' });
            const saldoAPagar = financials.liquidado - financials.pago;
            if (saldoAPagar > 0) financialData.push({ label: 'A Pagar', value: saldoAPagar, color: '#ffc107' });
            const saldoALiquidar = financials.empenhado - financials.liquidado;
            if (saldoALiquidar > 0) financialData.push({ label: 'A Liquidar', value: saldoALiquidar, color: '#17a2b8' });
            const saldoAEmpenhar = financials.totalValue - financials.empenhado;
            if (saldoAEmpenhar > 0) financialData.push({ label: 'Saldo Contrato', value: saldoAEmpenhar, color: '#6c757d' });
            this.createDoughnutChart(dashboard.financialChart, dashboard.financialChartLegend, financialData, `R$ ${financials.totalValue.toFixed(2)}`);
            
            const physicalStatus = (physical || []).reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
            const physicalData = [
                { label: 'Concluído', value: physicalStatus.concluido || 0, color: '#28a745' },
                { label: 'Em Andamento', value: physicalStatus.andamento || 0, color: '#17a2b8' },
                { label: 'Pendente', value: physicalStatus.pendente || 0, color: '#ffc107' },
                { label: 'Atrasado', value: physicalStatus.atrasado || 0, color: '#dc3545' }
            ].filter(d => d.value > 0);
            this.createDoughnutChart(dashboard.physicalChart, dashboard.physicalChartLegend, physicalData, `${physical.length} Itens`);
        },
        createDoughnutChart: function(svgContainer, legendContainer, data, centerLabel) {
            svgContainer.innerHTML = ''; legendContainer.innerHTML = '';
            const total = data.reduce((sum, item) => sum + item.value, 0);
            if (total === 0) { svgContainer.innerHTML = '<p style="color: var(--secondary-text-color); text-align: center; margin-top: 50px;">Sem dados para exibir.</p>'; return; }

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            const radius = 40; const holeRadius = 25;
            let startAngle = -Math.PI / 2;

            data.forEach(item => {
                const percentage = item.value / total;
                const angle = percentage * 2 * Math.PI;
                const endAngle = startAngle + angle;
                
                const x1 = 50 + radius * Math.cos(startAngle); const y1 = 50 + radius * Math.sin(startAngle);
                const x2 = 50 + radius * Math.cos(endAngle); const y2 = 50 + radius * Math.sin(endAngle);
                const hx1 = 50 + holeRadius * Math.cos(startAngle); const hy1 = 50 + holeRadius * Math.sin(startAngle);
                const hx2 = 50 + holeRadius * Math.cos(endAngle); const hy2 = 50 + holeRadius * Math.sin(endAngle);
                const largeArcFlag = angle > Math.PI ? 1 : 0;

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${hx2} ${hy2} A ${holeRadius} ${holeRadius} 0 ${largeArcFlag} 0 ${hx1} ${hy1} Z`);
                path.setAttribute("fill", item.color);
                svg.appendChild(path);

                const legendItem = document.createElement('li');
                legendItem.innerHTML = `<span class="legend-color" style="background-color:${item.color};"></span><span class="legend-label">${item.label}</span><span class="legend-value">${typeof item.value === 'number' && item.value % 1 !== 0 ? 'R$ ' + item.value.toFixed(2) : item.value}</span>`;
                legendContainer.appendChild(legendItem);
                
                startAngle = endAngle;
            });
            
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", "50"); text.setAttribute("y", "50");
            text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "middle");
            text.classList.add('doughnut-center-text');
            text.textContent = centerLabel;
            svg.appendChild(text);

            svgContainer.appendChild(svg);
        },
        cleanup: () => {}
    };
    
    initializeFileState(appState, 'Novo Contrato 3.0', 'contrato_v3.contract', 'contract-manager_v3');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
