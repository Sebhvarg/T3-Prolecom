<?php

class Pregunta {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByCurso($idCurso) {
        $stmt = $this->pdo->prepare("SELECT p.*, u.usuario as autor 
                                    FROM preguntas p 
                                    JOIN usuarios u ON p.idUsuarioCreador = u.idUsuario 
                                    WHERE p.idCurso = ? AND p.estado != 'oculta' 
                                    ORDER BY p.fechaPublicacion DESC");
        $stmt->execute([$idCurso]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO preguntas (titulo, descripcion, idUsuarioCreador, idCurso) 
                VALUES (:titulo, :descripcion, :idUsuarioCreador, :idCurso)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }

    public function getDetalle($idPregunta) {
        $stmt = $this->pdo->prepare("SELECT p.*, u.usuario as autor 
                                    FROM preguntas p 
                                    JOIN usuarios u ON p.idUsuarioCreador = u.idUsuario 
                                    WHERE p.idPregunta = ?");
        $stmt->execute([$idPregunta]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
