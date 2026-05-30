<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../models/Usuario.php';

class UsuarioTest extends TestCase {
    private $pdo;
    private $usuario;

    protected function setUp(): void {
        $this->pdo = $this->createMock(PDO::class);
        $this->usuario = new Usuario($this->pdo);
    }

    public function testLoginSuccessful() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetch')->willReturn([
            'idUsuario' => 1,
            'usuario' => 'testuser',
            'rol' => 'Estudiante'
        ]);

        $this->pdo->method('prepare')->willReturn($stmt);

        $result = $this->usuario->login('testuser');

        $this->assertIsArray($result);
        $this->assertEquals('testuser', $result['usuario']);
    }

    public function testLoginFailure() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetch')->willReturn(false);

        $this->pdo->method('prepare')->willReturn($stmt);

        $result = $this->usuario->login('nonexistent');

        $this->assertFalse($result);
    }

    public function testGetRoles() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetchAll')->willReturn(['Estudiante', 'Moderador']);

        $this->pdo->method('prepare')->willReturn($stmt);

        $roles = $this->usuario->getRoles(1);

        $this->assertCount(2, $roles);
        $this->assertContains('Estudiante', $roles);
    }
}
