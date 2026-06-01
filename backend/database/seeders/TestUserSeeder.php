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
        $userId = DB::table('usuarios')->insertGetId([
            'nombreCompleto' => 'Usuario Prueba',
            'usuario' => 'user',
            'email' => 'user@espol.edu.ec',
            'password' => Hash::make('Usuario'), // Cambiado a 'Usuario' como pidió el usuario
            'fechaDeNacimiento' => '2002-08-07',
            'idEstado' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('rolUsuario')->insert([
            'idUsuario' => $userId,
            'idRol' => 1,
        ]);
    }
}
