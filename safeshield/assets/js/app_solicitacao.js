const API_BASE = 'http://localhost/SAFESHIELD/api';

document.addEventListener('DOMContentLoaded', () => {
    listarKanban();
    const btnNovo = document.querySelector('.botao-novo');
    if(btnNovo) btnNovo.addEventListener('click', () => { document.getElementById('modal-nova-solicitacao').style.display = 'flex'; });
    const formSolicitacao = document.getElementById('form-solicitacao');
    if(formSolicitacao) formSolicitacao.addEventListener('submit', criarSolicitacao);
});

async function listarKanban() {
    try {
        const [resSol, resFunc, resEpi] = await Promise.all([
            fetch(`${API_BASE}/solicitacao/`),
            fetch(`${API_BASE}/funcionario/`),
            fetch(`${API_BASE}/epi/`)
        ]);

        const solicitacoes = (await resSol.json()).data || [];
        const funcionarios = (await resFunc.json()).data || [];
        const epis = (await resEpi.json()).data || [];

        const mapaFunc = {}; funcionarios.forEach(f => mapaFunc[f.id_funcionario] = f);
        const mapaEpi = {}; epis.forEach(e => mapaEpi[e.cod_epi] = e);

        limparColunas();
        atualizarSelectsModal(funcionarios, epis);

        solicitacoes.forEach(sol => {
            const func = mapaFunc[sol.cod_funcionario_pedido] || { nome: 'Desconhecido', setor: '-' };
            const epi = mapaEpi[sol.cod_epi_solicitado] || { nome: 'EPI Removido' };
            criarCard(sol, func, epi);
        });

        atualizarContadores();
    } catch (error) { console.error("Erro:", error); }
}

function criarCard(sol, func, epi) {
    let colunaId = '', bordaClass = '', botoesHtml = '', infoExtra = '';

    switch(sol.status_solicitacao) {
        case 'Pendente': 
            colunaId = 'coluna-pendente'; 
            bordaClass = 'border-pendente';
            botoesHtml = `
                <button onclick="mudarStatus(${sol.id_solicitacao}, 'Aprovado')" style="color: var(--azul-primario);">Aprovar</button>
                <button onclick="mudarStatus(${sol.id_solicitacao}, 'Recusado')" style="color: var(--vermelho-texto);">Recusar</button>
            `;
            break;
        case 'Aprovado': 
            colunaId = 'coluna-aprovado'; 
            bordaClass = 'border-aprovado';
            botoesHtml = `
                <button onclick="mudarStatus(${sol.id_solicitacao}, 'Entregue')" style="background: var(--azul-primario); color: white; padding: 4px 8px; border-radius: 4px;">Registrar Entrega</button>
            `;
            break;
        case 'Entregue': 
            colunaId = 'coluna-entregue'; 
            bordaClass = 'border-entregue';
            botoesHtml = `<span style="color: green;"><i class="fa-solid fa-check"></i> Concluído</span>`;
            
            if(sol.data_validade_epi) {
                infoExtra = `<div style="background: #e8f5e9; color: #2e7d32; font-size: 11px; padding: 5px; margin-top: 5px; border-radius: 4px;">
                                <i class="fa-regular fa-clock"></i> Válido até: <strong>${formatarData(sol.data_validade_epi)}</strong>
                             </div>`;
            }
            break;
        case 'Recusado': 
            colunaId = 'coluna-recusado'; 
            bordaClass = 'border-recusado';
            botoesHtml = `<span>${sol.motivo_recusa || 'Recusado'}</span>`;
            break;
        default: return; 
    }

    const iniciais = func.nome.substring(0,2).toUpperCase();

    const card = document.createElement('div');
    card.className = `card-solicitacao ${bordaClass}`;
    card.innerHTML = `
        <div class="card-header">
            <span class="id-solicitacao">#SOL-${sol.id_solicitacao}</span>
            <i class="fa-solid fa-trash" style="color: #ccc; cursor: pointer;" onclick="deletarSolicitacao(${sol.id_solicitacao})"></i>
        </div>
        <div class="card-body">
            <span class="nome-epi">${epi.nome}</span>
            <div class="info-solicitante">
                <div class="avatar-letras">${iniciais}</div>
                <span>${func.nome} <br><small style="color:#999">${func.setor}</small></span>
            </div>
            ${infoExtra} </div>
        <div class="card-footer">
            <span>${formatarData(sol.data_solicitacao)}</span>
            <div style="display:flex; gap:10px; font-weight:600; font-size:11px; cursor:pointer;">
                ${botoesHtml}
            </div>
        </div>
    `;
    document.getElementById(colunaId).appendChild(card);
}

