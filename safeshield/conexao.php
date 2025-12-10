<?php
    //Singleton -> arquivo único de conexão
    class Conexao{
        //Primeiro, criamos o atributo $pdo que é um objeto do tipo PDO.
        private static ?PDO $pdo = null;

        //Transforma o construtor em um método privado, impedindo instanciamento da classe (impede $conexao = new Conexao())
        private function __construct(){}

        //Criando a função para pegar a instância única de conexão, que precisa ser estática, pois não é possível criar objetos da classe Conexao - precisaremos acessá-la diretamente na classe (usando Conexao::getInstance())
        public static function getInstance(){
            //Usamos o if para verificar se a conexão já foi realizada ou se está como null, só criamos uma conexão se estiver como null → isso garante que exista apenas 1 conexão
            if(self::$pdo === null){
                try{
                    //O código dentro do try será a tentativa de realizar a conexão com o bd
                    //Precisamos passar atributos para o objeto pdo, são 3: informações do banco, usuário e senha
                    $infodb = "mysql:host=localhost;dbname=banco_safeshield;charset=utf8mb4";
                    $usuario = "root";
                    $senha = "";
                    //Inicializar o objeto PDO 
                    self::$pdo = new PDO($infodb,$usuario,$senha);
                    self::$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
                }catch(PDOException $e){
                    //caso ocorram erros relacionados ao bd - PDO
                    throw new Exception("Erro no banco de dados: ".$e->getMessage());
                }catch(Exception $e){
                    //caso ocorram erros genéricos
                    throw new Exception("Erro inesperado: ".$e->getMessage());
                }
            }
            return self::$pdo;
        }
    }
?>