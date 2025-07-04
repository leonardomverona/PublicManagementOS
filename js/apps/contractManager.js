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
    
    // Elimina CNPJs inválidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Cálculo dos dígitos verificadores
    const calcDigits = (slice) => {
        let sum = 0;
        let pos = slice.length - 7;
        
        for (let i = slice.length; i >= 1; i--) {
            sum += slice.charAt(slice.length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return result;
    };
    
    const base = cnpj.substring(0, 12);
    const digit1 = calcDigits(base);
    const digit2 = calcDigits(base + digit1);
    
    return parseInt(cnpj.charAt(12)) === digit1 && 
           parseInt(cnpj.charAt(13)) === digit2;
}

export function openContractManager() {
    const uniqueSuffix = generateId('contract');
    const winId = window.windowManager.createWindow('Gestão de Contratos 2.0', '', { 
        width: '1400px', 
        height: '900px', 
        appType: 'contract-manager' 
    });
    
    const content = `
    <div class="app-toolbar">${getStandardAppToolbarHTML()}</div>
    <div class="contract-container-v2">
        <div class="contract-dashboard">
            <div class="dashboard-header">
                <h3><i class="fas fa-chart-line"></i> Dashboard de Contratos</h3>
                <div class="dashboard-filters">
                    <select id="timeFilter_${uniqueSuffix}" class="app-select">
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="365">Último ano</option>
                        <option value="all">Todos</option>
                    </select>
                    <button id="refreshDashboard_${uniqueSuffix}" class="app-button"><i class="fas fa-sync-alt"></i></button>
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
                    <div class="card-label>Vencem em 30 dias</div>
                    <div class="card-icon"><i class="fas fa-exclamation-triangle"></i></div>
                </div>
                
                <div class="dashboard-card">
                    <div class="card-value" id="pendingActions_${uniqueSuffix}">0</div>
                    <div class="card-label>Ações Pendentes</div>
                    <div class="card-icon"><i class="fas fa-tasks"></i></div>
                </div>
            </div>
            
            <div class="dashboard-charts">
                <div class="chart-container">
                    <canvas id="financialChart_${uniqueSuffix}" height="250"></canvas>
                </div>
                <div class="chart-container">
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
    </div>
    
    <!-- Modal de Contrato -->
    <div id="contractModal_${uniqueSuffix}" class="contract-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h4><i class="fas fa-file-contract"></i> <span id="modalTitle_${uniqueSuffix}">Novo Contrato</span></h4>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <!-- O conteúdo do contrato será carregado aqui dinamicamente -->
            </div>
        </div>
    </div>
    
    <style>
        .contract-container-v2 {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 15px;
            background: #f8fafc;
        }
        
        .contract-dashboard {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .dashboard-filters {
            display: flex;
            gap: 10px;
        }
        
        .dashboard-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 15px;
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
        
        .dashboard-card:nth-child(2) {
            border-left-color: #2ecc71;
        }
        
        .dashboard-card:nth-child(3) {
            border-left-color: #f39c12;
        }
        
        .dashboard-card:nth-child(4) {
            border-left-color: #e74c3c;
        }
        
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
        
        .dashboard-charts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .chart-container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
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
        
        /* Modal Styles */
        .contract-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: white;
            border-radius: 10px;
            width: 90%;
            max-width: 1200px;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .modal-header {
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #718096;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .collapsible-section {
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .section-header {
            padding: 15px;
            background: #f8fafc;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .section-content {
            padding: 20px;
            background: white;
            display: none;
        }
        
        .section-content.expanded {
            display: block;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .automated-field {
            background-color: #f0f9ff;
            border: 1px dashed #90cdf4;
        }
    </style>`;
    
    const winData = window.windowManager.windows.get(winId);
    if (!winData) return winId;
    
    winData.element.querySelector('.window-content').innerHTML = content;
    
    const appState = {
        winId,
        appDataType: 'contract-manager',
        contracts: [],
        currentContract: null,
        charts: {},
        ui: {
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
            modal: {
                element: document.getElementById(`contractModal_${uniqueSuffix}`),
                title: document.getElementById(`modalTitle_${uniqueSuffix}`),
                body: document.querySelector(`#contractModal_${uniqueSuffix} .modal-body`),
                closeBtn: document.querySelector(`#contractModal_${uniqueSuffix} .modal-close`)
            }
        },
        init: function() {
            setupAppToolbarActions(this);
            
            // Carrega dados de exemplo
            this.loadSampleData();
            
            // Configura eventos
            this.ui.dashboard.addContractBtn.onclick = () => this.openContractModal();
            this.ui.dashboard.refreshBtn.onclick = () => this.refreshDashboard();
            this.ui.modal.closeBtn.onclick = () => this.closeModal();
            this.ui.modal.element.onclick = (e) => {
                if (e.target === this.ui.modal.element) this.closeModal();
            };
            
            // Renderiza dashboard inicial
            this.renderDashboard();
        },
        loadSampleData: function() {
            // Dados de exemplo para demonstração
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
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Valor dos Contratos'
                        }
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
                    plugins: {
                        title: {
                            display: true,
                            text: 'Status dos Contratos'
                        }
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
            this.ui.modal.element.style.display = 'flex';
        },
        closeModal: function() {
            this.ui.modal.element.style.display = 'none';
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
                <div class="form-grid">
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
                        <input type="number" id="contractTotalValue" class="app-input automated-field" 
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
                </div>
                
                <div class="collapsible-section">
                    <div class="section-header" onclick="toggleSection(this)">
                        <h5><i class="fas fa-list"></i> Itens do Contrato</h5>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="section-content">
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
                
                <div class="form-actions">
                    <button id="saveContractBtn" class="app-button primary">
                        <i class="fas fa-save"></i> Salvar Contrato
                    </button>
                    <button id="cancelContractBtn" class="app-button">
                        Cancelar
                    </button>
                </div>
                
                <script>
                    function toggleSection(header) {
                        const content = header.nextElementSibling;
                        const icon = header.querySelector('i.fa-chevron-down');
                        content.classList.toggle('expanded');
                        icon.classList.toggle('fa-chevron-up');
                        icon.classList.toggle('fa-chevron-down');
                    }
                </script>
            `;
            
            // Configura eventos
            document.getElementById('cancelContractBtn').onclick = () => this.closeModal();
            document.getElementById('saveContractBtn').onclick = () => this.saveContract();
            document.getElementById('addItemBtn').onclick = () => this.addContractItem();
            
            // Configura validação de CNPJ
            this.setupCNPJValidation();
            
            // Expande a primeira seção
            document.querySelector('.section-header').click();
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
                if (input.id !== 'cancelContractBtn') {
                    input.disabled = true;
                }
            });
            
            document.getElementById('saveContractBtn').style.display = 'none';
        },
        editContract: function(contractId) {
            this.openContractModal(contractId);
            document.getElementById('saveContractBtn').style.display = 'block';
        },
        refreshDashboard: function() {
            this.renderDashboard();
            showNotification('Dashboard atualizado', 2000);
        }
    };
    
    initializeFileState(appState, 'Contratos 2.0', 'contracts.dash', 'contract-manager');
    winData.currentAppInstance = appState;
    appState.init();
    return winId;
}