async function mudarStatus(id, novoStatus) {
    const payload = { status_solicitacao: novoStatus };

    if(novoStatus === 'Recusado') {
        // ALTERADO: prompt -> meuPrompt
        const motivo = await meuPrompt("Motivo da recusa:");
        if(!motivo) return;
        payload.motivo_recusa = motivo;
        payload.cod_funcionario_aprovacao = 1; 
    }
    
    if(novoStatus === 'Aprovado') {
        payload.cod_funcionario_aprovacao = 1;
    }

    if(novoStatus === 'Entregue') {
        // ALTERADO: confirm -> meuConfirm
        if(! await meuConfirm("Confirmar entrega do EPI ao funcionário?")) return;
        
        const hoje = new Date();
        const sugestao = new Date();
        sugestao.setDate(hoje.getDate() + 180);
        const dataSugestaoString = sugestao.toISOString().split('T')[0];

        // Se quiser usar o PROMPT para data, seria assim:
        // const dataDigitada = await meuPrompt("Validade (AAAA-MM-DD):", dataSugestaoString);
        // if(!dataDigitada) return;
        // payload.data_validade_epi = dataDigitada;

        // Por enquanto, mantendo o automático ou fixo da sua lógica anterior:
        payload.data_entrega = hoje.toISOString().split('T')[0];
        payload.data_validade_epi = dataSugestaoString;
    }

    try {
        const res = await fetch(`${API_BASE}/solicitacao/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        listarKanban();
    } catch (erro) { console.error(erro); }
}

async function criarSolicitacao(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    if(!dados.data_solicitacao) dados.data_solicitacao = new Date().toISOString().split('T')[0];

    try {
        await fetch(`${API_BASE}/solicitacao/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        fecharModal(); // Fecha o modal do formulário
        await meuAlerta("Solicitação criada com sucesso!"); // Adicionei um feedback visual
        listarKanban();
    } catch (erro) { console.error(erro); }
}

async function deletarSolicitacao(id) {
    // ALTERADO: confirm -> meuConfirm
    if(! await meuConfirm("Deseja realmente excluir esta solicitação?")) return;
    await fetch(`${API_BASE}/solicitacao/${id}`, { method: 'DELETE' });
    listarKanban();
}

function limparColunas() {
    ['coluna-pendente', 'coluna-aprovado', 'coluna-entregue', 'coluna-recusado'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
}
function atualizarContadores() {
    ['pendente', 'aprovado', 'entregue', 'recusado'].forEach(t => {
        document.getElementById(`count-${t}`).innerText = document.getElementById(`coluna-${t}`).children.length;
    });
}
function atualizarSelectsModal(funcionarios, epis) {
    const selFunc = document.querySelector('select[name="cod_funcionario_pedido"]');
    const selEpi = document.querySelector('select[name="cod_epi_solicitado"]');
    selFunc.innerHTML = '<option value="">Selecione...</option>';
    funcionarios.forEach(f => selFunc.innerHTML += `<option value="${f.id_funcionario}">${f.nome}</option>`);
    selEpi.innerHTML = '<option value="">Selecione...</option>';
    epis.forEach(e => selEpi.innerHTML += `<option value="${e.cod_epi}">${e.nome}</option>`);
}
function formatarData(data) {
    if(!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}