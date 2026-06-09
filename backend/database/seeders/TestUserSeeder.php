<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Administrador Global
        $adminId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Administrador Global',
            'usuario' => 'admin',
            'email' => 'admin@prolecom.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1990-01-01',
            'idEstado' => 1,
            'xp' => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('rolUsuario')->insert([
            'idUsuario' => $adminId,
            'idRol' => 1, // Administrador
        ]);

        // 2. Profesor Python
        $profesorId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Profesor Python',
            'usuario' => 'profesor',
            'email' => 'profesor@espol.edu.ec',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '1985-05-15',
            'idEstado' => 1,
            'xp' => 500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('rolUsuario')->insert([
            'idUsuario' => $profesorId,
            'idRol' => 3, // Profesor
        ]);

        // 3. Estudiante Autodidacta
        $estudianteId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Estudiante Autodidacta',
            'usuario' => 'estudiante',
            'email' => 'estudiante@gmail.com',
            'password' => Hash::make('password123'),
            'fechaDeNacimiento' => '2002-08-07',
            'idEstado' => 1,
            'xp' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('rolUsuario')->insert([
            'idUsuario' => $estudianteId,
            'idRol' => 6, // Estudiante
        ]);
    }
}
