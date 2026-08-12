<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('categorias_curso')) {
            Schema::create('categorias_curso', function (Blueprint $table) {
                $table->id('idCategoria');
                $table->string('nombre', 100)->unique();
                $table->string('slug', 100)->unique();
                $table->string('icono', 50)->default('BookOpen');
            });

            DB::table('categorias_curso')->insertOrIgnore([
                ['idCategoria' => 1, 'nombre' => 'Programación Básica', 'slug' => 'programacion-basica', 'icono' => 'Code'],
                ['idCategoria' => 2, 'nombre' => 'Estructuras de Datos', 'slug' => 'estructuras-de-datos', 'icono' => 'Layers'],
                ['idCategoria' => 3, 'nombre' => 'Algoritmos Avanzados', 'slug' => 'algoritmos-avanzados', 'icono' => 'Cpu'],
                ['idCategoria' => 4, 'nombre' => 'Desarrollo Web', 'slug' => 'desarrollo-web', 'icono' => 'Globe'],
                ['idCategoria' => 5, 'nombre' => 'Inteligencia Artificial', 'slug' => 'inteligencia-artificial', 'icono' => 'Sparkles'],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categorias_curso');
    }
};
