<?php

class Respuesta {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByPregunta($idPregunta) {
        $stmt = $this->pdo->prepare("SELECT r.*, u.usuario as autor 
                                    FROM respuestas r 
                                    JOIN usuarios u ON r.idUsuario = u.idUsuario 
                                    WHERE r.idPregunta = ?");
        $stmt->execute([$idPregunta]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO respuestas (contenido, idUsuario, idPregunta) 
                VALUES (:contenido, :idUsuario, :idPregunta)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }

    public function validar($idRespuesta) {
        $stmt = $this->pdo->prepare("UPDATE respuestas SET validada = TRUE WHERE idRespuesta = ?");
        return $stmt->execute([$idRespuesta]);
    }
}
