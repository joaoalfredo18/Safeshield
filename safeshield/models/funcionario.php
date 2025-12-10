<?php
    //Para ter acesso à classe Conexao 
    require_once "../conexao.php";

    class Funcionario{

        private $pdo;

        //Nosso construtor aqui é público, para permitir instâncias da classe Aluno
        public function __construct(){
            $this->pdo = Conexao::getInstance();
        }

        //Agora que já temos a nossa conexão ($this->pdo), conseguimos realizar nosso CRUD
        public function listarFuncionarios(){
            // Aqui a gente cria um prepared statement - uma query estruturada que possui a consulta com o banco
            $stmt = $this->pdo->prepare("SELECT * FROM funcionario ORDER BY nome");
            //var_dump($stmt); → para visulaizar a estrutura do obj $stmt
            $stmt->execute();
            $response = array();//garante que mesmo que não selecione ninguém, o retorno será array
            $response = $stmt->fetchAll(PDO::FETCH_ASSOC);
            //var_dump($response);
            return $response;
        }
        public function filtrarFuncionario($cod_funcionario = null, $cpf = null, $nome = null){
            $response = array();
            $query = "SELECT * FROM funcionario WHERE 1=1";

            if($cod_funcionario !== null){
                $query .= " AND cod_funcionario = :cod_funcionario";
            };
            //SELECT * FROM aluno WHERE 1=1 AND cod_aluno = :cod_aluno
            if($cpf !== null){
                $query .= " AND cpf = :cpf";
            }
            //SELECT * FROM aluno WHERE 1=1 AND cpf = :cpf
            if($nome !== null){
                $query .= " AND nome = :nome";
            }
            //SELECT * FROM aluno WHERE 1=1 AND nome = :nome

            //Preparando o statement

            $stmt = $this->pdo->prepare($query);

            //Fazendo o bindValue → necessário para definirmos que nossos valores preparados ":cod_aluno", ":cpf", ":nome" correspondem aos valores que recebemos como parâmetro na função 

            if($cod_funcionario !== null){
                $stmt->bindValue(":cod_funcionario",$cod_funcionario,PDO::PARAM_INT);
            }
            if($cpf !== null){
                $stmt->bindValue(":cpf",$cpf,PDO::PARAM_STR);
            }
            if($nome !== null){
                $stmt->bindValue(":nome",$nome,PDO::PARAM_STR);
            }

            //Depois de preparar o stmt, executar
            $stmt->execute();
            //Em seguida armazenar o retono do banco em array associativo
            $response = $stmt->fetchAll(PDO::FETCH_ASSOC);
            //retornar um array
            return $response ?: [];
        }

        //Inserir funcionario
        public function inserirFuncionario($cpf, $nome){
            $stmt = $this->pdo->prepare("INSERT INTO funcionario (cpf, nome) VALUES (:cpf, :nome)");
            $stmt->bindValue(":cpf", $cpf, PDO::PARAM_STR);
            $stmt->bindValue(":nome", $nome, PDO::PARAM_STR);
            $stmt->execute();

            $cod_funcionario = $this->pdo->lastInsertId();

            $stmt = $this->pdo->prepare("SELECT * FROM funcionario WHERE cod_funcionario = :cod_funcionario ");
            $stmt->bindValue(":cod_funcionario",$cod_funcionario,PDO::PARAM_INT);
            $stmt->execute();
            $response = $stmt->fetch(PDO::FETCH_ASSOC);
            return $response ?: [];
        }
        public function atualizarFuncionario($cod_funcionario, $cpf, $nome){
            if($cod_funcionario === ""){
                $cod_funcionario = null;
            }
            if($cod_funcionario === null){
                return [];
            }
            if($cpf === ""){
                $cpf = null;
            }
             if($nome === ""){
                $nome = null;
            }

            $stmt = $this->pdo->prepare(" UPDATE funcionario
            SET cpf  = :cpf,
                nome = :nome
            WHERE 
                cod_funcionario = :cod_funcionario");
                $stmt->bindValue(":cod_funcionario",$cod_funcionario,PDO::PARAM_INT);
                $stmt->bindValue(":cpf",$cpf,PDO::PARAM_STR);
                $stmt->bindValue(":nome",$nome,PDO::PARAM_STR);

                $stmt->execute();

                $stmt = $this->pdo->prepare("SELECT * FROM funcionario WHERE cod_funcionario =
                :cod_funcionario");
                $stmt->bindValue(":cod_funcionario",$cod_funcionario,PDO::PARAM_INT);
                $stmt->execute();

                $response = $stmt->fetch(PDO::PARAM_STR);

                return $response ?: [];
            }
        }
$funcionario = new Funcionario();
$funcionarios = $funcionario->listarFuncionarios();
//$funcionario->inserirFuncionario("25816","arthur");
$funcionarioAtualizado = $funcionario->atualizarFuncionario(4,"4553","mari");
var_dump($funcionarioAtualizado);

?>