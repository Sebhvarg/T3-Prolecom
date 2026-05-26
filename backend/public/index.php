<?php
/**
 * CONFIGURACIÓN DE CORS (DEBE SER LO PRIMERO)
 */
// Permitir cualquier origen durante desarrollo
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si es una petición OPTIONS, responder con un 200 OK y salir
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * CARGA DEL SISTEMA
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

require_once '../config/database.php';
require_once '../models/Usuario.php';
require_once '../controllers/Auth.php';

// Obtener la URL de la petición
$request_uri = $_SERVER['REQUEST_URI'];
// Limpiar query params de la URI para comparar rutas
$path = parse_url($request_uri, PHP_URL_PATH);
$base_path = '/api';

// Enrutamiento básico
if ($path === "$base_path/login" && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $authController = new AuthController($pdo);
    $authController->login();
    exit();
}

// Ruta para probar que el backend está vivo
if ($path === "/" || $path === "/api") {
    echo json_encode(["status" => "online", "message" => "Prolecom API is running"]);
    exit();
}

// Ruta no encontrada
http_response_code(404);
echo json_encode(["error" => "Ruta no encontrada"]);
?>