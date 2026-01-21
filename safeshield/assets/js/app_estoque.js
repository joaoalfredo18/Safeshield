const API_URL = 'http://localhost/SAFESHIELD/api/epi/';

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('tabela-estoque')) listarEpis();
    const formEpi = document.getElementById('form-epi');
    if(formEpi) formEpi.addEventListener('submit', salvarEpi);
});

async function listarEpis() {
    const tbody = document.getElementById('tabela-estoque');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Carregando estoque...</td></tr>';

    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        tbody.innerHTML = ''; 

        if(json.error) { 
            await meuAlerta(json.message); // ALTERADO
            return; 
        }
        const lista = json.data || [];

        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Nenhum EPI cadastrado.</td></tr>';
            return;
        }

        const hoje = new Date();
        const alerta30Dias = new Date();
        alerta30Dias.setDate(hoje.getDate() + 30);

        lista.forEach(epi => {
            let statusBadge = '<span class="etiqueta bg-verde">Em Estoque</span>';
            const qtd = parseInt(epi.quantidade);
            if(qtd === 0) statusBadge = '<span class="etiqueta bg-vermelho">Esgotado</span>';
            else if(qtd < 10) statusBadge = '<span class="etiqueta bg-laranja">Estoque Baixo</span>';

            let estiloValidade = '';
            let iconeAlerta = '';
            
            if(epi.data_validade_lote) {
                const dataVal = new Date(epi.data_validade_lote);
                if(dataVal < alerta30Dias) {
                    estiloValidade = 'color: var(--vermelho-texto); font-weight: bold;';
                    iconeAlerta = ' <i class="fa-solid fa-triangle-exclamation" title="Vencimento Próximo ou Vencido"></i>';
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 15px 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: #e3f2fd; color: #0d47a1; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-helmet-safety"></i>
                        </div>
                        <span style="font-weight: 600;">${epi.nome}</span>
                    </div>
                </td>
                <td>${epi.ca}</td>
                <td>${epi.descricao || '-'}</td> 
                <td style="font-weight: 600;">${epi.quantidade} un</td>
                <td style="${estiloValidade}">${formatarData(epi.data_validade_lote)}${iconeAlerta}</td>
                <td>${statusBadge}</td>
                <td style="text-align: right; padding-right: 20px;">
                    <div class="acoes-tabela">
                        <button class="btn-acao deletar" onclick="deletarEpi(${epi.cod_epi})" title="Excluir"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) { console.error(error); }
}

async function salvarEpi(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        const json = await response.json();
        if(!json.error) {
            await meuAlerta("EPI cadastrado com sucesso!"); // ALTERADO
            window.location.href = 'estoque.html';
        } else { 
            await meuAlerta("Erro: " + json.message); // ALTERADO
        }
    } catch (error) { console.error(error); }
}

async function deletarEpi(id) {
    // ALTERADO: confirm -> meuConfirm
    if(! await meuConfirm("Tem certeza que deseja remover este EPI?")) return;
    
    await fetch(API_URL + id, { method: 'DELETE' });
    listarEpis();
    await meuAlerta("EPI excluído."); // Opcional: feedback visual
}

function formatarData(dataUS) {
    if(!dataUS) return '-';
    const [ano, mes, dia] = dataUS.split('-');
    return `${dia}/${mes}/${ano}`;
}