<?php
require_once __DIR__ . "/../conexao.php";

class Funcionario {

    private $pdo;

    public function __construct() {
        $this->pdo = Conexao::getInstance();
    }

    /* LISTAR TODOS */
    public function listarFuncionario() {
        $stmt = $this->pdo->prepare("SELECT * FROM FUNCIONARIO ORDER BY nome");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    /* BUSCAR POR ID */
    public function buscarFuncionarioPorId($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM FUNCIONARIO WHERE id_funcionario = :id");
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    /* INSERIR */
    public function inserirFuncionario($dados) {

        $sql = "INSERT INTO FUNCIONARIO (matricula, nome, cargo, data_nascimento, data_contratacao, setor, cadastrar_epi, 
         permissao_editar_epi, permissao_deletar_epi, permissao_aprovar_solicitacao, 
         permissao_entregar_epi)
        VALUES 
        (:matricula, :nome, :cargo, :data_nascimento, :data_contratacao, :setor, :cadastrar_epi,
         :permissao_editar_epi, :permissao_deletar_epi, :permissao_aprovar_solicitacao,
         :permissao_entregar_epi)";

        $stmt = $this->pdo->prepare($sql);

        foreach ($dados as $campo => $valor)
            $stmt->bindValue(":" . $campo, $valor);

        $stmt->execute();
        return $this->pdo->lastInsertId();
    }
    /* EDITAR */
    public function editarFuncionario($id, $dados) {
        $sql = "UPDATE FUNCIONARIO SET 
                matricula=:matricula, nome=:nome, cargo=:cargo, 
                data_nascimento=:data_nascimento, data_contratacao=:data_contratacao,
                setor=:setor, cadastrar_epi=:cadastrar_epi,
                permissao_editar_epi=:permissao_editar_epi,
                permissao_deletar_epi=:permissao_deletar_epi,
                permissao_aprovar_solicitacao=:permissao_aprovar_solicitacao,
                permissao_entregar_epi=:permissao_entregar_epi
                WHERE id_funcionario = :id";

        $stmt = $this->pdo->prepare($sql);

        foreach ($dados as $campo => $valor)
            $stmt->bindValue(":" . $campo, $valor);

        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }
    /* DELETAR */
    public function deletarFuncionario($id) {
        $antigo = $this->buscarFuncionarioPorId($id);
        $stmt = $this->pdo->prepare("DELETE FROM FUNCIONARIO WHERE id_funcionario = :id");
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $antigo;
    }
}

?>