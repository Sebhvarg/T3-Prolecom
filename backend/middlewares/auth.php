<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function verificarToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(["error" => "TOKEN_REQUIRED"]);
        exit();
    }

    $token = str_replace('Bearer ', '', $authHeader);
    $secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret';

    try {
        $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
        return (array) $decoded->data;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["error" => "INVALID_TOKEN", "message" => $e->getMessage()]);
        exit();
    }
}

function verificarRol($usuarioData, $rolesPermitidos) {
    if (!in_array($usuarioData['id_rol'], $rolesPermitidos)) {
        http_response_code(403);
        echo json_encode(["error" => "UNAUTHORIZED_ROLE"]);
        exit();
    }
}
