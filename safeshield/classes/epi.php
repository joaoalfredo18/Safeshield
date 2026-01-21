<?php
require_once __DIR__ . "/../conexao.php";

class EPI {

    private $pdo;

    public function __construct() {
        $this->pdo = Conexao::getInstance();
    }
    /* LISTAR TODOS */
    public function listarEpi() {
        $stmt = $this->pdo->prepare("SELECT * FROM EPI ORDER BY nome");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    /* BUSCAR POR ID */
    public function buscarEpiPorId($cod_epi) {
        $stmt = $this->pdo->prepare("SELECT * FROM EPI WHERE cod_epi = :cod");
        $stmt->bindValue(":cod", $cod_epi);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    /* INSERIR */
/* SUBSTITUA A FUNÇÃO inserirEpi ANTIGA POR ESTA: */
    public function inserirEpi($dados) {
        $sql = "INSERT INTO EPI (lote, ca, nome, descricao, quantidade, fornecedor, 
                data_aquisicao_lote, data_validade_lote, preco_unitario)
                VALUES (:lote, :ca, :nome, :descricao, :quantidade, :fornecedor, 
                :data_aquisicao_lote, :data_validade_lote, :preco_unitario)";

        $stmt = $this->pdo->prepare($sql);

        // BIND MANUAL (Isso impede o erro de 'parâmetro inválido' se vier campo extra)
        $stmt->bindValue(":lote",                $dados['lote']);
        $stmt->bindValue(":ca",                  $dados['ca']);
        $stmt->bindValue(":nome",                $dados['nome']);
        $stmt->bindValue(":descricao",           $dados['descricao']);
        $stmt->bindValue(":quantidade",          $dados['quantidade']);
        $stmt->bindValue(":fornecedor",          $dados['fornecedor']);
        $stmt->bindValue(":data_aquisicao_lote", $dados['data_aquisicao_lote']);
        $stmt->bindValue(":data_validade_lote",  $dados['data_validade_lote']);
        $stmt->bindValue(":preco_unitario",      $dados['preco_unitario']);

        $stmt->execute();
        return $this->pdo->lastInsertId();
    }
    /* EDITAR */
    public function editarEpi($cod_epi, $dados) {
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
    public function deletarEpi($cod_epi) {
        $antigo = $this->buscarEpiPorId($cod_epi);
        $stmt = $this->pdo->prepare("DELETE FROM EPI WHERE cod_epi = :cod");
        $stmt->bindValue(":cod", $cod_epi);
        $stmt->execute();

        return $antigo;
    }
}
?>