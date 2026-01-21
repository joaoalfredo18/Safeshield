const API_BASE = 'http://localhost/SAFESHIELD/api';

// Variáveis globais para os gráficos (para poder destruir e recriar)
let chartSetor = null;
let chartCusto = null;

document.addEventListener('DOMContentLoaded', () => {
    // Carrega dados iniciais (sem filtro ou filtro padrão)
    gerarRelatorio();

    // Configura o botão de filtrar
    const btnGerar = document.getElementById('btn-gerar');
    if(btnGerar) {
        btnGerar.addEventListener('click', gerarRelatorio);
    }
});

async function gerarRelatorio() {
    const tbody = document.getElementById('tabela-relatorio');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Processando dados...</td></tr>';

    try {
        // 1. Busca dados em paralelo
        const [resSol, resFunc, resEpi] = await Promise.all([
            fetch(`${API_BASE}/solicitacao/`),
            fetch(`${API_BASE}/funcionario/`),
            fetch(`${API_BASE}/epi/`)
        ]);

        const solicitacoes = (await resSol.json()).data || [];
        const funcionarios = (await resFunc.json()).data || [];
        const epis = (await resEpi.json()).data || [];

        // 2. Criar Mapas para acesso rápido
        const mapaFunc = {};
        funcionarios.forEach(f => mapaFunc[f.id_funcionario] = f);

        const mapaEpi = {};
        epis.forEach(e => mapaEpi[e.cod_epi] = e);

        // 3. Aplicar Filtros do Usuário
        const inicio = document.getElementById('filtro-inicio').value;
        const fim = document.getElementById('filtro-fim').value;
        const setor = document.getElementById('filtro-setor').value;

        const dadosFiltrados = solicitacoes.filter(sol => {
            const func = mapaFunc[sol.cod_funcionario_pedido];
            const dataSol = sol.data_solicitacao; // Formato YYYY-MM-DD

            // Filtro de Data
            if (inicio && dataSol < inicio) return false;
            if (fim && dataSol > fim) return false;

            // Filtro de Setor
            if (setor && func && func.setor !== setor) return false;

            return true;
        });

        // 4. Renderizar Tabela e Gráficos
        renderizarTabela(dadosFiltrados, mapaFunc, mapaEpi);
        atualizarGraficoSetor(dadosFiltrados, mapaFunc);
        atualizarGraficoCusto(dadosFiltrados, mapaEpi);

    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Erro ao carregar dados.</td></tr>';
    }
}

function renderizarTabela(lista, mapaFunc, mapaEpi) {
    const tbody = document.getElementById('tabela-relatorio');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum registro encontrado para este período.</td></tr>';
        return;
    }

    // Ordenar por data (mais recente primeiro)
    lista.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));

    lista.forEach(sol => {
        const func = mapaFunc[sol.cod_funcionario_pedido] || { nome: 'Desconhecido', setor: '-' };
        const epi = mapaEpi[sol.cod_epi_solicitado] || { nome: 'Removido', preco_unitario: 0 };
        
        // Define badge pelo status
        let badge = '';
        if(sol.status_solicitacao === 'Entregue') badge = '<span class="etiqueta bg-verde">Entregue</span>';
        else if(sol.status_solicitacao === 'Recusado') badge = '<span class="etiqueta bg-vermelho">Recusado</span>';
        else badge = '<span class="etiqueta bg-laranja">Pendente</span>';

        // Custo só existe se foi entregue (simulação)
        const custo = (sol.status_solicitacao === 'Entregue') ? `R$ ${parseFloat(epi.preco_unitario).toFixed(2)}` : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatarData(sol.data_solicitacao)}</td>
            <td>${func.nome}</td>
            <td>${func.setor}</td>
            <td>${epi.nome}</td>
            <td>${badge}</td>
            <td style="text-align: right;">${custo}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- GRÁFICO 1: PIZZA (Consumo por Setor) ---
function atualizarGraficoSetor(lista, mapaFunc) {
    const ctx = document.getElementById('graficoSetor').getContext('2d');
    
    // Agrupar contagem por setor
    const contagem = {};
    lista.forEach(sol => {
        const func = mapaFunc[sol.cod_funcionario_pedido];
        if(func) {
            const s = func.setor;
            contagem[s] = (contagem[s] || 0) + 1;
        }
    });

    const labels = Object.keys(contagem);
    const data = Object.values(contagem);

    // Destruir gráfico antigo se existir
    if(chartSetor) chartSetor.destroy();

    chartSetor = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#0d47a1', '#1976d2', '#42a5f5', '#90caf9', '#e0e0e0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// --- GRÁFICO 2: BARRAS (Custo Mensal) ---
function atualizarGraficoCusto(lista, mapaEpi) {
    const ctx = document.getElementById('graficoCusto').getContext('2d');
    
    // Agrupar custos por Mês (apenas entregues)
    const custoPorMes = {};
    
    lista.forEach(sol => {
        if(sol.status_solicitacao === 'Entregue') {
            const mesAno = sol.data_solicitacao.substring(0, 7); // YYYY-MM
            const epi = mapaEpi[sol.cod_epi_solicitado];
            if(epi) {
                custoPorMes[mesAno] = (custoPorMes[mesAno] || 0) + parseFloat(epi.preco_unitario);
            }
        }
    });

    // Ordenar chaves
    const meses = Object.keys(custoPorMes).sort();
    const valores = meses.map(m => custoPorMes[m]);
    const labels = meses.map(m => {
        const [ano, mes] = m.split('-');
        return `${mes}/${ano}`;
    });

    if(chartCusto) chartCusto.destroy();

    chartCusto = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Custo Total (R$)',
                data: valores,
                backgroundColor: '#0d47a1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

function formatarData(data) {
    if(!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}