<?php

class Usuario {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function login($usernameOrEmail) {
        try {
            // Llamar al procedimiento almacenado loginUsuario
            $stmt = $this->pdo->prepare("CALL loginUsuario(:user)");
            $stmt->bindParam(':user', $usernameOrEmail, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in Usuario::login: " . $e->getMessage());
            return false;
        }
    }

    public function getMetadata($idUsuario, $rol) {
        $table = ($rol === 'Estudiante') ? 'estudiantes_metadata' : (($rol === 'Profesor') ? 'profesores_metadata' : null);
        if (!$table) return null;

        $stmt = $this->pdo->prepare("SELECT * FROM $table WHERE idUsuario = ?");
        $stmt->execute([$idUsuario]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getRoles($idUsuario) {
        $stmt = $this->pdo->prepare("SELECT r.rol FROM roles r 
                                    JOIN rolUsuario ru ON r.idRol = ru.idRol 
                                    WHERE ru.idUsuario = ?");
        $stmt->execute([$idUsuario]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}

