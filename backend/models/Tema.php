<?php

class Tema {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByCurso($idCurso) {
        $stmt = $this->pdo->prepare("SELECT * FROM temas WHERE idCurso = ?");
        $stmt->execute([$idCurso]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO temas (nombre, descripcion, idCurso) VALUES (:nombre, :descripcion, :idCurso)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }
}
