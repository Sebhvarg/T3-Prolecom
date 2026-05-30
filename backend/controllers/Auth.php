<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController {
    private $usuarioModel;
    private $secretKey;

    public function __construct($pdo) {
        $this->usuarioModel = new Usuario($pdo);
        $this->secretKey = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET'); // En producción usar .env
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
            'Soporte'       => 4,
            'Ayudante'      => 5,
            'Estudiante'    => 6
        ];
        $id_rol = $roleMapping[$row['rol']] ?? 6;

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => [
                'id' => $row['idUsuario'],
                'usuario' => $row['usuario'],
                'rol' => $row['rol'],
                'id_rol' => $id_rol
            ]
        ];

        $jwt = JWT::encode($payload, $this->secretKey, 'HS256');

        $responseData = [
            "message" => "Login exitoso",
            "token" => $jwt,
            "user" => [
                "id" => $row['idUsuario'],
                "usuario" => $row['usuario'],
                "email" => $row['email'],
                "rol" => $row['rol'],
                "id_rol" => $id_rol,
                "estado" => $row['estado'],
                "rutas" => isset($row['rutas']) ? explode(';', $row['rutas']) : []
            ]
        ];

        // Si se solicita cifrado o por seguridad extra
        $jsonResponse = json_encode($responseData);
        
        // Usamos una clave compartida para cifrar la respuesta (puedes usar la misma que el storage o una dedicada)
        $encryptionKey = $_ENV['API_ENCRYPTION_KEY'];
        $encryptionKey = str_pad($encryptionKey, 32, "\0"); // Asegurar que sea de 32 bytes para AES-256
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
        $encrypted = openssl_encrypt($jsonResponse, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $iv);
        
        // Devolvemos el IV + el dato cifrado en base64
        echo json_encode([
            "protected" => true,
            "payload" => base64_encode($iv . $encrypted)
        ]);
    }
}
