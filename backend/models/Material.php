<?php

class Material {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getByTema($idTema) {
        $stmt = $this->pdo->prepare("SELECT m.*, u.nombreCompleto as creador_nombre 
                                    FROM materiales_aprendizaje m 
                                    JOIN usuarios u ON m.idUsuarioCreador = u.idUsuario 
                                    WHERE m.idTema = ?");
        $stmt->execute([$idTema]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO materiales_aprendizaje (titulo, descripcion, tipo, enlaceArchivo, idTema, idUsuarioCreador) 
                VALUES (:titulo, :descripcion, :tipo, :enlaceArchivo, :idTema, :idUsuarioCreador)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }
}
