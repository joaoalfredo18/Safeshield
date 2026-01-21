/* assets/js/modal_sistema.js */

const modal = document.getElementById('custom-modal');
const tituloEl = document.getElementById('modal-titulo');
const msgEl = document.getElementById('modal-mensagem');
const inputEl = document.getElementById('modal-input');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnCancelar = document.getElementById('btn-cancelar');

// Função Interna para abrir o modal e esperar o clique (Promise)
function abrirModal(tipo, texto, valorPadrao = '') {
    return new Promise((resolve) => {
        // Configura o visual
        modal.style.display = 'flex';
        msgEl.innerText = texto;
        inputEl.value = valorPadrao;
        
        // Reseta visibilidade
        inputEl.style.display = 'none';
        btnCancelar.style.display = 'none';
        btnConfirmar.innerText = 'OK';
        tituloEl.innerText = 'SafeShield';

        // Configuração específica por tipo
        if (tipo === 'ALERT') {
            btnConfirmar.onclick = () => { fechar(); resolve(true); };
        } 
        else if (tipo === 'CONFIRM') {
            btnCancelar.style.display = 'block';
            tituloEl.innerText = 'Confirmação';
            btnConfirmar.innerText = 'Sim';
            
            btnConfirmar.onclick = () => { fechar(); resolve(true); };
            btnCancelar.onclick = () => { fechar(); resolve(false); };
        } 
        else if (tipo === 'PROMPT') {
            inputEl.style.display = 'block';
            btnCancelar.style.display = 'block';
            tituloEl.innerText = 'Informação Necessária';
            btnConfirmar.innerText = 'Confirmar';
            inputEl.focus();

            btnConfirmar.onclick = () => { fechar(); resolve(inputEl.value); };
            btnCancelar.onclick = () => { fechar(); resolve(null); };
        }
    });
}

function fechar() {
    modal.style.display = 'none';
}

// --- FUNÇÕES GLOBAIS PARA VOCÊ USAR NO LUGAR DAS ORIGINAIS ---

window.meuAlerta = async (texto) => {
    await abrirModal('ALERT', texto);
};

window.meuConfirm = async (texto) => {
    return await abrirModal('CONFIRM', texto);
};

window.meuPrompt = async (texto, valorPadrao) => {
    return await abrirModal('PROMPT', texto, valorPadrao);
};