<?php

class Usuario {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function login($usernameOrEmail) {
        try {
            // Llamar al procedimiento almacenado login_usuario
            $stmt = $this->pdo->prepare("CALL login_usuario(:user)");
            $stmt->bindParam(':user', $usernameOrEmail, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in Usuario::login: " . $e->getMessage());
            return false;
        }
    }
}
