<?php

class Solucion {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByEstudiante($idEstudiante) {
        $stmt = $this->pdo->prepare("SELECT s.*, d.titulo as desafio_titulo 
                                    FROM soluciones s 
                                    JOIN desafios d ON s.idDesafio = d.idDesafio 
                                    WHERE s.idEstudiante = ?");
        $stmt->execute([$idEstudiante]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function submit($data) {
        $sql = "INSERT INTO soluciones (codigoFuente, idEstudiante, idDesafio) 
                VALUES (:codigoFuente, :idEstudiante, :idDesafio)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }

    public function updateEstado($idSolucion, $estado) {
        $stmt = $this->pdo->prepare("UPDATE soluciones SET estado = ? WHERE idSolucion = ?");
        return $stmt->execute([$estado, $idSolucion]);
    }
}
