<?php

class Flashcard {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByEstudianteAndCurso($idEstudiante, $idCurso) {
        $stmt = $this->pdo->prepare("SELECT * FROM flashcards WHERE idEstudiante = ? AND idCurso = ?");
        $stmt->execute([$idEstudiante, $idCurso]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO flashcards (pregunta, respuesta, idEstudiante, idCurso) 
                VALUES (:pregunta, :respuesta, :idEstudiante, :idCurso)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }
}
