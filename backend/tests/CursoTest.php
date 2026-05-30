<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../models/Curso.php';

class CursoTest extends TestCase {
    private $pdo;
    private $curso;

    protected function setUp(): void {
        $this->pdo = $this->createMock(PDO::class);
        $this->curso = new Curso($this->pdo);
    }

    public function testGetAll() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetchAll')->willReturn([
            ['idCurso' => 1, 'titulo' => 'Curso 1'],
            ['idCurso' => 2, 'titulo' => 'Curso 2']
        ]);

        $this->pdo->method('query')->willReturn($stmt);

        $result = $this->curso->getAll();

        $this->assertCount(2, $result);
        $this->assertEquals('Curso 1', $result[0]['titulo']);
    }

    public function testGetById() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetch')->willReturn(['idCurso' => 1, 'titulo' => 'Curso 1']);

        $this->pdo->method('prepare')->willReturn($stmt);

        $result = $this->curso->getById(1);

        $this->assertEquals('Curso 1', $result['titulo']);
    }

    public function testCreate() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);

        $this->pdo->method('prepare')->willReturn($stmt);

        $data = [
            'titulo' => 'Nuevo Curso',
            'descripcion' => 'Desc',
            'lp' => 'Python',
            'tipo' => 'público',
            'idProfeCreador' => 1
        ];

        $result = $this->curso->create($data);

        $this->assertTrue($result);
    }
}
