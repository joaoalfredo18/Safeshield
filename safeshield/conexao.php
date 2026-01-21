<?php
    class Conexao{
        //primeiro, criamos o atributo $pdo é um obj do tipo PDO.
        private static ?PDO $pdo = null;

        //aqui, criamos um metodo publico (pois queremos acessar defora da classe) e static para acessar diretamente da classe.
        private function __construct(){

        }

        //cirando a funcao para pegar ainstância única de conexão, que precisa ser estática, 
        // pois não é possivél criar objets da classe cxonexão - precisaremos acessa-lá diretamente 
        // na classe (usando Conexão::getInstance())
        public static function getInstance(){
            //usamos o if para verificar se a conexão já foi realizada ou se esta como null, só criamos uma conexão se tiver 
            //como null → isso garante que exista apenas 1 conexão

            if(self::$pdo === null){
                try{
                    // o código dentro do try será a tentativa de realizar a conxão com o bd
                    //Precisamos passar atributos para o objeto pdo, são 3, informações ao banco, usuario e senha 

                    $infobd = 'mysql:host=localhost;dbname=banco_safeshield;charset=utf8mb4';
                    $usuario = "root";
                    $senha = "";

                    //inicializar o obj PDO
                    self::$pdo = new PDO($infobd,$usuario,$senha);
                    self::$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);

                }catch(PDOException $e){
                    //caso ocorram erros relacionadas ao bd - PDO
                    throw new Exception ("erro no banco de dados: ");
                }catch(Excepetion $e){
                    throw new Exception ("erro inesperado: ".$e->getMessage());
                    //caso ocorram erros genéricos
                }
            }return self::$pdo;
        } 
    }
    Conexao::getInstance();
?>