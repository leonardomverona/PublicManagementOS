import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

// Função de validação de CNPJ local
function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    
    if (cnpj === '' || cnpj.length !== 14) return false;
    
    // Elimina CNPJs inválidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Valida DVs
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
    const uniqueSuffix = generateId('contract');
    const winId = window.windowManager.createWindow('Gestão de Contratos', '', { 
        width: '1200px', 
        height: '850px', 
        appType: 'contract-manager' 
    });
    
    const content = `
    <div class="app-toolbar">${getStandardAppToolbarHTML()}</div>
    <div class="contract-container">
        <div class="contract-main-form">
            <h4><i class="fas fa-file-signature"></i> Detalhes do Contrato</h4>
            <div class="form-grid">
                <input type="text" id="contractProcess_${uniqueSuffix}" class="app-input" placeholder="Número do Processo" required>
                <input type="text" id="contractNumber_${uniqueSuffix}" class="app-input" placeholder="Número do Contrato">
                <input type="text" id="contractVendor_${uniqueSuffix}" class="app-input" placeholder="Contratado/Fornecedor" required>
                <input type="text" id="contractVendorCNPJ_${uniqueSuffix}" class="app-input" placeholder="CNPJ do Fornecedor">
                <select id="contractBiddingType_${uniqueSuffix}" class="app-select">
                    <option value="">Modalidade Licitatória</option>
                    <option value="pregão">Pregão</option>
                    <option value="concorrência">Concorrência</option>
                    <option value="tomada">Tomada de Preços</option>
                    <option value="inexigibilidade">Inexigibilidade</option>
                    <option value="dispensa">Dispensa</option>
                </select>
                <select id="contractStatus_${uniqueSuffix}" class="app-select contract-status-select">
                    <option value="elaboracao">Em Elaboração</option>
                    <option value="ativo" selected>Ativo/Vigente</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="prorrogado">Prorrogado</option>
                    <option value="encerrado">Encerrado</option>
                    <option value="cancelado">Cancelado</option>
                </select>
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
            <button class="contract-tab-button active" data-tab="financial_${uniqueSuffix}"><i class="fas fa-coins"></i> Financeiro</button>
            <button class="contract-tab-button" data-tab="physical_${uniqueSuffix}"><i class="fas fa-tasks"></i> Físico</button>
            <button class="contract-tab-button" data-tab="amendments_${uniqueSuffix}"><i class="fas fa-file-medical"></i> Aditivos</button>
            <button class="contract-tab-button" data-tab="invoices_${uniqueSuffix}"><i class="fas fa-receipt"></i> Notas Fiscais</button>
            <button class="contract-tab-button" data-tab="documents_${uniqueSuffix}"><i class="fas fa-folder-plus"></i> Documentos</button>
            <button class="contract-tab-button" data-tab="alerts_${uniqueSuffix}"><i class="fas fa-bell"></i> Alertas</button>
        </div>
        
        <div id="financial_${uniqueSuffix}" class="contract-tab-content">
            <div class="app-section">
                <h4>Execução Financeira</h4>
                <table class="app-table" id="financialTable_${uniqueSuffix}">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Descrição</th>
                            <th>Valor (R$)</th>
                            <th>Documento</th>
                            <th>Nº Doc. SEI</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <button id="addFinancialEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Lançamento</button>
            </div>
            <div class="app-section">
                <h4>Resumo Financeiro</h4>
                <div class="summary-grid">
                    <div>Valor Contratado:</div>
                    <div><strong id="summaryTotalValue_${uniqueSuffix}">0.00 R$</strong></div>
                    
                    <div>Total Empenhado:</div>
                    <div><strong id="summaryTotalEmpenhado_${uniqueSuffix}">0.00 R$</strong></div>
                    
                    <div>Total Liquidado:</div>
                    <div><strong id="summaryTotalLiquidado_${uniqueSuffix}">0.00 R$</strong></div>
                    
                    <div>Total Pago:</div>
                    <div><strong id="summaryTotalPago_${uniqueSuffix}">0.00 R$</strong></div>
                    
                    <div>Saldo a Empenhar:</div>
                    <div><strong id="summarySaldoEmpenhar_${uniqueSuffix}">0.00 R$</strong></div>
                    
                    <div>Saldo a Liquidar:</div>
                    <div><strong id="summarySaldoLiquidar_${uniqueSuffix}">0.00 R$</strong></div>
                    
                    <div>Saldo a Pagar:</div>
                    <div><strong id="summarySaldoPagar_${uniqueSuffix}">0.00 R$</strong></div>
                </div>
            </div>
        </div>
        
        <div id="physical_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="app-section">
                <h4>Marcos/Entregas</h4>
                <table class="app-table" id="physicalTable_${uniqueSuffix}">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qtde</th>
                            <th>Un.</th>
                            <th>Previsto</th>
                            <th>Realizado</th>
                            <th>% Exec.</th>
                            <th>Status</th>
                            <th>Medição</th>
                            <th>Nº Doc. SEI</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <button id="addPhysicalEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Marco</button>
            </div>
        </div>
        
        <div id="amendments_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="app-section">
                <h4>Aditivos/Alterações</h4>
                <table class="app-table" id="amendmentsTable_${uniqueSuffix}">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Nº Aditivo</th>
                            <th>Data</th>
                            <th>Objeto</th>
                            <th>Valor (R$)</th>
                            <th>Novo Total</th>
                            <th>Novo Término</th>
                            <th>Nº Doc. SEI</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <button id="addAmendmentEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Aditivo</button>
            </div>
        </div>
        
        <div id="invoices_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="app-section">
                <h4>Notas Fiscais</h4>
                <table class="app-table" id="invoiceTable_${uniqueSuffix}">
                    <thead>
                        <tr>
                            <th>Nº NF</th>
                            <th>Emissão</th>
                            <th>Valor NF</th>
                            <th>Atesto</th>
                            <th>Pagamento</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Nº Doc. SEI</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <button id="addInvoiceEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> NF</button>
            </div>
        </div>
        
        <div id="documents_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="app-section">
                <h4>Documentos</h4>
                <table class="app-table" id="documentsTable_${uniqueSuffix}">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Nome</th>
                            <th>Data</th>
                            <th>Nº Doc. SEI</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <button id="addDocumentEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-link"></i> Adicionar</button>
            </div>
        </div>
        
        <div id="alerts_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="app-section">
                <h4>Alertas e Prazos</h4>
                <div class="alert-summary">
                    <div><i class="fas fa-exclamation-triangle warning"></i> <strong>Vencimento:</strong> <span id="alertEndDate_${uniqueSuffix}">-</span></div>
                    <div><i class="fas fa-file-invoice"></i> <strong>Próximo Aditivo:</strong> <span id="alertAmendment_${uniqueSuffix}">-</span></div>
                    <div><i class="fas fa-clipboard-check"></i> <strong>Entregas Pendentes:</strong> <span id="alertDeliveries_${uniqueSuffix}">0</span></div>
                    <div><i class="fas fa-money-bill-wave"></i> <strong>Notas Fiscais Atrasadas:</strong> <span id="alertInvoices_${uniqueSuffix}">0</span></div>
                </div>
                <h5>Histórico de Alertas</h5>
                <ul class="alert-history" id="alertHistory_${uniqueSuffix}"></ul>
            </div>
        </div>
    </div>
    <style>
        .sei-link {
            color: #1a73e8;
            text-decoration: none;
            font-weight: 500;
        }
        .sei-link:hover {
            text-decoration: underline;
        }
        .input-sei {
            display: flex;
            gap: 5px;
        }
        .input-sei input {
            flex: 1;
        }
    </style>`;
    
    const winData = window.windowManager.windows.get(winId); 
    if (!winData) return winId; 
    
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId, 
        appDataType: 'contract-manager',
        data: { 
            details: { 
                process: '',
                number: '',
                vendor: '',
                vendorCNPJ: '',
                biddingType: '',
                object: '',
                totalValue: 0,
                signatureDate: '',
                startDate: '',
                endDate: '',
                managerName: '',
                managerContact: '',
                status: 'ativo' 
            }, 
            financial: [], 
            physical: [], 
            amendments: [], 
            invoices: [], 
            documents: [],
            alerts: []
        },
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
                totalValue: winData.element.querySelector(`#summaryTotalValue_${uniqueSuffix}`),
                totalEmpenhado: winData.element.querySelector(`#summaryTotalEmpenhado_${uniqueSuffix}`),
                totalLiquidado: winData.element.querySelector(`#summaryTotalLiquidado_${uniqueSuffix}`),
                totalPago: winData.element.querySelector(`#summaryTotalPago_${uniqueSuffix}`),
                saldoEmpenhar: winData.element.querySelector(`#summarySaldoEmpenhar_${uniqueSuffix}`),
                saldoLiquidar: winData.element.querySelector(`#summarySaldoLiquidar_${uniqueSuffix}`),
                saldoPagar: winData.element.querySelector(`#summarySaldoPagar_${uniqueSuffix}`)
            },
            alertsUI: {
                endDate: winData.element.querySelector(`#alertEndDate_${uniqueSuffix}`),
                amendment: winData.element.querySelector(`#alertAmendment_${uniqueSuffix}`),
                deliveries: winData.element.querySelector(`#alertDeliveries_${uniqueSuffix}`),
                invoices: winData.element.querySelector(`#alertInvoices_${uniqueSuffix}`),
                history: winData.element.querySelector(`#alertHistory_${uniqueSuffix}`)
            },
            addFinancialBtn: winData.element.querySelector(`#addFinancialEntryBtn_${uniqueSuffix}`),
            addPhysicalBtn: winData.element.querySelector(`#addPhysicalEntryBtn_${uniqueSuffix}`),
            addAmendmentBtn: winData.element.querySelector(`#addAmendmentEntryBtn_${uniqueSuffix}`),
            addInvoiceBtn: winData.element.querySelector(`#addInvoiceEntryBtn_${uniqueSuffix}`),
            addDocumentBtn: winData.element.querySelector(`#addDocumentEntryBtn_${uniqueSuffix}`)
        },
        getData: function() { 
            this.updateDetailsFromUI(); 
            return this.data; 
        },
        loadData: function(dataString, fileMeta) { 
            try { 
                const data = JSON.parse(dataString);
                this.data = { 
                    details: {}, 
                    financial: [], 
                    physical: [], 
                    amendments: [], 
                    invoices: [], 
                    documents: [],
                    alerts: [],
                    ...data 
                }; 
                this.fileId = fileMeta.id; 
                this.markClean(); 
                window.windowManager.updateWindowTitle(this.winId, fileMeta.name); 
                this.renderAll(); 
                this.checkAlerts();
            } catch (e) {
                showNotification("Erro ao ler arquivo de contrato: " + e.message, 5000); 
            }
        },
        init: function() { 
            setupAppToolbarActions(this);
            
            // Configuração das abas
            this.ui.tabButtons.forEach(button => {
                button.onclick = () => {
                    this.ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                    this.ui.tabContents.forEach(content => content.style.display = 'none');
                    button.classList.add('active');
                    const tabId = button.dataset.tab;
                    document.getElementById(tabId).style.display = 'block';
                };
            });
            
            // Configuração dos botões de adição
            this.ui.addFinancialBtn.onclick = () => this.addEntry('financial', {
                id: generateId('fin'), 
                date: new Date().toISOString().split('T')[0], 
                type: 'empenho', 
                description: '', 
                value: 0,
                document: '',
                seiNumber: '',
                seiLink: ''
            }); 
            
            this.ui.addPhysicalBtn.onclick = () => this.addEntry('physical', {
                id: generateId('phy'), 
                item: '', 
                quantity: 1, 
                unit: 'Un', 
                date_planned: '', 
                date_done: null, 
                percent_complete: 0, 
                status: 'pendente',
                measurement: '',
                seiNumber: '',
                seiLink: ''
            }); 
            
            this.ui.addAmendmentBtn.onclick = () => this.addEntry('amendments', {
                id: generateId('amd'), 
                type: 'valor', 
                number: '', 
                date: new Date().toISOString().split('T')[0], 
                object_change: '', 
                value_change: 0, 
                new_total: this.data.details.totalValue || 0,
                new_end_date: this.data.details.endDate || '',
                seiNumber: '',
                seiLink: ''
            }); 
            
            this.ui.addInvoiceBtn.onclick = () => this.addEntry('invoices', {
                id: generateId('inv'), 
                number: '', 
                date_issue: new Date().toISOString().split('T')[0], 
                value: 0, 
                date_attested: null, 
                date_payment: null,
                due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 dias
                status: 'pendente',
                seiNumber: '',
                seiLink: ''
            }); 
            
            this.ui.addDocumentBtn.onclick = () => this.addEntry('documents', {
                id: generateId('doc'), 
                type: 'contrato', 
                name: '', 
                date: new Date().toISOString().split('T')[0], 
                seiNumber: '',
                seiLink: ''
            }); 
            
            // Configuração dos eventos das tabelas
            ['financial', 'physical', 'amendments', 'invoices', 'documents'].forEach(type => {
                const tableBody = this.ui[`${type}TableBody`];
                if (tableBody) {
                    tableBody.addEventListener('click', (e) => this.handleTableAction(e, type));
                    tableBody.addEventListener('input', (e) => this.handleTableInput(e, type));
                    tableBody.addEventListener('change', (e) => this.handleTableInput(e, type));
                }
            });
            
            // Validação de CNPJ
            this.ui.detailsForm.vendorCNPJ.addEventListener('blur', () => {
                const cnpj = this.ui.detailsForm.vendorCNPJ.value;
                if (cnpj && !validateCNPJ(cnpj)) {
                    showNotification("CNPJ inválido!", 3000);
                    this.ui.detailsForm.vendorCNPJ.classList.add('input-error');
                } else {
                    this.ui.detailsForm.vendorCNPJ.classList.remove('input-error');
                }
            });
            
            // Validação de datas
            this.ui.detailsForm.endDate.addEventListener('change', () => {
                const start = new Date(this.ui.detailsForm.startDate.value);
                const end = new Date(this.ui.detailsForm.endDate.value);
                if (start > end) {
                    showNotification("Data de término não pode ser anterior à data de início", 3000);
                    this.ui.detailsForm.endDate.value = this.data.details.endDate || '';
                }
            });
            
            // Atualização de formulário
            Object.values(this.ui.detailsForm).forEach(input => {
                input.oninput = () => {
                    this.markDirty(); 
                    this.updateDetailsFromUI();
                };
            });
            
            // Renderização inicial
            this.renderAll();
            this.checkAlerts();
        },
        updateDetailsFromUI: function() {
            for(const key in this.ui.detailsForm){
                const input = this.ui.detailsForm[key];
                this.data.details[key] = input.type === 'number' ? 
                    parseFloat(input.value) || 0 : 
                    input.value;
            }
            this.renderFinancialSummary();
            this.checkAlerts();
        },
        renderAll: function() {
            // Atualiza campos do formulário
            for(const key in this.ui.detailsForm){
                if(this.data.details[key] !== undefined) {
                    this.ui.detailsForm[key].value = this.data.details[key];
                }
            }
            
            // Renderiza cada tabela
            this.renderFinancialTable();
            this.renderPhysicalTable();
            this.renderAmendmentsTable();
            this.renderInvoicesTable();
            this.renderDocumentsTable();
            
            // Atualiza resumo e alertas
            this.renderFinancialSummary();
            this.checkAlerts();
        },
        renderFinancialTable: function() {
            const tableBody = this.ui.financialTableBody;
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            (this.data.financial || []).forEach(entry => {
                const row = tableBody.insertRow();
                row.dataset.id = entry.id;
                
                // Renderização especial para SEI (hyperlink)
                const seiCell = entry.seiNumber && entry.seiLink ? 
                    `<td>
                        <a href="${entry.seiLink}" target="_blank" class="sei-link">${entry.seiNumber}</a>
                        <input type="hidden" value="${entry.seiNumber}" data-field="seiNumber">
                        <input type="hidden" value="${entry.seiLink}" data-field="seiLink">
                    </td>` :
                    `<td>
                        <div class="input-sei">
                            <input type="text" class="app-input" value="${entry.seiNumber || ''}" 
                                placeholder="Nº SEI" data-field="seiNumber">
                            <input type="text" class="app-input" value="${entry.seiLink || ''}" 
                                placeholder="Link" data-field="seiLink">
                        </div>
                    </td>`;
                
                row.innerHTML = `
                    <td><input type="date" class="app-input" value="${entry.date || ''}" data-field="date"></td>
                    <td>
                        <select class="app-select" data-field="type">
                            <option value="empenho" ${entry.type === 'empenho' ? 'selected' : ''}>Empenho</option>
                            <option value="liquidacao" ${entry.type === 'liquidacao' ? 'selected' : ''}>Liquidação</option>
                            <option value="pagamento" ${entry.type === 'pagamento' ? 'selected' : ''}>Pagamento</option>
                            <option value="anulacao" ${entry.type === 'anulacao' ? 'selected' : ''}>Anulação</option>
                        </select>
                    </td>
                    <td><input type="text" class="app-input" value="${entry.description || ''}" data-field="description"></td>
                    <td><input type="number" class="app-input" value="${entry.value || 0}" step="0.01" data-field="value"></td>
                    <td><input type="text" class="app-input" value="${entry.document || ''}" data-field="document" placeholder="Nº Doc."></td>
                    ${seiCell}
                    <td>
                        <button class="app-button danger action-button" data-action="delete" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        },
        renderPhysicalTable: function() {
            const tableBody = this.ui.physicalTableBody;
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            (this.data.physical || []).forEach(entry => {
                const row = tableBody.insertRow();
                row.dataset.id = entry.id;
                
                // Renderização especial para SEI (hyperlink)
                const seiCell = entry.seiNumber && entry.seiLink ? 
                    `<td>
                        <a href="${entry.seiLink}" target="_blank" class="sei-link">${entry.seiNumber}</a>
                        <input type="hidden" value="${entry.seiNumber}" data-field="seiNumber">
                        <input type="hidden" value="${entry.seiLink}" data-field="seiLink">
                    </td>` :
                    `<td>
                        <div class="input-sei">
                            <input type="text" class="app-input" value="${entry.seiNumber || ''}" 
                                placeholder="Nº SEI" data-field="seiNumber">
                            <input type="text" class="app-input" value="${entry.seiLink || ''}" 
                                placeholder="Link" data-field="seiLink">
                        </div>
                    </td>`;
                
                row.innerHTML = `
                    <td><input type="text" class="app-input" value="${entry.item || ''}" data-field="item"></td>
                    <td><input type="number" class="app-input" value="${entry.quantity || 0}" data-field="quantity"></td>
                    <td><input class="app-input" value="${entry.unit || 'Un'}" data-field="unit"></td>
                    <td><input type="date" class="app-input" value="${entry.date_planned || ''}" data-field="date_planned"></td>
                    <td><input type="date" class="app-input" value="${entry.date_done || ''}" data-field="date_done"></td>
                    <td><input type="number" class="app-input" value="${entry.percent_complete || 0}" min="0" max="100" data-field="percent_complete"></td>
                    <td>
                        <select class="app-select" data-field="status">
                            <option value="pendente" ${entry.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="andamento" ${entry.status === 'andamento' ? 'selected' : ''}>Andamento</option>
                            <option value="concluido" ${entry.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                            <option value="atrasado" ${entry.status === 'atrasado' ? 'selected' : ''}>Atrasado</option>
                        </select>
                    </td>
                    <td><input type="text" class="app-input" value="${entry.measurement || ''}" data-field="measurement" placeholder="Nº Medição"></td>
                    ${seiCell}
                    <td>
                        <button class="app-button danger action-button" data-action="delete" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        },
        renderAmendmentsTable: function() {
            const tableBody = this.ui.amendmentsTableBody;
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            (this.data.amendments || []).forEach(entry => {
                const row = tableBody.insertRow();
                row.dataset.id = entry.id;
                
                // Renderização especial para SEI (hyperlink)
                const seiCell = entry.seiNumber && entry.seiLink ? 
                    `<td>
                        <a href="${entry.seiLink}" target="_blank" class="sei-link">${entry.seiNumber}</a>
                        <input type="hidden" value="${entry.seiNumber}" data-field="seiNumber">
                        <input type="hidden" value="${entry.seiLink}" data-field="seiLink">
                    </td>` :
                    `<td>
                        <div class="input-sei">
                            <input type="text" class="app-input" value="${entry.seiNumber || ''}" 
                                placeholder="Nº SEI" data-field="seiNumber">
                            <input type="text" class="app-input" value="${entry.seiLink || ''}" 
                                placeholder="Link" data-field="seiLink">
                        </div>
                    </td>`;
                
                row.innerHTML = `
                    <td>
                        <select class="app-select" data-field="type">
                            <option value="valor" ${entry.type === 'valor' ? 'selected' : ''}>Valor</option>
                            <option value="prazo" ${entry.type === 'prazo' ? 'selected' : ''}>Prazo</option>
                            <option value="objeto" ${entry.type === 'objeto' ? 'selected' : ''}>Objeto</option>
                            <option value="outros" ${entry.type === 'outros' ? 'selected' : ''}>Outros</option>
                        </select>
                    </td>
                    <td><input type="text" class="app-input" value="${entry.number || ''}" data-field="number"></td>
                    <td><input type="date" class="app-input" value="${entry.date || ''}" data-field="date"></td>
                    <td><input type="text" class="app-input" value="${entry.object_change || ''}" data-field="object_change"></td>
                    <td><input type="number" class="app-input" value="${entry.value_change || 0}" data-field="value_change"></td>
                    <td><input type="number" class="app-input" value="${entry.new_total || 0}" data-field="new_total"></td>
                    <td><input type="date" class="app-input" value="${entry.new_end_date || ''}" data-field="new_end_date"></td>
                    ${seiCell}
                    <td>
                        <button class="app-button danger action-button" data-action="delete" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        },
        renderInvoicesTable: function() {
            const tableBody = this.ui.invoicesTableBody;
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            (this.data.invoices || []).forEach(entry => {
                const row = tableBody.insertRow();
                row.dataset.id = entry.id;
                
                // Renderização especial para SEI (hyperlink)
                const seiCell = entry.seiNumber && entry.seiLink ? 
                    `<td>
                        <a href="${entry.seiLink}" target="_blank" class="sei-link">${entry.seiNumber}</a>
                        <input type="hidden" value="${entry.seiNumber}" data-field="seiNumber">
                        <input type="hidden" value="${entry.seiLink}" data-field="seiLink">
                    </td>` :
                    `<td>
                        <div class="input-sei">
                            <input type="text" class="app-input" value="${entry.seiNumber || ''}" 
                                placeholder="Nº SEI" data-field="seiNumber">
                            <input type="text" class="app-input" value="${entry.seiLink || ''}" 
                                placeholder="Link" data-field="seiLink">
                        </div>
                    </td>`;
                
                row.innerHTML = `
                    <td><input type="text" class="app-input" value="${entry.number || ''}" data-field="number"></td>
                    <td><input type="date" class="app-input" value="${entry.date_issue || ''}" data-field="date_issue"></td>
                    <td><input type="number" class="app-input" value="${entry.value || 0}" data-field="value"></td>
                    <td><input type="date" class="app-input" value="${entry.date_attested || ''}" data-field="date_attested"></td>
                    <td><input type="date" class="app-input" value="${entry.date_payment || ''}" data-field="date_payment"></td>
                    <td><input type="date" class="app-input" value="${entry.due_date || ''}" data-field="due_date"></td>
                    <td>
                        <select class="app-select" data-field="status">
                            <option value="pendente" ${entry.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="atestado" ${entry.status === 'atestado' ? 'selected' : ''}>Atestado</option>
                            <option value="pago" ${entry.status === 'pago' ? 'selected' : ''}>Pago</option>
                            <option value="cancelado" ${entry.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </td>
                    ${seiCell}
                    <td>
                        <button class="app-button danger action-button" data-action="delete" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        },
        renderDocumentsTable: function() {
            const tableBody = this.ui.documentsTableBody;
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            (this.data.documents || []).forEach(entry => {
                const row = tableBody.insertRow();
                row.dataset.id = entry.id;
                
                // Renderização especial para SEI (hyperlink)
                const seiCell = entry.seiNumber && entry.seiLink ? 
                    `<td>
                        <a href="${entry.seiLink}" target="_blank" class="sei-link">${entry.seiNumber}</a>
                        <input type="hidden" value="${entry.seiNumber}" data-field="seiNumber">
                        <input type="hidden" value="${entry.seiLink}" data-field="seiLink">
                    </td>` :
                    `<td>
                        <div class="input-sei">
                            <input type="text" class="app-input" value="${entry.seiNumber || ''}" 
                                placeholder="Nº SEI" data-field="seiNumber">
                            <input type="text" class="app-input" value="${entry.seiLink || ''}" 
                                placeholder="Link" data-field="seiLink">
                        </div>
                    </td>`;
                
                row.innerHTML = `
                    <td>
                        <select class="app-select" data-field="type">
                            <option value="contrato" ${entry.type === 'contrato' ? 'selected' : ''}>Contrato</option>
                            <option value="aditivo" ${entry.type === 'aditivo' ? 'selected' : ''}>Aditivo</option>
                            <option value="ata" ${entry.type === 'ata' ? 'selected' : ''}>Ata</option>
                            <option value="nota_fiscal" ${entry.type === 'nota_fiscal' ? 'selected' : ''}>Nota Fiscal</option>
                            <option value="laudo" ${entry.type === 'laudo' ? 'selected' : ''}>Laudo</option>
                            <option value="outros" ${entry.type === 'outros' ? 'selected' : ''}>Outros</option>
                        </select>
                    </td>
                    <td><input type="text" class="app-input" value="${entry.name || ''}" data-field="name"></td>
                    <td><input type="date" class="app-input" value="${entry.date || ''}" data-field="date"></td>
                    ${seiCell}
                    <td>
                        <button class="app-button danger action-button" data-action="delete" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        },
        renderFinancialSummary: function() {
            const totalValue = this.data.details.totalValue || 0;
            let totalEmpenhado = 0;
            let totalLiquidado = 0;
            let totalPago = 0;
            
            (this.data.financial || []).forEach(f => {
                const val = f.value || 0;
                if (f.type === 'empenho') totalEmpenhado += val;
                else if (f.type === 'liquidacao') totalLiquidado += val;
                else if (f.type === 'pagamento') totalPago += val;
                else if (f.type === 'anulacao') {
                    totalEmpenhado -= val;
                    totalLiquidado -= val;
                    totalPago -= val;
                }
            });
            
            this.ui.summary.totalValue.textContent = totalValue.toFixed(2) + " R$";
            this.ui.summary.totalEmpenhado.textContent = totalEmpenhado.toFixed(2) + " R$";
            this.ui.summary.totalLiquidado.textContent = totalLiquidado.toFixed(2) + " R$";
            this.ui.summary.totalPago.textContent = totalPago.toFixed(2) + " R$";
            this.ui.summary.saldoEmpenhar.textContent = (totalValue - totalEmpenhado).toFixed(2) + " R$";
            this.ui.summary.saldoLiquidar.textContent = (totalEmpenhado - totalLiquidado).toFixed(2) + " R$";
            this.ui.summary.saldoPagar.textContent = (totalLiquidado - totalPago).toFixed(2) + " R$";
        },
        addEntry: function(type, template) {
            if (!this.data[type]) this.data[type] = [];
            this.data[type].push({...template});
            this.markDirty();
            
            // Renderiza apenas a tabela específica
            switch(type) {
                case 'financial': this.renderFinancialTable(); break;
                case 'physical': this.renderPhysicalTable(); break;
                case 'amendments': this.renderAmendmentsTable(); break;
                case 'invoices': this.renderInvoicesTable(); break;
                case 'documents': this.renderDocumentsTable(); break;
            }
            
            if(type === 'financial') this.renderFinancialSummary();
            this.checkAlerts();
        },
        handleTableAction: function(e, tableType) {
            const button = e.target.closest('button[data-action="delete"]');
            if (button) {
                const rowId = button.closest('tr').dataset.id;
                this.data[tableType] = (this.data[tableType] || []).filter(item => item.id !== rowId);
                this.markDirty();
                
                // Renderiza apenas a tabela específica
                switch(tableType) {
                    case 'financial': 
                        this.renderFinancialTable(); 
                        this.renderFinancialSummary();
                        break;
                    case 'physical': this.renderPhysicalTable(); break;
                    case 'amendments': this.renderAmendmentsTable(); break;
                    case 'invoices': this.renderInvoicesTable(); break;
                    case 'documents': this.renderDocumentsTable(); break;
                }
                
                this.checkAlerts();
            }
        },
        handleTableInput: function(e, tableType) {
            const input = e.target.closest('input, select, textarea');
            if (input) {
                const rowId = input.closest('tr').dataset.id;
                const field = input.dataset.field;
                const entry = (this.data[tableType] || []).find(item => item.id === rowId);
                
                if (entry) {
                    // Atualiza o valor do campo
                    if (input.type === 'number') {
                        entry[field] = parseFloat(input.value) || 0;
                    } else {
                        entry[field] = input.value;
                    }
                    
                    // Atualiza o hiperlink SEI se necessário
                    if (field === 'seiNumber' || field === 'seiLink') {
                        const seiNumber = entry.seiNumber || '';
                        const seiLink = entry.seiLink || '';
                        
                        // Atualiza a célula SEI se ambos estiverem preenchidos
                        if (seiNumber && seiLink) {
                            const seiCell = input.closest('td');
                            if (seiCell) {
                                seiCell.innerHTML = `
                                    <a href="${seiLink}" target="_blank" class="sei-link">${seiNumber}</a>
                                    <input type="hidden" value="${seiNumber}" data-field="seiNumber">
                                    <input type="hidden" value="${seiLink}" data-field="seiLink">
                                `;
                            }
                        }
                    }
                    
                    this.markDirty();
                    
                    // Atualizações específicas
                    if (tableType === 'financial') {
                        this.renderFinancialSummary();
                    } else if (tableType === 'amendments' && field === 'value_change') {
                        entry.new_total = (this.data.details.totalValue || 0) + entry.value_change;
                        const newTotalInput = input.closest('tr').querySelector('[data-field="new_total"]');
                        if (newTotalInput) newTotalInput.value = entry.new_total;
                    }
                    
                    this.checkAlerts();
                }
            }
        },
        checkAlerts: function() {
            // Verificação de vencimento do contrato
            if (this.data.details.endDate) {
                const endDate = new Date(this.data.details.endDate);
                const today = new Date();
                const diffTime = endDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                this.ui.alertsUI.endDate.textContent = diffDays > 0 ? 
                    `${diffDays} dias restantes` : 
                    `Vencido há ${Math.abs(diffDays)} dias`;
                
                // Classes de alerta
                const endDateElement = this.ui.alertsUI.endDate.parentElement;
                endDateElement.classList.remove('alert-warning', 'alert-critical');
                if (diffDays <= 30) {
                    endDateElement.classList.add(diffDays <= 0 ? 'alert-critical' : 'alert-warning');
                }
            }
            
            // Entregas pendentes
            const pendingDeliveries = (this.data.physical || []).filter(
                d => d.status !== 'concluido'
            ).length;
            this.ui.alertsUI.deliveries.textContent = pendingDeliveries;
            this.ui.alertsUI.deliveries.parentElement.classList.toggle('alert-warning', pendingDeliveries > 0);
                
            // Notas fiscais atrasadas
            const today = new Date();
            const lateInvoices = (this.data.invoices || []).filter(i => {
                if (i.status === 'pago') return false;
                if (i.due_date) {
                    const dueDate = new Date(i.due_date);
                    return dueDate < today;
                }
                return false;
            }).length;
            
            this.ui.alertsUI.invoices.textContent = lateInvoices;
            this.ui.alertsUI.invoices.parentElement.classList.toggle('alert-critical', lateInvoices > 0);
            
            // Aditivos pendentes
            const pendingAmendments = (this.data.amendments || []).filter(
                a => !a.date || !a.number
            ).length;
            this.ui.alertsUI.amendment.textContent = pendingAmendments > 0 ? 
                `${pendingAmendments} pendentes` : 'Nenhum';
        },
        cleanup: () => {}
    };
    
    initializeFileState(appState, 'Novo Contrato', 'contrato.contract', 'contract-manager');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
