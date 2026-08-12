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
        // 1. Dificultades de Desafíos
        if (! Schema::hasTable('dificultades_desafio')) {
            Schema::create('dificultades_desafio', function (Blueprint $table) {
                $table->id('idDificultad');
                $table->string('nombre', 50)->unique();
            });

            DB::table('dificultades_desafio')->insertOrIgnore([
                ['idDificultad' => 1, 'nombre' => 'Easy'],
                ['idDificultad' => 2, 'nombre' => 'Medium'],
                ['idDificultad' => 3, 'nombre' => 'Hard'],
            ]);
        }

        // 2. Estados de Preguntas
        if (! Schema::hasTable('estados_pregunta')) {
            Schema::create('estados_pregunta', function (Blueprint $table) {
                $table->id('idEstadoPregunta');
                $table->string('nombre', 50)->unique();
            });

            DB::table('estados_pregunta')->insertOrIgnore([
                ['idEstadoPregunta' => 1, 'nombre' => 'abierta'],
                ['idEstadoPregunta' => 2, 'nombre' => 'resuelta'],
                ['idEstadoPregunta' => 3, 'nombre' => 'oculta'],
            ]);
        }

        // 3. Estados de Foro
        if (! Schema::hasTable('estados_foro')) {
            Schema::create('estados_foro', function (Blueprint $table) {
                $table->id('idEstadoForo');
                $table->string('nombre', 50)->unique();
            });

            DB::table('estados_foro')->insertOrIgnore([
                ['idEstadoForo' => 1, 'nombre' => 'abierto'],
                ['idEstadoForo' => 2, 'nombre' => 'cerrado'],
            ]);
        }

        // 4. Estados de Desafío
        if (! Schema::hasTable('estados_desafio')) {
            Schema::create('estados_desafio', function (Blueprint $table) {
                $table->id('idEstadoDesafio');
                $table->string('nombre', 50)->unique();
            });

            DB::table('estados_desafio')->insertOrIgnore([
                ['idEstadoDesafio' => 1, 'nombre' => 'pendiente'],
                ['idEstadoDesafio' => 2, 'nombre' => 'publicado'],
            ]);
        }

        // 5. Tipos de Publicación de Reporte
        if (! Schema::hasTable('tipos_publicacion_reporte')) {
            Schema::create('tipos_publicacion_reporte', function (Blueprint $table) {
                $table->id('idTipoPublicacion');
                $table->string('nombre', 50)->unique();
            });

            DB::table('tipos_publicacion_reporte')->insertOrIgnore([
                ['idTipoPublicacion' => 1, 'nombre' => 'pregunta'],
                ['idTipoPublicacion' => 2, 'nombre' => 'respuesta'],
                ['idTipoPublicacion' => 3, 'nombre' => 'material'],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_publicacion_reporte');
        Schema::dropIfExists('estados_desafio');
        Schema::dropIfExists('estados_foro');
        Schema::dropIfExists('estados_pregunta');
        Schema::dropIfExists('dificultades_desafio');
    }
};
