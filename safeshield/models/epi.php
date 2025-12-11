<?php
require_once __DIR__ . "/../conexao.php";

class EPI {

    private $pdo;

    public function __construct() {
        $this->pdo = Conexao::getInstance();
    }

    /* LISTAR TODOS */
    public function listar() {
        $stmt = $this->pdo->prepare("SELECT * FROM EPI ORDER BY nome");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /* BUSCAR POR ID */
    public function buscarPorId($cod_epi) {
        $stmt = $this->pdo->prepare("SELECT * FROM EPI WHERE cod_epi = :cod");
        $stmt->bindValue(":cod", $cod_epi);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /* INSERIR */
    public function inserir($dados) {
        $sql = "INSERT INTO EPI (lote, ca, nome, descricao, quantidade, fornecedor, 
                data_aquisicao_lote, data_validade_lote, preco_unitario)
                VALUES (:lote, :ca, :nome, :descricao, :quantidade, :fornecedor, 
                :data_aquisicao_lote, :data_validade_lote, :preco_unitario)";

        $stmt = $this->pdo->prepare($sql);

        foreach ($dados as $campo => $valor)
            $stmt->bindValue(":" . $campo, $valor);

        $stmt->execute();
        return $this->pdo->lastInsertId();
    }

    /* EDITAR */
    public function editar($cod_epi, $dados) {
        $sql = "UPDATE EPI SET lote=:lote, ca=:ca, nome=:nome, descricao=:descricao,
                quantidade=:quantidade, fornecedor=:fornecedor, 
                data_aquisicao_lote=:data_aquisicao_lote,
                data_validade_lote=:data_validade_lote,
                preco_unitario=:preco_unitario
                WHERE cod_epi = :cod";

        $stmt = $this->pdo->prepare($sql);

        foreach ($dados as $campo => $valor)
            $stmt->bindValue(":" . $campo, $valor);

        $stmt->bindValue(":cod", $cod_epi);
        return $stmt->execute();
    }

    /* DELETAR */
    public function deletar($cod_epi) {
        $antigo = $this->buscarPorId($cod_epi);

        $stmt = $this->pdo->prepare("DELETE FROM EPI WHERE cod_epi = :cod");
        $stmt->bindValue(":cod", $cod_epi);
        $stmt->execute();

        return $antigo;
    }
}
?>
