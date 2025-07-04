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
            <h4><i class="fas fa-file-signature"></i> Cadastro do Contrato</h4>
            <div class="form-section">
                <h5>Dados Básicos</h5>
                <div class="form-grid">
                    <input type="text" id="contractNumber_${uniqueSuffix}" class="app-input" placeholder="CONTRATO Nº" required>
                    <select id="contractStatus_${uniqueSuffix}" class="app-select">
                        <option value="elaboracao">Em Elaboração</option>
                        <option value="ativo" selected>Ativo/Vigente</option>
                        <option value="suspenso">Suspenso</option>
                        <option value="prorrogado">Prorrogado</option>
                        <option value="encerrado">Encerrado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                    <input type="text" id="contractVendor_${uniqueSuffix}" class="app-input" placeholder="CONTRATADA" required>
                    <input type="text" id="contractClient_${uniqueSuffix}" class="app-input" placeholder="CONTRATANTE" required>
                    <select id="contractType_${uniqueSuffix}" class="app-select">
                        <option value="">TIPO DE CONTRATO</option>
                        <option value="servico">Serviço</option>
                        <option value="fornecimento">Fornecimento</option>
                        <option value="obra">Obra</option>
                        <option value="licenca">Licença</option>
                    </select>
                    <input type="text" id="contractArea_${uniqueSuffix}" class="app-input" placeholder="ÁREA DEMANDANTE" required>
                </div>
            </div>
            
            <div class="form-section">
                <h5>Gestores</h5>
                <div class="form-grid">
                    <input type="text" id="managerName_${uniqueSuffix}" class="app-input" placeholder="Gestor (Nome)">
                    <input type="text" id="managerMASP_${uniqueSuffix}" class="app-input" placeholder="MASP">
                    <input type="text" id="managerSector_${uniqueSuffix}" class="app-input" placeholder="Setor">
                    <input type="email" id="managerEmail_${uniqueSuffix}" class="app-input" placeholder="E-mail">
                    <input type="tel" id="managerPhone_${uniqueSuffix}" class="app-input" placeholder="Telefone">
                    <input type="text" id="substituteManager_${uniqueSuffix}" class="app-input" placeholder="Gestor Substituto">
                </div>
            </div>
            
            <div class="form-section">
                <h5>Fiscais</h5>
                <div class="form-grid">
                    <input type="text" id="supervisorName_${uniqueSuffix}" class="app-input" placeholder="Fiscal (Nome)">
                    <input type="text" id="substituteSupervisor_${uniqueSuffix}" class="app-input" placeholder="Fiscal Substituto">
                </div>
            </div>
            
            <div class="form-section">
                <h5>Informações do Contrato</h5>
                <div class="form-grid">
                    <textarea id="contractObject_${uniqueSuffix}" class="app-textarea" placeholder="OBJETO" style="min-height:80px; grid-column: span 4;" required></textarea>
                    <select id="contractModality_${uniqueSuffix}" class="app-select" style="grid-column: span 2;">
                        <option value="">MODALIDADE</option>
                        <option value="pregão">Pregão</option>
                        <option value="concorrência">Concorrência</option>
                        <option value="tomada">Tomada de Preços</option>
                        <option value="inexigibilidade">Inexigibilidade</option>
                        <option value="dispensa">Dispensa</option>
                    </select>
                    <div class="input-sei" style="grid-column: span 2;">
                        <input type="text" id="contractSEI_${uniqueSuffix}" class="app-input" placeholder="Nº SEI">
                        <input type="text" id="contractSEILink_${uniqueSuffix}" class="app-input" placeholder="Link SEI">
                    </div>
                    <input type="number" id="contractTotalValue_${uniqueSuffix}" class="app-input" placeholder="VALOR GLOBAL ATUAL (R$)" step="0.01" min="0" required>
                </div>
            </div>
            
            <div class="form-section">
                <h5>Itens do Contrato</h5>
                <div class="contract-items-container">
                    <table class="app-table" id="contractItemsTable_${uniqueSuffix}">
                        <thead>
                            <tr>
                                <th>Nº SIAD</th>
                                <th>Descrição</th>
                                <th>Valor Físico</th>
                                <th>Valor Financeiro</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                    <button id="addContractItemBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Adicionar Item</button>
                </div>
            </div>
            
            <div class="form-section">
                <h5>Vigência e Assinatura</h5>
                <div class="form-grid">
                    <input type="date" id="contractStartDate_${uniqueSuffix}" class="app-input" title="VIGÊNCIA INICIAL" required>
                    <input type="date" id="contractEndDate_${uniqueSuffix}" class="app-input" title="VIGÊNCIA ATUAL" required>
                    <input type="date" id="contractSignatureDate_${uniqueSuffix}" class="app-input" title="DATA ASSINATURA">
                    <input type="text" id="contractBudget_${uniqueSuffix}" class="app-input" placeholder="DOTAÇÃO ORÇAMENTÁRIA" required>
                </div>
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
            <div class="tab-section-container">
                <div class="app-section">
                    <h4>Execução Financeira</h4>
                    <div class="table-container">
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
                    </div>
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
        </div>
        
        <div id="physical_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="tab-section-container">
                <div class="app-section">
                    <h4>Marcos/Entregas</h4>
                    <div class="table-container">
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
                    </div>
                    <button id="addPhysicalEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Marco</button>
                </div>
            </div>
        </div>
        
        <div id="amendments_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="tab-section-container">
                <div class="app-section">
                    <h4>Aditivos/Alterações</h4>
                    <div class="table-container">
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
                    </div>
                    <button id="addAmendmentEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> Aditivo</button>
                </div>
            </div>
        </div>
        
        <div id="invoices_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="tab-section-container">
                <div class="app-section">
                    <h4>Notas Fiscais</h4>
                    <div class="table-container">
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
                    </div>
                    <button id="addInvoiceEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-plus"></i> NF</button>
                </div>
            </div>
        </div>
        
        <div id="documents_${uniqueSuffix}" class="contract-tab-content" style="display:none;">
            <div class="tab-section-container">
                <div class="app-section">
                    <h4>Documentos</h4>
                    <div class="table-container">
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
                    </div>
                    <button id="addDocumentEntryBtn_${uniqueSuffix}" class="app-button secondary small-add"><i class="fas fa-link"></i> Adicionar</button>
                </div>
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
        .contract-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }
        
        .contract-main-form {
            overflow-y: auto;
            max-height: 50vh;
            padding-right: 10px;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .form-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #eee;
        }
        
        .form-section h5 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .contract-items-container {
            overflow-x: auto;
        }
        
        .contract-tracking-tabs {
            display: flex;
            overflow-x: auto;
            padding-bottom: 5px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            flex-wrap: nowrap;
        }
        
        .contract-tab-button {
            white-space: nowrap;
            padding: 8px 15px;
            background: #f0f0f0;
            border: none;
            border-radius: 4px 4px 0 0;
            margin-right: 5px;
            cursor: pointer;
        }
        
        .contract-tab-button.active {
            background: #3498db;
            color: white;
            font-weight: bold;
        }
        
        .contract-tab-content {
            flex: 1;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }
        
        .tab-section-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }
        
        .app-section {
            margin-bottom: 20px;
            flex-shrink: 0;
        }
        
        .table-container {
            overflow-x: auto;
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 10px;
            max-height: 300px;
        }
        
        .app-table {
            min-width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }
        
        .app-table th {
            background: #f5f5f5;
            position: sticky;
            top: 0;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
        }
        
        .app-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #eee;
        }
        
        .app-table td, .app-table th {
            min-width: 100px;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .app-table .app-input, .app-table .app-select {
            width: 100%;
            box-sizing: border-box;
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .input-sei {
            display: flex;
            gap: 5px;
        }
        
        .input-sei input {
            flex: 1;
        }
        
        .sei-link {
            color: #1a73e8;
            text-decoration: none;
            font-weight: 500;
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .sei-link:hover {
            text-decoration: underline;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 14px;
        }
        
        .alert-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .alert-summary > div {
            padding: 10px;
            border-radius: 4px;
            background: #f9f9f9;
            border: 1px solid #eee;
        }
        
        .alert-warning {
            background: #fff3cd !important;
            border-color: #ffeeba !important;
        }
        
        .alert-critical {
            background: #f8d7da !important;
            border-color: #f5c6cb !important;
        }
        
        .alert-history {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .alert-history li {
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
        }
        
        .action-button {
            padding: 5px 8px;
            min-width: auto;
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
                number: '',
                status: 'ativo',
                vendor: '',
                client: '',
                type: '',
                area: '',
                managerName: '',
                managerMASP: '',
                managerSector: '',
                managerEmail: '',
                managerPhone: '',
                substituteManager: '',
                supervisorName: '',
                substituteSupervisor: '',
                object: '',
                modality: '',
                seiNumber: '',
                seiLink: '',
                totalValue: 0,
                items: [],
                startDate: '',
                endDate: '',
                signatureDate: '',
                budget: ''
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
                number: winData.element.querySelector(`#contractNumber_${uniqueSuffix}`),
                status: winData.element.querySelector(`#contractStatus_${uniqueSuffix}`),
                vendor: winData.element.querySelector(`#contractVendor_${uniqueSuffix}`),
                client: winData.element.querySelector(`#contractClient_${uniqueSuffix}`),
                type: winData.element.querySelector(`#contractType_${uniqueSuffix}`),
                area: winData.element.querySelector(`#contractArea_${uniqueSuffix}`),
                managerName: winData.element.querySelector(`#managerName_${uniqueSuffix}`),
                managerMASP: winData.element.querySelector(`#managerMASP_${uniqueSuffix}`),
                managerSector: winData.element.querySelector(`#managerSector_${uniqueSuffix}`),
                managerEmail: winData.element.querySelector(`#managerEmail_${uniqueSuffix}`),
                managerPhone: winData.element.querySelector(`#managerPhone_${uniqueSuffix}`),
                substituteManager: winData.element.querySelector(`#substituteManager_${uniqueSuffix}`),
                supervisorName: winData.element.querySelector(`#supervisorName_${uniqueSuffix}`),
                substituteSupervisor: winData.element.querySelector(`#substituteSupervisor_${uniqueSuffix}`),
                object: winData.element.querySelector(`#contractObject_${uniqueSuffix}`),
                modality: winData.element.querySelector(`#contractModality_${uniqueSuffix}`),
                seiNumber: winData.element.querySelector(`#contractSEI_${uniqueSuffix}`),
                seiLink: winData.element.querySelector(`#contractSEILink_${uniqueSuffix}`),
                totalValue: winData.element.querySelector(`#contractTotalValue_${uniqueSuffix}`),
                startDate: winData.element.querySelector(`#contractStartDate_${uniqueSuffix}`),
                endDate: winData.element.querySelector(`#contractEndDate_${uniqueSuffix}`),
                signatureDate: winData.element.querySelector(`#contractSignatureDate_${uniqueSuffix}`),
                budget: winData.element.querySelector(`#contractBudget_${uniqueSuffix}`)
            },
            itemsTableBody: winData.element.querySelector(`#contractItemsTable_${uniqueSuffix} tbody`),
            addItemBtn: winData.element.querySelector(`#addContractItemBtn_${uniqueSuffix}`),
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
                this.data = data; 
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
            
            // Botão para adicionar itens do contrato
            this.ui.addItemBtn.onclick = () => {
                this.data.details.items.push({
                    id: generateId('item'),
                    siad: '',
                    description: '',
                    physicalValue: 0,
                    financialValue: 0
                });
                this.markDirty();
                this.renderItemsTable();
            };
            
            // Configuração dos botões de adição das abas
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
                due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
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
            
            // Eventos para tabela de itens
            if (this.ui.itemsTableBody) {
                this.ui.itemsTableBody.addEventListener('click', (e) => {
                    const button = e.target.closest('button[data-action="delete"]');
                    if (button) {
                        const rowId = button.closest('tr').dataset.id;
                        this.data.details.items = this.data.details.items.filter(item => item.id !== rowId);
                        this.markDirty();
                        this.renderItemsTable();
                    }
                });
                
                this.ui.itemsTableBody.addEventListener('input', (e) => {
                    const input = e.target.closest('input');
                    if (input) {
                        const rowId = input.closest('tr').dataset.id;
                        const field = input.dataset.field;
                        const item = this.data.details.items.find(i => i.id === rowId);
                        if (item) {
                            item[field] = input.type === 'number' ? 
                                parseFloat(input.value) || 0 : 
                                input.value;
                            this.markDirty();
                        }
                    }
                });
            }
            
            // Configuração dos eventos das tabelas de acompanhamento
            ['financial', 'physical', 'amendments', 'invoices', 'documents'].forEach(type => {
                const tableBody = this.ui[`${type}TableBody`];
                if (tableBody) {
                    tableBody.addEventListener('click', (e) => this.handleTableAction(e, type));
                    tableBody.addEventListener('input', (e) => this.handleTableInput(e, type));
                    tableBody.addEventListener('change', (e) => this.handleTableInput(e, type));
                }
            });
            
            // Eventos para campos do formulário
            Object.values(this.ui.detailsForm).forEach(input => {
                if (input) {
                    input.oninput = () => {
                        this.markDirty(); 
                        this.updateDetailsFromUI();
                    };
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
            
            // Renderização inicial
            this.renderAll();
            this.checkAlerts();
        },
        updateDetailsFromUI: function() {
            for(const key in this.ui.detailsForm){
                const input = this.ui.detailsForm[key];
                if (input) {
                    this.data.details[key] = input.type === 'number' ? 
                        parseFloat(input.value) || 0 : 
                        input.value;
                }
            }
            this.renderFinancialSummary();
            this.checkAlerts();
        },
        renderAll: function() {
            // Atualiza campos do formulário
            for(const key in this.ui.detailsForm){
                if(this.ui.detailsForm[key] && this.data.details[key] !== undefined) {
                    this.ui.detailsForm[key].value = this.data.details[key];
                }
            }
            
            // Renderiza tabela de itens
            this.renderItemsTable();
            
            // Renderiza tabelas das abas
            this.renderFinancialTable();
            this.renderPhysicalTable();
            this.renderAmendmentsTable();
            this.renderInvoicesTable();
            this.renderDocumentsTable();
            
            // Atualiza resumo e alertas
            this.renderFinancialSummary();
            this.checkAlerts();
        },
        renderItemsTable: function() {
            const tableBody = this.ui.itemsTableBody;
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            (this.data.details.items || []).forEach(item => {
                const row = tableBody.insertRow();
                row.dataset.id = item.id;
                row.innerHTML = `
                    <td><input type="text" class="app-input" value="${item.siad || ''}" data-field="siad"></td>
                    <td><input type="text" class="app-input" value="${item.description || ''}" data-field="description"></td>
                    <td><input type="number" class="app-input" value="${item.physicalValue || 0}" step="0.01" data-field="physicalValue"></td>
                    <td><input type="number" class="app-input" value="${item.financialValue || 0}" step="0.01" data-field="financialValue"></td>
                    <td>
                        <button class="app-button danger action-button" data-action="delete" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
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
