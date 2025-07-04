import { generateId, showNotification, validateCNPJ } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';

export function openContractManager() {
    const uniqueSuffix = generateId('contract');
    const winId = window.windowManager.createWindow('Gestão de Contratos', '', { 
        width: '1100px', 
        height: '800px', 
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
                            <th>Status</th>
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
                            <th>Arquivo</th>
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
                    <div><i class="fas fa-money-bill-wave"></i> <strong>Pagamentos Atrasados:</strong> <span id="alertPayments_${uniqueSuffix}">0</span></div>
                </div>
                <h5>Histórico de Alertas</h5>
                <ul class="alert-history" id="alertHistory_${uniqueSuffix}"></ul>
            </div>
        </div>
    </div>`;
    
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
                payments: winData.element.querySelector(`#alertPayments_${uniqueSuffix}`),
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
            
            // Setup tabs
            this.ui.tabButtons.forEach(button => {
                button.onclick = () => {
                    this.ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                    this.ui.tabContents.forEach(content => content.style.display = 'none');
                    button.classList.add('active');
                    winData.element.querySelector(`#${button.dataset.tab}`).style.display = 'block';
                };
            });
            
            // Setup entry buttons
            this.ui.addFinancialBtn.onclick = () => this.addEntry('financial', {
                id: generateId('fin'), 
                date: new Date().toISOString().split('T')[0], 
                type: 'empenho', 
                description: '', 
                value: 0,
                document: ''
            }); 
            
            this.ui.addPhysicalBtn.onclick = () => this.addEntry('physical', {
                id: generateId('phy'), 
                item: '', 
                quantity: 1, 
                unit: 'Un', 
                date_planned: '', 
                date_done: null, 
                percent_complete:0, 
                status: 'pendente',
                measurement: ''
            }); 
            
            this.ui.addAmendmentBtn.onclick = () => this.addEntry('amendments', {
                id: generateId('amd'), 
                type: 'valor', 
                number: '', 
                date: new Date().toISOString().split('T')[0], 
                object_change: '', 
                value_change: 0, 
                new_total: this.data.details.totalValue,
                new_end_date: this.data.details.endDate
            }); 
            
            this.ui.addInvoiceBtn.onclick = () => this.addEntry('invoices', {
                id: generateId('inv'), 
                number: '', 
                date_issue: new Date().toISOString().split('T')[0], 
                value: 0, 
                date_attested: null, 
                date_payment: null,
                status: 'pendente'
            }); 
            
            this.ui.addDocumentBtn.onclick = () => this.addEntry('documents', {
                id: generateId('doc'), 
                type: 'contrato', 
                name: '', 
                date: new Date().toISOString().split('T')[0], 
                path: '',
                file: null
            }); 
            
            // Setup table events
            ['financial', 'physical', 'amendments', 'invoices', 'documents'].forEach(type => {
                this.ui[`${type}TableBody`].addEventListener('click', (e) => this.handleTableAction(e, type));
                this.ui[`${type}TableBody`].addEventListener('input', (e) => this.handleTableInput(e, type));
                this.ui[`${type}TableBody`].addEventListener('change', (e) => this.handleTableInput(e, type));
            });
            
            // Setup form validation
            this.ui.detailsForm.vendorCNPJ.addEventListener('blur', () => {
                const cnpj = this.ui.detailsForm.vendorCNPJ.value;
                if (cnpj && !validateCNPJ(cnpj)) {
                    showNotification("CNPJ inválido!", 3000);
                    this.ui.detailsForm.vendorCNPJ.classList.add('input-error');
                } else {
                    this.ui.detailsForm.vendorCNPJ.classList.remove('input-error');
                }
            });
            
            // Setup date validation
            this.ui.detailsForm.endDate.addEventListener('change', () => {
                const start = new Date(this.ui.detailsForm.startDate.value);
                const end = new Date(this.ui.detailsForm.endDate.value);
                if (start > end) {
                    showNotification("Data de término não pode ser anterior à data de início", 3000);
                    this.ui.detailsForm.endDate.value = this.data.details.endDate;
                }
            });
            
            // Initialize
            Object.values(this.ui.detailsForm).forEach(input => {
                input.oninput = () => {
                    this.markDirty(); 
                    this.updateDetailsFromUI();
                };
            });
            
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
            // Render form
            for(const key in this.ui.detailsForm){
                if(this.data.details[key] !== undefined) {
                    this.ui.detailsForm[key].value = this.data.details[key];
                }
            }
            
            // Render tables
            this.renderTable('financial', (e) => `
                <td><input type="date" class="app-input" value="${e.date||''}" data-field="date"></td>
                <td>
                    <select class="app-select" data-field="type">
                        <option value="empenho" ${e.type==='empenho'?'selected':''}>Empenho</option>
                        <option value="liquidacao" ${e.type==='liquidacao'?'selected':''}>Liquidação</option>
                        <option value="pagamento" ${e.type==='pagamento'?'selected':''}>Pagamento</option>
                        <option value="anulacao" ${e.type==='anulacao'?'selected':''}>Anulação</option>
                    </select>
                </td>
                <td><input type="text" class="app-input" value="${e.description||''}" data-field="description"></td>
                <td><input type="number" class="app-input" value="${e.value||0}" step="0.01" data-field="value"></td>
                <td><input type="text" class="app-input" value="${e.document||''}" data-field="document" placeholder="Nº Doc."></td>
            `);
            
            this.renderTable('physical', (e) => `
                <td><input type="text" class="app-input" value="${e.item||''}" data-field="item"></td>
                <td><input type="number" class="app-input" value="${e.quantity||0}" data-field="quantity"></td>
                <td><input class="app-input" value="${e.unit||'Un'}" data-field="unit"></td>
                <td><input type="date" class="app-input" value="${e.date_planned||''}" data-field="date_planned"></td>
                <td><input type="date" class="app-input" value="${e.date_done||''}" data-field="date_done"></td>
                <td><input type="number" class="app-input" value="${e.percent_complete||0}" min="0" max="100" data-field="percent_complete"></td>
                <td>
                    <select class="app-select" data-field="status">
                        <option value="pendente" ${e.status==='pendente'?'selected':''}>Pendente</option>
                        <option value="andamento" ${e.status==='andamento'?'selected':''}>Andamento</option>
                        <option value="concluido" ${e.status==='concluido'?'selected':''}>Concluído</option>
                        <option value="atrasado" ${e.status==='atrasado'?'selected':''}>Atrasado</option>
                    </select>
                </td>
                <td><input type="text" class="app-input" value="${e.measurement||''}" data-field="measurement" placeholder="Nº Medição"></td>
            `);
            
            this.renderTable('amendments', (e) => `
                <td>
                    <select class="app-select" data-field="type">
                        <option value="valor" ${e.type==='valor'?'selected':''}>Valor</option>
                        <option value="prazo" ${e.type==='prazo'?'selected':''}>Prazo</option>
                        <option value="objeto" ${e.type==='objeto'?'selected':''}>Objeto</option>
                        <option value="outros" ${e.type==='outros'?'selected':''}>Outros</option>
                    </select>
                </td>
                <td><input type="text" class="app-input" value="${e.number||''}" data-field="number"></td>
                <td><input type="date" class="app-input" value="${e.date||''}" data-field="date"></td>
                <td><input type="text" class="app-input" value="${e.object_change||''}" data-field="object_change"></td>
                <td><input type="number" class="app-input" value="${e.value_change||0}" data-field="value_change"></td>
                <td><input type="number" class="app-input" value="${e.new_total||0}" data-field="new_total"></td>
                <td><input type="date" class="app-input" value="${e.new_end_date||''}" data-field="new_end_date"></td>
            `);
            
            this.renderTable('invoices', (e) => `
                <td><input type="text" class="app-input" value="${e.number||''}" data-field="number"></td>
                <td><input type="date" class="app-input" value="${e.date_issue||''}" data-field="date_issue"></td>
                <td><input type="number" class="app-input" value="${e.value||0}" data-field="value"></td>
                <td><input type="date" class="app-input" value="${e.date_attested||''}" data-field="date_attested"></td>
                <td><input type="date" class="app-input" value="${e.date_payment||''}" data-field="date_payment"></td>
                <td>
                    <select class="app-select" data-field="status">
                        <option value="pendente" ${e.status==='pendente'?'selected':''}>Pendente</option>
                        <option value="atestado" ${e.status==='atestado'?'selected':''}>Atestado</option>
                        <option value="pago" ${e.status==='pago'?'selected':''}>Pago</option>
                        <option value="cancelado" ${e.status==='cancelado'?'selected':''}>Cancelado</option>
                    </select>
                </td>
            `);
            
            this.renderTable('documents', (e) => `
                <td>
                    <select class="app-select" data-field="type">
                        <option value="contrato" ${e.type==='contrato'?'selected':''}>Contrato</option>
                        <option value="aditivo" ${e.type==='aditivo'?'selected':''}>Aditivo</option>
                        <option value="ata" ${e.type==='ata'?'selected':''}>Ata</option>
                        <option value="nota_fiscal" ${e.type==='nota_fiscal'?'selected':''}>Nota Fiscal</option>
                        <option value="laudo" ${e.type==='laudo'?'selected':''}>Laudo</option>
                        <option value="outros" ${e.type==='outros'?'selected':''}>Outros</option>
                    </select>
                </td>
                <td><input type="text" class="app-input" value="${e.name||''}" data-field="name"></td>
                <td><input type="date" class="app-input" value="${e.date||''}" data-field="date"></td>
                <td><input type="file" class="app-input" data-field="file" accept=".pdf,.doc,.docx,.xls,.xlsx"></td>
            `);
            
            this.renderFinancialSummary();
            this.checkAlerts();
        },
        renderTable: function(type, rowRenderFn) {
            const tableBody = this.ui[`${type}TableBody`];
            tableBody.innerHTML = '';
            (this.data[type] = this.data[type] || []).forEach((entry) => {
                const row = tableBody.insertRow();
                row.dataset.id = entry.id;
                row.innerHTML = rowRenderFn(entry) + 
                    `<td>
                        <button class="app-button danger action-button" data-action="delete" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>`;
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
            (this.data[type] = this.data[type] || []).push({...template});
            this.markDirty();
            this.renderTable(type, this.getRowRenderer(type));
            if(type === 'financial') this.renderFinancialSummary();
            this.checkAlerts();
        },
        handleTableAction: function(e, tableType) {
            const button = e.target.closest('button[data-action="delete"]');
            if (button) {
                const rowId = button.closest('tr').dataset.id;
                this.data[tableType] = (this.data[tableType] || []).filter(item => item.id !== rowId);
                this.markDirty();
                this.renderTable(tableType, this.getRowRenderer(tableType));
                if(tableType === 'financial') this.renderFinancialSummary();
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
                    // Handle different input types
                    if (input.type === 'number') {
                        entry[field] = parseFloat(input.value) || 0;
                    } else if (input.type === 'file') {
                        entry[field] = input.files[0];
                    } else {
                        entry[field] = input.value;
                    }
                    
                    this.markDirty();
                    
                    // Special cases
                    if(tableType === 'financial') {
                        this.renderFinancialSummary();
                    }
                    if(tableType === 'amendments' && field === 'value_change') {
                        entry.new_total = (this.data.details.totalValue || 0) + entry.value_change;
                        this.renderTable('amendments', this.getRowRenderer('amendments'));
                    }
                    this.checkAlerts();
                }
            }
        },
        checkAlerts: function() {
            // Calculate days until end date
            const endDate = new Date(this.data.details.endDate);
            const today = new Date();
            const diffTime = endDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            // Update UI
            this.ui.alertsUI.endDate.textContent = diffDays > 0 ? 
                `${diffDays} dias restantes` : 
                `Vencido há ${Math.abs(diffDays)} dias`;
                
            this.ui.alertsUI.endDate.parentElement.className = diffDays <= 30 ? 
                (diffDays <= 0 ? 'alert-critical' : 'alert-warning') : '';
                
            // Count pending deliveries
            const pendingDeliveries = (this.data.physical || []).filter(
                d => d.status !== 'concluido'
            ).length;
            this.ui.alertsUI.deliveries.textContent = pendingDeliveries;
            this.ui.alertsUI.deliveries.parentElement.className = pendingDeliveries > 0 ? 
                'alert-warning' : '';
                
            // Count late payments
            const lateInvoices = (this.data.invoices || []).filter(i => {
                if (i.status === 'pago' || !i.date_attested) return false;
                const paymentDate = new Date(i.date_payment || '');
                return paymentDate < today;
            }).length;
            this.ui.alertsUI.payments.textContent = lateInvoices;
            this.ui.alertsUI.payments.parentElement.className = lateInvoices > 0 ? 
                'alert-critical' : '';
            
            // Amendment alert
            const pendingAmendments = (this.data.amendments || []).filter(
                a => !a.date || !a.number
            );
            this.ui.alertsUI.amendment.textContent = pendingAmendments.length > 0 ? 
                `${pendingAmendments.length} pendentes` : 'Nenhum';
        },
        getRowRenderer: function(type) {
            const renderers = {
                financial: e => `<td>...</td>`,
                // ... (other renderers as in renderAll)
            };
            return renderers[type] || (() => '');
        },
        cleanup: () => {}
    };
    
    initializeFileState(appState, 'Novo Contrato', 'contrato.contract', 'contract-manager');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
