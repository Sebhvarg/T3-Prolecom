<?php

class Quiz {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByCurso($idCurso) {
        $stmt = $this->pdo->prepare("SELECT * FROM quizzes WHERE idCurso = ?");
        $stmt->execute([$idCurso]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO quizzes (titulo, descripcion, idCurso, idCreador) 
                VALUES (:titulo, :descripcion, :idCurso, :idCreador)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }
}
