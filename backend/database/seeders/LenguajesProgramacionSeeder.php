<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LenguajesProgramacionSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('lenguajes_programacion')->insertOrIgnore([
            [
                'idLenguaje' => 1,
                'nombre'     => 'Python',
                'slug'       => 'python',
                'icono'      => 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
                'activo'     => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'idLenguaje' => 2,
                'nombre'     => 'JavaScript',
                'slug'       => 'javascript',
                'icono'      => 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
                'activo'     => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
