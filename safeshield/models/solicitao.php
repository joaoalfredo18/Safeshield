<?php
require_once __DIR__ . "/../conexao.php";

class Solicitacao {

    private $pdo;

    public function __construct() {
        $this->pdo = Conexao::getInstance();
    }

    /* LISTAR TODAS */
    public function listar() {
        $stmt = $this->pdo->prepare("
            SELECT S.*, 
                   F1.nome AS funcionario_pedido,
                   F2.nome AS funcionario_aprovacao,
                   F3.nome AS funcionario_entrega,
                   E.nome AS nome_epi
            FROM SOLICITACAO S
            LEFT JOIN FUNCIONARIO F1 ON S.cod_funcionario_pedido = F1.id_funcionario
            LEFT JOIN FUNCIONARIO F2 ON S.cod_funcionario_aprovacao = F2.id_funcionario
            LEFT JOIN FUNCIONARIO F3 ON S.cod_funcionario_entrega = F3.id_funcionario
            LEFT JOIN EPI E ON S.cod_epi_solicitado = E.cod_epi
            ORDER BY S.data_solicitacao DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /* BUSCAR POR ID */
    public function buscarPorId($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM SOLICITACAO WHERE id_solicitacao = :id");
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /* INSERIR */
    public function inserir($dados) {
        $sql = "INSERT INTO SOLICITACAO
        (cod_funcionario_pedido, cod_funcionario_aprovacao, cod_funcionario_entrega,
         cod_epi_solicitado, data_solicitacao, data_entrega, descricao_pedido, status_solicitacao,
         motivo_recusa, CA, lote, data_validade_epi, status_devolucao, data_devolucao)
         VALUES
        (:cod_funcionario_pedido, :cod_funcionario_aprovacao, :cod_funcionario_entrega,
         :cod_epi_solicitado, :data_solicitacao, :data_entrega, :descricao_pedido, :status_solicitacao,
         :motivo_recusa, :CA, :lote, :data_validade_epi, :status_devolucao, :data_devolucao)";

        $stmt = $this->pdo->prepare($sql);

        foreach ($dados as $campo => $valor)
            $stmt->bindValue(":" . $campo, $valor);

        $stmt->execute();
        return $this->pdo->lastInsertId();
    }

    /* EDITAR */
    public function editar($id, $dados) {
        $campos = "";
        foreach (array_keys($dados) as $campo) {
            $campos .= "$campo=:$campo,";
        }
        $campos = rtrim($campos, ",");

        $sql = "UPDATE SOLICITACAO SET $campos WHERE id_solicitacao = :id";

        $stmt = $this->pdo->prepare($sql);

        foreach ($dados as $campo => $valor)
            $stmt->bindValue(":" . $campo, $valor);

        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    /* DELETAR */
    public function deletar($id) {
        $antigo = $this->buscarPorId($id);

        $stmt = $this->pdo->prepare("DELETE FROM SOLICITACAO WHERE id_solicitacao = :id");
        $stmt->bindValue(":id", $id);
        $stmt->execute();

        return $antigo;
    }
}
?>
