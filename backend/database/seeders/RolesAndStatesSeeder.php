<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Rol;
use Illuminate\Support\Facades\DB;

class RolesAndStatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('roles')->insertOrIgnore([
            ['idRol' => 1, 'rol' => 'Administrador'],
            ['idRol' => 2, 'rol' => 'Moderador'],
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 4, 'rol' => 'Soporte'],
            ['idRol' => 5, 'rol' => 'Ayudante'],
            ['idRol' => 6, 'rol' => 'Estudiante'],
        ]);

        DB::table('estadosCuenta')->insertOrIgnore([
            ['idEstado' => 1, 'estado' => 'Activo'],
            ['idEstado' => 2, 'estado' => 'Inactivo'],
            ['idEstado' => 3, 'estado' => 'Suspendido'],
            ['idEstado' => 4, 'estado' => 'Baneado'],
        ]);

        DB::table('rutas')->insertOrIgnore([
            ['idRol' => 1, 'ruta' => '/admin'],
            ['idRol' => 1, 'ruta' => '/administrar-cursos'],
            ['idRol' => 6, 'ruta' => '/dashboard'],
        ]);
    }
}
