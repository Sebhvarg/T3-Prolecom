<?php

class Curso {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAll() {
        $stmt = $this->pdo->query("SELECT c.*, u.nombreCompleto as profesor_nombre 
                                  FROM cursos c 
                                  JOIN usuarios u ON c.idProfeCreador = u.idUsuario");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM cursos WHERE idCurso = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO cursos (titulo, descripcion, lp, tipo, idProfeCreador) 
                VALUES (:titulo, :descripcion, :lp, :tipo, :idProfeCreador)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }

    public function getEstudiantes($idCurso) {
        $stmt = $this->pdo->prepare("SELECT u.idUsuario, u.nombreCompleto, u.usuario, ic.fechaInscripcion 
                                    FROM usuarios u 
                                    JOIN inscripciones_cursos ic ON u.idUsuario = ic.idUsuarioEstudiante 
                                    WHERE ic.idCurso = ?");
        $stmt->execute([$idCurso]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
