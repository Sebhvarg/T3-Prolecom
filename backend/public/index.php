<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permite peticiones desde el frontend (CORS)

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

require_once '../config/database.php';

// Respuesta de prueba
echo json_encode([
    "status" => "success",
    "message" => "API funcionando correctamente",
    "db_connection" => isset($pdo) ? "Conexión a la base de $_ENV[DB_BASE] exitosa" : "No se pudo conectar a la base de datos"
]);
?>