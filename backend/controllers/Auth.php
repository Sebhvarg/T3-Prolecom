<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController {
    private $usuarioModel;
    private $secretKey;

    public function __construct($pdo) {
        $this->usuarioModel = new Usuario($pdo);
        $this->secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret'; // En producción usar .env
    }

    public function login() {
        // Leer datos JSON del cuerpo de la petición
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['user']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(["error" => "MISSING_DATA"]);
            return;
        }

    
        $usernameOrEmail = trim($data['user']);
        $passwordIngresada = trim($data['password']);

        $row = $this->usuarioModel->login($usernameOrEmail);

        if (!$row) {
            // El SP devuelve una fila solo si el usuario existe y está Activo
            http_response_code(401);
            echo json_encode(["error" => "USER_NOT_FOUND_OR_INACTIVE"]);
            return;
        }

        // Verificar contraseña
        if (!password_verify($passwordIngresada, $row['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'WRONG_PASSWORD']);
            return;
        }

        // Todo OK → generar JWT
        $issuedAt = time();
        $expirationTime = $issuedAt + (int)($_ENV['JWT_EXPIRATION'] ?? 28800); // 8 horas por defecto
        
        // Mapeo manual de roles para coincidir con lo que espera el frontend (PrivateRoute)
        $roleMapping = [
            'Administrador' => 1,
            'Moderador'     => 2,
            'Profesor'      => 3,
            'Ayudante'      => 4,
            'Estudiante'    => 5
        ];
        $id_rol = $roleMapping[$row['rol']] ?? 5;

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => [
                'id' => $row['id'],
                'usuario' => $row['usuario'],
                'rol' => $row['rol'],
                'id_rol' => $id_rol
            ]
        ];

        $jwt = JWT::encode($payload, $this->secretKey, 'HS256');

        echo json_encode([
            "message" => "Login exitoso",
            "token" => $jwt,
            "user" => [
                "id" => $row['id'],
                "usuario" => $row['usuario'],
                "email" => $row['email'],
                "rol" => $row['rol'],
                "id_rol" => $id_rol,
                "estado" => $row['Estado']
            ]
        ]);
    }
}
