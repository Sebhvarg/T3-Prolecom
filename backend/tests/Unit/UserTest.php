<?php

namespace Tests\Unit;

use App\Models\Rol;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_can_have_multiple_roles()
    {
        DB::table('estadosCuenta')->insertOrIgnore(['idEstado' => 1, 'estado' => 'Activo']);
        DB::table('roles')->insertOrIgnore([
            ['idRol' => 1, 'rol' => 'Administrador'],
            ['idRol' => 2, 'rol' => 'Profesor'],
        ]);

        $rol1 = Rol::find(1);
        $rol2 = Rol::find(2);

        $user = User::factory()->create();
        $user->roles()->attach([$rol1->idRol, $rol2->idRol]);

        $this->assertCount(2, $user->roles);
        $this->assertEquals('Administrador', $user->roles[0]->rol);
    }
}
