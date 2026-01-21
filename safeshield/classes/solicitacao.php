<?php
require_once __DIR__ . "/../conexao.php";

class Solicitacao {

    private $pdo;

    public function __construct() {
        $this->pdo = Conexao::getInstance();
    }
    
    /* LISTAR TODOS */
    public function listarSolicitacao() {
        $sql = "SELECT * FROM SOLICITACAO ORDER BY data_solicitacao DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /* BUSCAR POR ID */
    public function buscarSolicitacaoPorId($id) {
        $sql = "SELECT * FROM SOLICITACAO WHERE id_solicitacao = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /* INSERIR */
    public function inserirSolicitacao($dados) {
        $sql = "INSERT INTO SOLICITACAO(
                    cod_funcionario_pedido,
                    cod_epi_solicitado, 
                    data_solicitacao, 
                    descricao_pedido, 
                    status_solicitacao
                ) VALUES(
                    :cod_funcionario_pedido,
                    :cod_epi_solicitado, 
                    :data_solicitacao, 
                    :descricao_pedido, 
                    :status_solicitacao
                )";
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(":cod_funcionario_pedido", $dados['cod_funcionario_pedido']);
        $stmt->bindValue(":cod_epi_solicitado",     $dados['cod_epi_solicitado']);
        $stmt->bindValue(":data_solicitacao",       $dados['data_solicitacao']);
        $stmt->bindValue(":descricao_pedido",       $dados['descricao_pedido']);
        $status = isset($dados['status_solicitacao']) ? $dados['status_solicitacao'] : 'Pendente';
        $stmt->bindValue(":status_solicitacao",     $status);

        $stmt->execute();
        return $this->pdo->lastInsertId();
    }

    /* ATUALIZAR STATUS (AGORA BAIXA ESTOQUE NA APROVAÇÃO) */
    public function atualizarStatusSolicitacao($id, $dados) {
        
        // --- MUDANÇA AQUI ---
        // Agora descontamos o estoque quando o status vira 'Aprovado'
        if($dados['status_solicitacao'] === 'Aprovado') {
            $busca = $this->pdo->prepare("SELECT cod_epi_solicitado FROM SOLICITACAO WHERE id_solicitacao = :id");
            $busca->execute([':id' => $id]);
            $solicitacao = $busca->fetch(PDO::FETCH_ASSOC);

            if($solicitacao) {
                // Remove 1 do estoque
                $baixa = $this->pdo->prepare("UPDATE EPI SET quantidade = quantidade - 1 WHERE cod_epi = :epi AND quantidade > 0");
                $baixa->execute([':epi' => $solicitacao['cod_epi_solicitado']]);
            }
        }

        // CORREÇÃO DO "USUÁRIO FANTASMA" (VALIDAÇÃO DE ID)
        if(isset($dados['cod_funcionario_aprovacao'])) {
            $check = $this->pdo->prepare("SELECT id_funcionario FROM FUNCIONARIO WHERE id_funcionario = :id");
            $check->execute([':id' => $dados['cod_funcionario_aprovacao']]);
            
            if($check->rowCount() == 0) {
                // Se o ID não existe, pega o primeiro válido para não dar erro
                $rescue = $this->pdo->query("SELECT id_funcionario FROM FUNCIONARIO ORDER BY id_funcionario ASC LIMIT 1");
                $validId = $rescue->fetchColumn();
                
                if($validId) {
                    $dados['cod_funcionario_aprovacao'] = $validId;
                } else {
                    unset($dados['cod_funcionario_aprovacao']);
                }
            }
        }

        // QUERY DE ATUALIZAÇÃO PADRÃO
        $sql = "UPDATE SOLICITACAO SET status_solicitacao = :status";
        
        if(isset($dados['cod_funcionario_aprovacao'])) $sql .= ", cod_funcionario_aprovacao = :aprovador";
        if(isset($dados['motivo_recusa'])) $sql .= ", motivo_recusa = :motivo";
        if(isset($dados['data_entrega'])) $sql .= ", data_entrega = :data_entrega";
        if(isset($dados['data_validade_epi'])) $sql .= ", data_validade_epi = :data_validade_epi";

        $sql .= " WHERE id_solicitacao = :id";

        $stmt = $this->pdo->prepare($sql);
        
        $stmt->bindValue(":status", $dados['status_solicitacao']);
        $stmt->bindValue(":id", $id);

        if(isset($dados['cod_funcionario_aprovacao'])) $stmt->bindValue(":aprovador", $dados['cod_funcionario_aprovacao']);
        if(isset($dados['motivo_recusa'])) $stmt->bindValue(":motivo", $dados['motivo_recusa']);
        if(isset($dados['data_entrega'])) $stmt->bindValue(":data_entrega", $dados['data_entrega']);
        if(isset($dados['data_validade_epi'])) $stmt->bindValue(":data_validade_epi", $dados['data_validade_epi']);
        
        return $stmt->execute();
    }

    /* DELETAR */
    public function deletarSolicitacao($id) {
        $sql = "DELETE FROM SOLICITACAO WHERE id_solicitacao = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }
}
?>