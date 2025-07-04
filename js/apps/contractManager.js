import { generateId, showNotification } from '../main.js';
import { getStandardAppToolbarHTML, initializeFileState, setupAppToolbarActions } from './app.js';
import Chart from 'chart.js/auto';

// Funções utilitárias
function formatCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    const calcDigits = (slice) => {
        let sum = 0;
        let pos = slice.length - 7;
        
        for (let i = slice.length; i >= 1; i--) {
            sum += slice.charAt(slice.length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        return sum % 11 < 2 ? 0 : 11 - (sum % 11);
    };
    
    const base = cnpj.substring(0, 12);
    const digit1 = calcDigits(base);
    const digit2 = calcDigits(base + digit1);
    
    return parseInt(cnpj.charAt(12)) === digit1 && 
           parseInt(cnpj.charAt(13)) === digit2;
}

export function openContractManager() {
    const uniqueSuffix = generateId('contract');
    const winId = window.windowManager.createWindow('Gestão de Contratos', '', { 
        width: '1400px', 
        height: '900px', 
        appType: 'contract-manager' 
    });

    // Estrutura HTML unificada
    const content = `
    <style>
        :root {
            --separator-color: #ddd; 
            --toolbar-bg: #f8f9fa; 
            --window-bg: #fff; 
            --text-color: #212529;
        }
        .dark-mode {
            --separator-color: #444; 
            --toolbar-bg: #333; 
            --window-bg: #2a2a2a; 
            --text-color: #f1f1f1;
        }
        .contract-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
            background-color: var(--window-bg);
            color: var(--text-color);
        }
        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .tabs-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .contract-tracking-tabs {
            display: flex;
            flex-shrink: 0;
            border-bottom: 1px solid var(--separator-color);
            background-color: var(--toolbar-bg);
        }
        .contract-tab-button {
            background: transparent;
            border: none;
            padding: 10px 15px;
            cursor: pointer;
            color: var(--text-color);
            border-bottom: 2px solid transparent;
        }
        .contract-tab-button.active {
            font-weight: bold;
            border-bottom-color: #3498db;
        }
        .contract-tab-content {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .kpi-card {
            background: var(--toolbar-bg);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .kpi-title {
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        .kpi-value {
            font-size: 2em;
            font-weight: 700;
        }
        .kpi-subtext {
            font-size: 0.8em;
            opacity: 0.7;
        }
        .kpi-value.kpi-good { color: #28a745; } 
        .kpi-value.kpi-warn { color: #ffc107; } 
        .kpi-value.kpi-danger { color: #dc3545; }
        .chart-container {
            display: flex;
            gap: 20px;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        .chart-wrapper {
            background-color: var(--toolbar-bg);
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            width: 48%;
            min-width: 300px;
            height: 300px;
        }
        .chart-title {
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
        }
        .dashboard-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .dashboard-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            position: relative;
            overflow: hidden;
            border-left: 4px solid #3498db;
        }
        .dashboard-card:nth-child(2) { border-left-color: #2ecc71; }
        .dashboard-card:nth-child(3) { border-left-color: #f39c12; }
        .dashboard-card:nth-child(4) { border-left-color: #e74c3c; }
        .card-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .card-label {
            color: #718096;
            font-size: 14px;
        }
        .card-icon {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 24px;
            color: #e2e8f0;
        }
        .contracts-list {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .modal-overlay { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.6); 
            z-index: 2000; 
            display: none; 
            align-items: center; 
            justify-content: center; 
        }
        .modal-content { 
            background: var(--window-bg); 
            padding: 20px; 
            border-radius: 8px; 
            width: 90%; 
            max-width: 700px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); 
        }
        .modal-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 10px; 
            border-bottom: 1px solid var(--separator-color); 
        }
        .modal-title { 
            font-size: 1.3em; 
            font-weight: 700; 
        }
        .modal-close { 
            background: none; 
            border: 0; 
            font-size: 1.8em; 
            cursor: pointer; 
            line-height: 1; 
        }
        .modal-form-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
            gap: 15px; 
        }
        .modal-footer { 
            text-align: right; 
            margin-top: 25px; 
            padding-top: 15px; 
            border-top: 1px solid var(--separator-color); 
        }
        .app-table { 
            table-layout: fixed; 
            width: 100%; 
            border-collapse: collapse; 
        }
        .app-table th, .app-table td { 
            word-wrap: break-word; 
            padding: 8px; 
            text-align: left; 
            border-bottom: 1px solid var(--separator-color); 
        }
        .app-table th { 
            background-color: var(--toolbar-bg); 
        }
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 500;
        }
        .ativo { background-color: #d4edda; color: #155724; }
        .prorrogado { background-color: #fff3cd; color: #856404; }
        .suspenso { background-color: #f8d7da; color: #721c24; }
        .elaboracao { background-color: #cce5ff; color: #004085; }
        .invalid-input { border: 2px solid #e74c3c !important; }
        .cnpj-hint {
            font-size: 0.8em;
            color: #6c757d;
            margin-top: 4px;
        }
    </style>

    <div class="app-toolbar">${getStandardAppToolbarHTML()}</div>
    <div class="contract-container">
        <div class="main-content">
            <div class="tabs-column">
                <div class="contract-tracking-tabs">
                    <button class="contract-tab-button active" data-tab="dashboard">
                        <i class="fas fa-chart-pie"></i> Dashboard
                    </button>
                    <button class="contract-tab-button" data-tab="financial">
                        <i class="fas fa-coins"></i> Financeiro
                    </button>
                    <button class="contract-tab-button" data-tab="physical">
                        <i class="fas fa-tasks"></i> Físico
                    </button>
                    <button class="contract-tab-button" data-tab="amendments">
                        <i class="fas fa-file-medical"></i> Aditivos
                    </button>
                    <button class="contract-tab-button" data-tab="invoices">
                        <i class="fas fa-receipt"></i> Notas Fiscais
                    </button>
                </div>
                
                <!-- Conteúdo da Aba Dashboard -->
                <div class="contract-tab-content" data-tab-content="dashboard">
                    <div class="dashboard-header">
                        <h3><i class="fas fa-chart-line"></i> Dashboard de Contratos</h3>
                        <div class="dashboard-filters">
                            <select id="timeFilter_${uniqueSuffix}" class="app-select">
                                <option value="30">Últimos 30 dias</option>
                                <option value="90">Últimos 90 dias</option>
                                <option value="365">Último ano</option>
                                <option value="all">Todos</option>
                            </select>
                            <button id="refreshDashboard_${uniqueSuffix}" class="app-button">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="dashboard-cards">
                        <div class="dashboard-card">
                            <div class="card-value" id="totalValue_${uniqueSuffix}">R$ 0,00</div>
                            <div class="card-label">Valor Total</div>
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
                            <div class="card-value" id="pendingActions_${uniqueSuffix}">0</div>
                            <div class="card-label">Ações Pendentes</div>
                            <div class="card-icon"><i class="fas fa-tasks"></i></div>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-wrapper">
                            <div class="chart-title">Valor dos Contratos</div>
                            <canvas id="financialChart_${uniqueSuffix}" height="250"></canvas>
                        </div>
                        <div class="chart-wrapper">
                            <div class="chart-title">Status dos Contratos</div>
                            <canvas id="statusChart_${uniqueSuffix}" height="250"></canvas>
                        </div>
                    </div>
                    
                    <div class="contracts-list">
                        <div class="list-header">
                            <h4><i class="fas fa-list"></i> Contratos Recentes</h4>
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
                                        <th>Valor</th>
                                        <th>Status</th>
                                        <th>Vencimento</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Conteúdo das outras abas -->
                <div class="contract-tab-content" data-tab-content="financial" style="display:none;">
                    <button id="addFinancialBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;">
                        <i class="fas fa-plus"></i> Novo Lançamento
                    </button>
                    <div class="app-section">
                        <h4>Lançamentos Financeiros</h4>
                        <table class="app-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Valor</th>
                                    <th>Nº SEI</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="financialTableBody_${uniqueSuffix}"></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="contract-tab-content" data-tab-content="physical" style="display:none;">
                    <button id="addPhysicalBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;">
                        <i class="fas fa-plus"></i> Novo Marco
                    </button>
                    <div class="app-section">
                        <h4>Marcos de Entrega</h4>
                        <table class="app-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Previsto</th>
                                    <th>Realizado</th>
                                    <th>Status</th>
                                    <th>Nº SEI</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="physicalTableBody_${uniqueSuffix}"></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="contract-tab-content" data-tab-content="amendments" style="display:none;">
                    <button id="addAmendmentBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;">
                        <i class="fas fa-plus"></i> Novo Aditivo
                    </button>
                    <div class="app-section">
                        <h4>Termos Aditivos</h4>
                        <table class="app-table">
                            <thead>
                                <tr>
                                    <th>Nº</th>
                                    <th>Tipo</th>
                                    <th>Variação Valor</th>
                                    <th>Nova Vigência</th>
                                    <th>Nº SEI</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="amendmentsTableBody_${uniqueSuffix}"></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="contract-tab-content" data-tab-content="invoices" style="display:none;">
                    <button id="addInvoiceBtn_${uniqueSuffix}" class="app-button secondary" style="margin-bottom:15px;">
                        <i class="fas fa-plus"></i> Nova NF
                    </button>
                    <div class="app-section">
                        <h4>Notas Fiscais</h4>
                        <table class="app-table">
                            <thead>
                                <tr>
                                    <th>Nº</th>
                                    <th>Valor</th>
                                    <th>Emissão</th>
                                    <th>Vencimento</th>
                                    <th>Status</th>
                                    <th>Nº SEI</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="invoicesTableBody_${uniqueSuffix}"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal Geral -->
    <div class="modal-overlay" id="modalOverlay_${uniqueSuffix}">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="modalTitle_${uniqueSuffix}"></h3>
                <button class="modal-close" id="modalClose_${uniqueSuffix}">×</button>
            </div>
            <div class="modal-body" id="modalBody_${uniqueSuffix}"></div>
            <div class="modal-footer">
                <button class="app-button secondary" id="modalCancelBtn_${uniqueSuffix}">Cancelar</button>
                <button class="app-button primary" id="modalSaveBtn_${uniqueSuffix}">Salvar</button>
            </div>
        </div>
    </div>`;

    const winData = window.windowManager.windows.get(winId);
    if (!winData) return winId;
    
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId,
        appDataType: 'contract-manager',
        contracts: [],
        currentContract: null,
        charts: {},
        data: {
            details: { situacao: 'ativo', gestor: {}, fiscal: {}, valorGlobal: 0 },
            items: [], financial: [], physical: [], amendments: [], invoices: []
        },
        ui: {
            container: winData.element.querySelector('.contract-container'),
            dashboard: {
                totalValue: document.getElementById(`totalValue_${uniqueSuffix}`),
                activeContracts: document.getElementById(`activeContracts_${uniqueSuffix}`),
                expiringSoon: document.getElementById(`expiringSoon_${uniqueSuffix}`),
                pendingActions: document.getElementById(`pendingActions_${uniqueSuffix}`),
                financialChart: document.getElementById(`financialChart_${uniqueSuffix}`),
                statusChart: document.getElementById(`statusChart_${uniqueSuffix}`),
                contractsTable: document.getElementById(`contractsTable_${uniqueSuffix}`).querySelector('tbody'),
                addContractBtn: document.getElementById(`addContractBtn_${uniqueSuffix}`),
                refreshBtn: document.getElementById(`refreshDashboard_${uniqueSuffix}`),
                timeFilter: document.getElementById(`timeFilter_${uniqueSuffix}`)
            },
            tabButtons: winData.element.querySelectorAll('.contract-tracking-tabs .contract-tab-button'),
            tabContents: winData.element.querySelectorAll('.contract-tab-content'),
            buttons: {
                addFinancial: document.getElementById(`addFinancialBtn_${uniqueSuffix}`),
                addPhysical: document.getElementById(`addPhysicalBtn_${uniqueSuffix}`),
                addAmendment: document.getElementById(`addAmendmentBtn_${uniqueSuffix}`),
                addInvoice: document.getElementById(`addInvoiceBtn_${uniqueSuffix}`),
            },
            tables: {
                financial: document.getElementById(`financialTableBody_${uniqueSuffix}`),
                physical: document.getElementById(`physicalTableBody_${uniqueSuffix}`),
                amendments: document.getElementById(`amendmentsTableBody_${uniqueSuffix}`),
                invoices: document.getElementById(`invoicesTableBody_${uniqueSuffix}`),
            },
            modal: {
                overlay: document.getElementById(`modalOverlay_${uniqueSuffix}`),
                title: document.getElementById(`modalTitle_${uniqueSuffix}`),
                body: document.getElementById(`modalBody_${uniqueSuffix}`),
                saveBtn: document.getElementById(`modalSaveBtn_${uniqueSuffix}`),
                closeBtn: document.getElementById(`modalClose_${uniqueSuffix}`),
                cancelBtn: document.getElementById(`modalCancelBtn_${uniqueSuffix}`),
            }
        },
        currentModal: { mode: null, type: null, id: null },
        eventHandlers: {},

        init: function() {
            setupAppToolbarActions(this);
            this.loadSampleData();
            this.setupEventListeners();
            this.renderDashboard();
        },

        loadSampleData: function() {
            this.contracts = [
                {
                    id: 'ctr-001',
                    number: 'CTR/2023/001',
                    vendor: 'Empresa Fornecedora Ltda',
                    client: 'Ministério da Tecnologia',
                    totalValue: 150000,
                    status: 'ativo',
                    startDate: '2023-01-15',
                    endDate: '2024-01-14',
                    items: [
                        { description: 'Serviços de Consultoria', value: 80000 },
                        { description: 'Licenças de Software', value: 70000 }
                    ]
                },
                {
                    id: 'ctr-002',
                    number: 'CTR/2023/045',
                    vendor: 'Tech Solutions SA',
                    client: 'Secretaria de Educação',
                    totalValue: 230000,
                    status: 'prorrogado',
                    startDate: '2022-11-01',
                    endDate: '2023-12-31',
                    items: [
                        { description: 'Equipamentos de TI', value: 180000 },
                        { description: 'Manutenção Preventiva', value: 50000 }
                    ]
                },
                {
                    id: 'ctr-003',
                    number: 'CTR/2023/128',
                    vendor: 'Construções Moderna Ltda',
                    client: 'Departamento de Obras',
                    totalValue: 1850000,
                    status: 'ativo',
                    startDate: '2023-03-10',
                    endDate: '2024-03-09',
                    items: [
                        { description: 'Reforma do Prédio A', value: 1200000 },
                        { description: 'Instalações Elétricas', value: 650000 }
                    ]
                }
            ];
        },

        setupEventListeners: function() {
            // Dashboard
            this.ui.dashboard.addContractBtn.onclick = () => this.openContractModal();
            this.ui.dashboard.refreshBtn.onclick = () => this.refreshDashboard();
            
            // Modal
            this.ui.modal.closeBtn.onclick = () => this.closeModal();
            this.ui.modal.cancelBtn.onclick = () => this.closeModal();
            this.ui.modal.saveBtn.onclick = () => this.handleModalSave();
            this.ui.modal.overlay.onclick = (e) => {
                if (e.target === this.ui.modal.overlay) this.closeModal();
            };
            
            // Tabs
            this.ui.tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const tabName = e.currentTarget.dataset.tab;
                    this.ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                    this.ui.tabContents.forEach(content => content.style.display = 'none');
                    e.currentTarget.classList.add('active');
                    this.ui.container.querySelector(`[data-tab-content="${tabName}"]`).style.display = 'block';
                    if (tabName === 'dashboard') this.renderDashboard();
                });
            });
            
            // Botões de adição
            this.ui.buttons.addFinancial.onclick = () => this.openModal('add', 'financial');
            this.ui.buttons.addPhysical.onclick = () => this.openModal('add', 'physical');
            this.ui.buttons.addAmendment.onclick = () => this.openModal('add', 'amendment');
            this.ui.buttons.addInvoice.onclick = () => this.openModal('add', 'invoice');
        },

        renderDashboard: function() {
            // Atualiza cards
            const totalValue = this.contracts.reduce((sum, c) => sum + c.totalValue, 0);
            const activeContracts = this.contracts.filter(c => c.status === 'ativo').length;
            const expiringSoon = this.contracts.filter(c => {
                const endDate = new Date(c.endDate);
                const today = new Date();
                const diffTime = endDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays > 0;
            }).length;
            
            this.ui.dashboard.totalValue.textContent = `R$ ${totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            this.ui.dashboard.activeContracts.textContent = activeContracts;
            this.ui.dashboard.expiringSoon.textContent = expiringSoon;
            this.ui.dashboard.pendingActions.textContent = this.contracts.filter(c => c.status === 'pendente').length;
            
            // Atualiza tabela de contratos
            this.renderContractsTable();
            
            // Renderiza gráficos
            this.renderCharts();
        },

        renderContractsTable: function() {
            const tbody = this.ui.dashboard.contractsTable;
            tbody.innerHTML = '';
            
            this.contracts.forEach(contract => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contract.number}</td>
                    <td>${contract.vendor}</td>
                    <td>R$ ${contract.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td><span class="status-badge ${contract.status}">${this.getStatusText(contract.status)}</span></td>
                    <td>${new Date(contract.endDate).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <button class="app-button small view-contract" data-id="${contract.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="app-button small edit-contract" data-id="${contract.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Adiciona eventos aos botões
            tbody.querySelectorAll('.view-contract').forEach(btn => {
                btn.onclick = () => this.viewContract(btn.dataset.id);
            });
            
            tbody.querySelectorAll('.edit-contract').forEach(btn => {
                btn.onclick = () => this.editContract(btn.dataset.id);
            });
        },

        getStatusText: function(status) {
            const statusMap = {
                'elaboracao': 'Em Elaboração',
                'ativo': 'Ativo',
                'suspenso': 'Suspenso',
                'prorrogado': 'Prorrogado',
                'encerrado': 'Encerrado',
                'cancelado': 'Cancelado'
            };
            return statusMap[status] || status;
        },

        renderCharts: function() {
            // Destrói gráficos existentes
            if (this.charts.financial) this.charts.financial.destroy();
            if (this.charts.status) this.charts.status.destroy();
            
            // Dados para gráficos
            const contractValues = this.contracts.map(c => c.totalValue);
            const contractNames = this.contracts.map(c => c.number);
            const statusCounts = {
                ativo: 0,
                elaboracao: 0,
                prorrogado: 0,
                encerrado: 0,
                cancelado: 0
            };
            
            this.contracts.forEach(c => {
                if (statusCounts[c.status] !== undefined) {
                    statusCounts[c.status]++;
                }
            });
            
            // Gráfico financeiro
            this.charts.financial = new Chart(this.ui.dashboard.financialChart, {
                type: 'bar',
                data: {
                    labels: contractNames,
                    datasets: [{
                        label: 'Valor do Contrato (R$)',
                        data: contractValues,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Valor dos Contratos' }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            });
            
            // Gráfico de status
            this.charts.status = new Chart(this.ui.dashboard.statusChart, {
                type: 'doughnut',
                data: {
                    labels: ['Ativo', 'Em Elaboração', 'Prorrogado', 'Encerrado', 'Cancelado'],
                    datasets: [{
                        data: [
                            statusCounts.ativo,
                            statusCounts.elaboracao,
                            statusCounts.prorrogado,
                            statusCounts.encerrado,
                            statusCounts.cancelado
                        ],
                        backgroundColor: [
                            'rgba(46, 204, 113, 0.6)',
                            'rgba(52, 152, 219, 0.6)',
                            'rgba(155, 89, 182, 0.6)',
                            'rgba(149, 165, 166, 0.6)',
                            'rgba(231, 76, 60, 0.6)'
                        ],
                        borderColor: [
                            'rgba(46, 204, 113, 1)',
                            'rgba(52, 152, 219, 1)',
                            'rgba(155, 89, 182, 1)',
                            'rgba(149, 165, 166, 1)',
                            'rgba(231, 76, 60, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Status dos Contratos' }
                    }
                }
            });
        },

        openContractModal: function(contractId = null) {
            this.currentContract = contractId 
                ? this.contracts.find(c => c.id === contractId) 
                : null;
                
            this.ui.modal.title.textContent = this.currentContract 
                ? `Contrato: ${this.currentContract.number}` 
                : 'Novo Contrato';
                
            this.renderContractForm();
            this.ui.modal.overlay.style.display = 'flex';
        },

        renderContractForm: function() {
            const contract = this.currentContract || {
                id: generateId('ctr'),
                number: '',
                vendor: '',
                client: '',
                totalValue: 0,
                status: 'elaboracao',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                items: []
            };
            
            this.ui.modal.body.innerHTML = `
                <div class="modal-form-grid">
                    <div>
                        <label>Número do Contrato</label>
                        <input type="text" id="contractNumber" class="app-input" value="${contract.number}" 
                            placeholder="CTR/2023/001">
                    </div>
                    
                    <div>
                        <label>Contratada (CNPJ)</label>
                        <input type="text" id="contractVendor" class="app-input" value="${contract.vendor}" 
                            placeholder="00.000.000/0000-00">
                        <div class="cnpj-hint">Formato: 00.000.000/0000-00</div>
                    </div>
                    
                    <div>
                        <label>Contratante (CNPJ)</label>
                        <input type="text" id="contractClient" class="app-input" value="${contract.client}" 
                            placeholder="00.000.000/0000-00">
                        <div class="cnpj-hint">Formato: 00.000.000/0000-00</div>
                    </div>
                    
                    <div>
                        <label>Status</label>
                        <select id="contractStatus" class="app-select">
                            <option value="elaboracao" ${contract.status === 'elaboracao' ? 'selected' : ''}>Em Elaboração</option>
                            <option value="ativo" ${contract.status === 'ativo' ? 'selected' : ''}>Ativo/Vigente</option>
                            <option value="suspenso" ${contract.status === 'suspenso' ? 'selected' : ''}>Suspenso</option>
                            <option value="prorrogado" ${contract.status === 'prorrogado' ? 'selected' : ''}>Prorrogado</option>
                            <option value="encerrado" ${contract.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
                            <option value="cancelado" ${contract.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    
                    <div>
                        <label>Valor Total</label>
                        <input type="number" id="contractTotalValue" class="app-input" 
                            value="${contract.totalValue}" readonly>
                    </div>
                    
                    <div>
                        <label>Início Vigência</label>
                        <input type="date" id="contractStartDate" class="app-input" value="${contract.startDate}">
                    </div>
                    
                    <div>
                        <label>Término Vigência</label>
                        <input type="date" id="contractEndDate" class="app-input" value="${contract.endDate}">
                    </div>
                    
                    <div class="form-section" style="grid-column: 1 / -1;">
                        <h4>Itens do Contrato</h4>
                        <table class="app-table" id="itemsTable">
                            <thead>
                                <tr>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${contract.items.map(item => `
                                    <tr>
                                        <td><input type="text" class="app-input" value="${item.description}"></td>
                                        <td><input type="number" class="app-input item-value" value="${item.value}"></td>
                                        <td>
                                            <button class="app-button danger small">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <button id="addItemBtn" class="app-button secondary">
                            <i class="fas fa-plus"></i> Adicionar Item
                        </button>
                    </div>
                </div>
            `;
            
            // Configura eventos
            document.getElementById('addItemBtn').onclick = () => this.addContractItem();
            
            // Configura eventos para remoção de itens
            document.querySelectorAll('#itemsTable tbody tr button').forEach(btn => {
                btn.onclick = function() {
                    this.closest('tr').remove();
                };
            });
            
            // Configura eventos para atualização do valor total
            document.querySelectorAll('.item-value').forEach(input => {
                input.oninput = () => this.updateTotalValue();
            });
            
            // Configura validação de CNPJ
            this.setupCNPJValidation();
        },

        setupCNPJValidation: function() {
            const vendorInput = document.getElementById('contractVendor');
            const clientInput = document.getElementById('contractClient');
            
            vendorInput.addEventListener('input', function() {
                this.value = formatCNPJ(this.value);
            });
            
            clientInput.addEventListener('input', function() {
                this.value = formatCNPJ(this.value);
            });
            
            vendorInput.addEventListener('blur', function() {
                if (this.value && !validateCNPJ(this.value)) {
                    showNotification('CNPJ da Contratada inválido', 3000);
                    this.classList.add('invalid-input');
                } else {
                    this.classList.remove('invalid-input');
                }
            });
            
            clientInput.addEventListener('blur', function() {
                if (this.value && !validateCNPJ(this.value)) {
                    showNotification('CNPJ da Contratante inválido', 3000);
                    this.classList.add('invalid-input');
                } else {
                    this.classList.remove('invalid-input');
                }
            });
        },

        addContractItem: function() {
            const tbody = document.querySelector('#itemsTable tbody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="app-input" placeholder="Descrição do item"></td>
                <td><input type="number" class="app-input item-value" value="0"></td>
                <td>
                    <button class="app-button danger small">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
            
            // Adiciona evento ao botão de remover
            row.querySelector('button').onclick = function() {
                row.remove();
            };
            
            // Adiciona evento para atualizar valor total
            row.querySelector('.item-value').oninput = () => this.updateTotalValue();
        },

        updateTotalValue: function() {
            const itemValues = Array.from(document.querySelectorAll('.item-value'))
                .map(input => parseFloat(input.value) || 0);
            
            const totalValue = itemValues.reduce((sum, val) => sum + val, 0);
            document.getElementById('contractTotalValue').value = totalValue;
        },

        saveContract: function() {
            // Coleta dados do formulário
            const contractData = {
                id: this.currentContract?.id || generateId('ctr'),
                number: document.getElementById('contractNumber').value,
                vendor: document.getElementById('contractVendor').value,
                client: document.getElementById('contractClient').value,
                status: document.getElementById('contractStatus').value,
                totalValue: parseFloat(document.getElementById('contractTotalValue').value) || 0,
                startDate: document.getElementById('contractStartDate').value,
                endDate: document.getElementById('contractEndDate').value,
                items: Array.from(document.querySelectorAll('#itemsTable tbody tr')).map(row => {
                    const inputs = row.querySelectorAll('input');
                    return {
                        description: inputs[0].value,
                        value: parseFloat(inputs[1].value) || 0
                    };
                })
            };
            
            // Validações
            if (!contractData.number) {
                showNotification('Número do contrato é obrigatório', 3000);
                return;
            }
            
            if (!contractData.vendor || !validateCNPJ(contractData.vendor)) {
                showNotification('CNPJ da Contratada inválido', 3000);
                return;
            }
            
            if (!contractData.client || !validateCNPJ(contractData.client)) {
                showNotification('CNPJ da Contratante inválido', 3000);
                return;
            }
            
            if (contractData.items.length === 0) {
                showNotification('Adicione pelo menos um item ao contrato', 3000);
                return;
            }
            
            // Atualiza ou adiciona contrato
            if (this.currentContract) {
                const index = this.contracts.findIndex(c => c.id === this.currentContract.id);
                this.contracts[index] = contractData;
            } else {
                this.contracts.push(contractData);
            }
            
            showNotification('Contrato salvo com sucesso!', 3000);
            this.closeModal();
            this.refreshDashboard();
        },

        viewContract: function(contractId) {
            this.currentContract = this.contracts.find(c => c.id === contractId);
            this.openContractModal(contractId);
            
            // Desabilita campos no modo visualização
            const inputs = this.ui.modal.body.querySelectorAll('input, select, button');
            inputs.forEach(input => {
                if (input.id !== 'modalCancelBtn') {
                    input.disabled = true;
                }
            });
        },

        editContract: function(contractId) {
            this.openContractModal(contractId);
        },

        refreshDashboard: function() {
            this.renderDashboard();
            showNotification('Dashboard atualizado', 2000);
        },

        openModal: function(mode, type, id = null) {
            this.currentModal = { mode, type, id };
            const titleMap = {
                financial: 'Lançamento Financeiro',
                physical: 'Marco Físico',
                amendment: 'Aditivo',
                invoice: 'Nota Fiscal'
            };
            
            this.ui.modal.title.textContent = (mode === 'edit' ? 'Editar ' : 'Adicionar ') + titleMap[type];
            this.ui.modal.body.innerHTML = this.getModalFormHTML(type, id);
            this.ui.modal.overlay.style.display = 'flex';
        },

        getModalFormHTML: function(type, id = null) {
            const today = new Date().toISOString().split('T')[0];
            const entry = id ? this.data[type].find(i => i.id === id) : {};
            
            switch(type) {
                case 'financial':
                    return `
                    <div class="modal-form-grid">
                        <input type="date" id="f_date" class="app-input" value="${entry.date || today}">
                        <select id="f_type" class="app-select">
                            <option value="empenho" ${entry.type === 'empenho' ? 'selected' : ''}>Empenho</option>
                            <option value="liquidacao" ${entry.type === 'liquidacao' ? 'selected' : ''}>Liquidação</option>
                            <option value="pagamento" ${entry.type === 'pagamento' ? 'selected' : ''}>Pagamento</option>
                        </select>
                        <input type="number" step="0.01" id="f_value" class="app-input" 
                            placeholder="Valor (R$)" value="${entry.value || ''}">
                        <input id="f_sei_number" class="app-input" 
                            placeholder="Nº Documento SEI" value="${entry.sei_number || ''}">
                        <input id="f_sei_link" class="app-input" 
                            placeholder="Link do Documento SEI" value="${entry.sei_link || ''}">
                    </div>`;
                
                // Outros tipos (physical, amendment, invoice) seguem padrão similar
                default:
                    return `<div class="modal-form-grid">Formulário não implementado</div>`;
            }
        },

        handleModalSave: function() {
            const { mode, type, id } = this.currentModal;
            const dataArray = this.data[type] || [];
            
            let entry = mode === 'edit' 
                ? dataArray.find(e => e.id === id) 
                : { id: generateId(type) };
            
            if (!entry) return;
            
            // Atualiza dados do item
            const form = this.ui.modal.body;
            switch(type) {
                case 'financial':
                    entry.date = form.querySelector('#f_date').value;
                    entry.type = form.querySelector('#f_type').value;
                    entry.value = parseFloat(form.querySelector('#f_value').value) || 0;
                    entry.sei_number = form.querySelector('#f_sei_number').value;
                    entry.sei_link = form.querySelector('#f_sei_link').value;
                    break;
                // Outros tipos...
            }
            
            if (mode === 'add') {
                dataArray.push(entry);
            }
            
            this.closeModal();
            this.renderDashboard();
            showNotification(`${type === 'financial' ? 'Lançamento' : 'Item'} salvo com sucesso!`, 2000);
        },

        closeModal: function() {
            this.ui.modal.overlay.style.display = 'none';
            this.ui.modal.body.innerHTML = '';
            this.currentContract = null;
        }
    };
    
    initializeFileState(appState, 'Contratos', 'contracts.dash', 'contract-manager');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
