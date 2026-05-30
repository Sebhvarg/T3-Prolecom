<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../models/Pregunta.php';
require_once __DIR__ . '/../models/Respuesta.php';

class ForoTest extends TestCase {
    private $pdo;

    protected function setUp(): void {
        $this->pdo = $this->createMock(PDO::class);
    }

    public function testGetPreguntasByCurso() {
        $preguntaModel = new Pregunta($this->pdo);
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetchAll')->willReturn([
            ['idPregunta' => 1, 'titulo' => 'Duda 1'],
            ['idPregunta' => 2, 'titulo' => 'Duda 2']
        ]);

        $this->pdo->method('prepare')->willReturn($stmt);

        $result = $preguntaModel->getByCurso(1);

        $this->assertCount(2, $result);
    }

    public function testValidarRespuesta() {
        $respuestaModel = new Respuesta($this->pdo);
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);

        $this->pdo->method('prepare')->willReturn($stmt);

        $result = $respuestaModel->validar(1);

        $this->assertTrue($result);
    }
}
