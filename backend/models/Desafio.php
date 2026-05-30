<?php

class Desafio {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByCurso($idCurso) {
        $stmt = $this->pdo->prepare("SELECT * FROM desafios WHERE idCurso = ? AND estado = 'publicado'");
        $stmt->execute([$idCurso]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO desafios (titulo, descripcionProblema, dificultad, testCases, salidaEsperada, idCreador, idCurso) 
                VALUES (:titulo, :descripcionProblema, :dificultad, :testCases, :salidaEsperada, :idCreador, :idCurso)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }
}
