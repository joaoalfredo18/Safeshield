const API_URL = 'http://localhost/SAFESHIELD/api/funcionario/';

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('tabela-funcionarios')) {
        listarFuncionarios();
    }
    const form = document.getElementById('form-funcionario');
    if(form) {
        form.addEventListener('submit', salvarFuncionario);
    }
});

async function listarFuncionarios() {
    const tbody = document.getElementById('tabela-funcionarios');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Carregando...</td></tr>';

    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        tbody.innerHTML = '';

        if(json.error) {
            await meuAlerta(json.message); // ALTERADO
            return;
        }

        const lista = json.data;
        if(lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Nenhum funcionário encontrado.</td></tr>';
            return;
        }

        lista.forEach(func => {
            const iniciais = func.nome.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
            let badgeGestor = func.permissao_aprovar_solicitacao === 'S' ? '<span class="etiqueta bg-laranja">Gestor</span>' : '<span class="etiqueta bg-verde">Colaborador</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 15px 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="avatar-letras">${iniciais}</div>
                        <div>
                            <div style="font-weight: 600; color: var(--texto-escuro);">${func.nome}</div>
                            <div style="font-size: 12px; color: var(--texto-cinza);">Setor: ${func.setor}</div>
                        </div>
                    </div>
                </td>
                <td style="font-family: monospace;">${func.matricula}</td>
                <td>${func.setor}</td>
                <td>${func.cargo}</td>
                <td>${formatarData(func.data_contratacao)}</td>
                <td>${badgeGestor}</td>
                <td style="text-align: right; padding-right: 20px;">
                    <div class="acoes-tabela">
                        <button class="btn-acao deletar" onclick="deletar(${func.id_funcionario})" title="Excluir"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="7">Erro na API.</td></tr>';
    }
}

async function salvarFuncionario(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());

    dados.permissao_entregar_epi = formData.has('permissao_entregar_epi') ? 'S' : 'N';
    dados.permissao_aprovar_solicitacao = formData.has('permissao_aprovar_solicitacao') ? 'S' : 'N';
    dados.permissao_editar_epi = formData.has('permissao_editar_epi') ? 'S' : 'N';
    dados.permissao_deletar_epi = 'N';
    dados.cadastrar_epi = 'N'; 

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        const json = await res.json();

        if(!json.error) {
            await meuAlerta("Funcionário cadastrado!"); // ALTERADO
            window.location.href = 'funcionarios.html';
        } else {
            await meuAlerta("Erro: " + json.message); // ALTERADO
        }
    } catch (error) {
        console.error(error);
        await meuAlerta("Erro de conexão."); // ALTERADO
    }
}

async function deletar(id) {
    // ALTERADO: confirm -> meuConfirm
    if(await meuConfirm("Deseja demitir/remover este funcionário?")) {
        await fetch(API_URL + id, { method: 'DELETE' });
        listarFuncionarios();
    }
}

function formatarData(data) {
    if(!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}