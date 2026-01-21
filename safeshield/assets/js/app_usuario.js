const API_BASE = 'http://localhost/SAFESHIELD/api';
let usuarioAtualId = null; 

document.addEventListener('DOMContentLoaded', () => {
    carregarUsuariosNoSelect();
    carregarOpcoesEPI();

    document.getElementById('select-usuario-atual').addEventListener('change', (e) => {
        usuarioAtualId = e.target.value;
        if(usuarioAtualId) {
            carregarDadosUsuario();
            document.getElementById('painel-conteudo').style.display = 'block';
        } else {
            document.getElementById('painel-conteudo').style.display = 'none';
        }
    });

    document.getElementById('form-pedir-epi').addEventListener('submit', realizarPedido);
    setupAbas();
});

async function carregarUsuariosNoSelect() {
    const res = await fetch(`${API_BASE}/funcionario/`);
    const json = await res.json();
    const select = document.getElementById('select-usuario-atual');
    json.data.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id_funcionario;
        opt.innerText = f.nome;
        select.appendChild(opt);
    });
}

async function carregarOpcoesEPI() {
    const res = await fetch(`${API_BASE}/epi/`);
    const json = await res.json();
    const select = document.getElementById('select-epi');
    json.data.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.cod_epi;
        opt.innerText = `${e.nome} (CA: ${e.ca})`;
        select.appendChild(opt);
    });
}

async function carregarDadosUsuario() {
    const res = await fetch(`${API_BASE}/solicitacao/`);
    const json = await res.json();
    const todasSolicitacoes = json.data || [];
    const minhasSolicitacoes = todasSolicitacoes.filter(s => s.cod_funcionario_pedido == usuarioAtualId);

    document.getElementById('kpi-total').innerText = minhasSolicitacoes.length;
    
    const devolvidos = minhasSolicitacoes.filter(s => s.status_devolucao === 'Devolvido').length;
    document.getElementById('kpi-devolvidos').innerText = devolvidos;

    renderizarMeusEpis(minhasSolicitacoes);
}

async function renderizarMeusEpis(lista) {
    const resEpi = await fetch(`${API_BASE}/epi/`);
    const listaEpis = (await resEpi.json()).data;
    const mapaEpi = {};
    listaEpis.forEach(e => mapaEpi[e.cod_epi] = e);

    const container = document.getElementById('lista-meus-epis');
    container.innerHTML = '';

    const emPosse = lista.filter(s => s.status_solicitacao === 'Entregue' && s.status_devolucao !== 'Devolvido');

    if(emPosse.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">Você não possui EPIs pendentes de devolução.</p>';
        return;
    }

    emPosse.forEach(sol => {
        const epi = mapaEpi[sol.cod_epi_solicitado] || { nome: 'EPI Desconhecido' };
        
        const div = document.createElement('div');
        div.className = 'card-simples';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <div class="icone-epi"><i class="fa-solid fa-helmet-safety"></i></div>
                <div>
                    <strong>${epi.nome}</strong>
                    <div style="font-size:12px; color:#666;">Entregue em: ${formatarData(sol.data_entrega)}</div>
                </div>
            </div>
            <button class="btn-devolver" onclick="devolverEpi(${sol.id_solicitacao})">
                Devolver
            </button>
        `;
        container.appendChild(div);
    });
}

async function realizarPedido(e) {
    e.preventDefault();
    if(!usuarioAtualId) return await meuAlerta("Selecione um usuário no topo!"); // ALTERADO

    const dados = {
        cod_funcionario_pedido: usuarioAtualId,
        cod_epi_solicitado: document.getElementById('select-epi').value,
        descricao_pedido: document.getElementById('motivo-pedido').value,
        data_solicitacao: new Date().toISOString().split('T')[0],
        status_solicitacao: 'Pendente'
    };

    try {
        const res = await fetch(`${API_BASE}/solicitacao/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        const json = await res.json();
        
        if(!json.error) {
            await meuAlerta("Solicitação enviada! Aguarde aprovação."); // ALTERADO
            e.target.reset();
            carregarDadosUsuario(); 
        } else {
            await meuAlerta("Erro: " + json.message); // ALTERADO
        }
    } catch (err) { console.error(err); }
}

async function devolverEpi(idSolicitacao) {
    // ALTERADO: confirm -> meuConfirm
    if(! await meuConfirm("Confirmar a devolução deste EPI ao almoxarifado?")) return;

    const dados = {
        status_solicitacao: 'Entregue', 
        status_devolucao: 'Devolvido', 
        data_devolucao: new Date().toISOString().split('T')[0]
    };

    try {
        const res = await fetch(`${API_BASE}/solicitacao/${idSolicitacao}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        
        await meuAlerta("Devolução registrada com sucesso!"); // ALTERADO
        carregarDadosUsuario(); 

    } catch (err) { console.error(err); }
}

function setupAbas() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('ativo'));
            tabContents.forEach(c => c.classList.remove('ativo'));
            btn.classList.add('ativo');
            document.getElementById(btn.dataset.target).classList.add('ativo');
        });
    });
}

function formatarData(data) {
    if(!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}