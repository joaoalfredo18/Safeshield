<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// IMPORTANTE: Correção do caminho da classe
require_once __DIR__ . "/../../classes/epi.php";

$epi = new EPI();
$method = $_SERVER['REQUEST_METHOD'];

// Lógica para limpar a URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptDir = dirname($_SERVER['SCRIPT_NAME']);
if ($scriptDir !== '/' && strpos($path, $scriptDir) === 0) {
    $path = substr($path, strlen($scriptDir));
}
$path = trim($path, '/');
$segments = $path === '' ? [] : explode('/', $path);

// Pega o ID se existir
$id = null;
if (!empty($segments)) {
    $last = end($segments);
    if (is_numeric($last)) {
        $id = $last;
    }
}

try {
    switch ($method) {
        
        // --- ADICIONE ESTE BLOCO AQUI ---
        case 'OPTIONS':
            // Apenas retorna 200 OK para o navegador saber que pode prosseguir
            http_response_code(200);
            exit; 
        break;
        // ---------------------------------

        case 'GET':
            if ($id) {
                $result = $epi->buscarEpiPorId($id);
            } else {
                $result = $epi->listarEpi();
            }
            http_response_code(200);
            echo json_encode(["error" => false, "data" => $result], JSON_UNESCAPED_UNICODE);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Verificação básica se veio dados
            if (!$data) {
                http_response_code(400);
                echo json_encode(["error" => true, "message" => "Dados inválidos ou JSON mal formatado"]);
                exit;
            }

            $result = $epi->inserirEpi($data);
            http_response_code(201);
            echo json_encode(["error" => false, "id_gerado" => $result], JSON_UNESCAPED_UNICODE);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => true, "message" => "ID é obrigatório"]);
                exit;
            }
            $data = json_decode(file_get_contents("php://input"), true);
            $result = $epi->editarEpi($id, $data);
            http_response_code(200);
            echo json_encode(["error" => false, "success" => $result], JSON_UNESCAPED_UNICODE);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => true, "message" => "ID é obrigatório"]);
                exit;
            }
            $result = $epi->deletarEpi($id);
            http_response_code(200);
            echo json_encode(["error" => false, "success" => $result], JSON_UNESCAPED_UNICODE);
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => true, "message" => "Método não permitido"]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => true, "message" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>