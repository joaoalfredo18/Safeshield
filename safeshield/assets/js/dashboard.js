
const API_BASE = 'http://localhost/SAFESHIELD/api'; 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Buscar dados de todas as APIs em paralelo
        const [resEpi, resFunc, resSolicitacao] = await Promise.all([
            fetch(`${API_BASE}/epi/`),
            fetch(`${API_BASE}/funcionario/`),
            fetch(`${API_BASE}/solicitacao/`)
        ]);

        const epis = (await resEpi.json()).data || [];
        const funcionarios = (await resFunc.json()).data || [];
        const solicitacoes = (await resSolicitacao.json()).data || [];

        // Criar Mapas para busca rápida (ID -> Objeto)
        // Isso evita loops excessivos
        const mapaEpi = {}; 
        epis.forEach(e => mapaEpi[e.cod_epi] = e);

        const mapaFunc = {};
        funcionarios.forEach(f => mapaFunc[f.id_funcionario] = f);

        // --- EXECUTAR AS FUNÇÕES DE TELA ---
        atualizarKPIs(epis, solicitacoes);
        renderizarGraficoAquisicoes(epis);
        renderizarListaPendentes(solicitacoes, mapaFunc, mapaEpi);
        renderizarTopEpis(solicitacoes, mapaEpi);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
});

function atualizarKPIs(epis, solicitacoes) {
    // KPI 1: Total de Entregues
    // Conta quantas solicitações têm status 'Entregue'
    const entregues = solicitacoes.filter(s => s.status_solicitacao === 'Entregue').length;
    document.getElementById('kpi-entregues').innerText = entregues;

    // KPI 2: Estoque Baixo (Critério: menos de 10 unidades)
    const estoqueBaixo = epis.filter(e => parseInt(e.quantidade) < 10).length;
    document.getElementById('kpi-baixo').innerText = estoqueBaixo;
    // KPI 3: Vencimento Próximo (Critério: vence nos próximos 30 dias)
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 30);

    const vencendo = epis.filter(e => {
        if(!e.data_validade_lote) return false;
        const validade = new Date(e.data_validade_lote);
        return validade >= hoje && validade <= dataLimite;
    }).length;
    
    document.getElementById('kpi-vencimento').innerText = vencendo;
}

function renderizarListaPendentes(solicitacoes, mapaFunc, mapaEpi) {
    const listaEl = document.getElementById('lista-pendentes');
    listaEl.innerHTML = '';

    // Filtra apenas pendentes e pega os 3 mais recentes
    const pendentes = solicitacoes
        .filter(s => s.status_solicitacao === 'Pendente')
        .slice(0, 3); // Pega só os 3 primeiros

    if(pendentes.length === 0) {
        listaEl.innerHTML = '<li style="text-align:center; padding:10px;">Nenhuma solicitação pendente.</li>';
        return;
    }

    pendentes.forEach(sol => {
        // Resolve os nomes usando os IDs
        const funcionario = mapaFunc[sol.cod_funcionario_pedido] || { nome: 'Desconhecido', setor: '-' };
        const iniciais = funcionario.nome.substring(0,2).toUpperCase();
        
        const li = document.createElement('li');
        li.className = 'item-pendente';
        li.innerHTML = `
            <div class="avatar-letras">${iniciais}</div>
            <div>
                <div style="font-weight: 600; font-size: 14px; color: var(--texto-escuro);">${funcionario.nome}</div>
                <div style="font-size: 12px; color: var(--texto-cinza);">Setor: ${funcionario.setor}</div>
            </div>
            <span class="status-badge status-pendente">Análise</span>
        `;
        listaEl.appendChild(li);
    });
}

function renderizarTopEpis(solicitacoes, mapaEpi) {
    // Conta frequência de cada EPI nas solicitações
    const contagem = {};
    solicitacoes.forEach(s => {
        const id = s.cod_epi_solicitado;
        contagem[id] = (contagem[id] || 0) + 1;
    });

    // Converte para array e ordena
    const ordenado = Object.entries(contagem)
        .sort((a, b) => b[1] - a[1]) // Maior para menor
        .slice(0, 3); // Top 3

    const tbody = document.getElementById('tabela-top-epis');
    tbody.innerHTML = '';

    ordenado.forEach(([id, qtd]) => {
        const epi = mapaEpi[id] || { nome: 'EPI Excluído', quantidade: 0 };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${epi.nome}</td>
            <td>${qtd} pedidos</td>
            <td style="color: ${parseInt(epi.quantidade) > 0 ? 'var(--verde-texto)' : 'var(--vermelho-texto)'}">
                ${parseInt(epi.quantidade) > 0 ? 'Disponível' : 'Esgotado'} (${epi.quantidade})
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarGraficoAquisicoes(epis) {
    const ctx = document.getElementById('meuGraficoEPI');
    if(!ctx) return;

    // Agrupar aquisições por Mês (Baseado na data_aquisicao_lote)
    // Formato do objeto: { '2025-01': 50, '2025-02': 120 }
    const dadosPorMes = {};
    
    epis.forEach(e => {
        if(e.data_aquisicao_lote && e.quantidade) {
            // Pega "AAAA-MM"
            const mesAno = e.data_aquisicao_lote.substring(0, 7); 
            dadosPorMes[mesAno] = (dadosPorMes[mesAno] || 0) + parseInt(e.quantidade);
        }
    });

    // Ordenar cronologicamente
    const mesesOrdenados = Object.keys(dadosPorMes).sort();
    const valores = mesesOrdenados.map(k => dadosPorMes[k]);
    
    // Formatar labels para 'Mes/Ano'
    const labels = mesesOrdenados.map(m => {
        const [ano, mes] = m.split('-');
        return `${mes}/${ano}`;
    });

    // Criar Gráfico
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Qtd Adquirida',
                data: valores,
                borderColor: '#0d47a1',
                backgroundColor: 'rgba(13, 71, 161, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0d47a1',
                pointBorderWidth: 2,
                pointRadius: 6,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0', drawBorder: false } },
                x: { grid: { display: false } }
            }
        }
    });
}