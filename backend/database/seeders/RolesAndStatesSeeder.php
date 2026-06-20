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
        DB::table('roles')->insert([
            ['idRol' => 1, 'rol' => 'Administrador'],
            ['idRol' => 2, 'rol' => 'Moderador'],
            ['idRol' => 3, 'rol' => 'Profesor'],
            ['idRol' => 4, 'rol' => 'Soporte'],
            ['idRol' => 5, 'rol' => 'Ayudante'],
            ['idRol' => 6, 'rol' => 'Estudiante'],
        ]);

        DB::table('estadosCuenta')->insert([
            ['idEstado' => 1, 'estado' => 'Activo'],
            ['idEstado' => 2, 'estado' => 'Inactivo'],
            ['idEstado' => 3, 'estado' => 'Suspendido'],
            ['idEstado' => 4, 'estado' => 'Baneado'],
        ]);

        DB::table('rutas')->insert([
            ['idRol' => 1, 'ruta' => '/admin'],
            ['idRol' => 1, 'ruta' => '/administrar-cursos'],
            ['idRol' => 6, 'ruta' => '/dashboard'],
        ]);

        DB::table('lenguajes_programacion')->insert([
            ['idLenguaje' => 1, 'nombre' => 'Python', 'judge0_id' => 71, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['idLenguaje' => 2, 'nombre' => 'JavaScript', 'judge0_id' => 63, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
