<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Models\Rol;
use App\Models\EstadoCuenta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UsuarioTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_can_have_multiple_roles()
    {
        EstadoCuenta::create(['idEstado' => 1, 'estado' => 'Activo']);
        $rol1 = Rol::create(['rol' => 'Administrador']);
        $rol2 = Rol::create(['rol' => 'Profesor']);

        $usuario = Usuario::factory()->create();
        $usuario->roles()->attach([$rol1->idRol, $rol2->idRol]);

        $this->assertCount(2, $usuario->roles);
        $this->assertEquals('Administrador', $usuario->roles[0]->rol);
    }
}
