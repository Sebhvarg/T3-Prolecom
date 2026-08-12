<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function crearCatalogo(string $tabla, string $pkCol, array $datos): void
    {
        if (! Schema::hasTable($tabla)) {
            Schema::create($tabla, function (Blueprint $table) use ($pkCol) {
                $table->id($pkCol);
                $table->string('nombre', 50)->unique();
            });

            DB::table($tabla)->insertOrIgnore($datos);
        }
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->crearCatalogo('dificultades_desafio', 'idDificultad', [
            ['idDificultad' => 1, 'nombre' => 'Easy'],
            ['idDificultad' => 2, 'nombre' => 'Medium'],
            ['idDificultad' => 3, 'nombre' => 'Hard'],
        ]);

        $this->crearCatalogo('estados_pregunta', 'idEstadoPregunta', [
            ['idEstadoPregunta' => 1, 'nombre' => 'abierta'],
            ['idEstadoPregunta' => 2, 'nombre' => 'resuelta'],
            ['idEstadoPregunta' => 3, 'nombre' => 'oculta'],
        ]);

        $this->crearCatalogo('estados_foro', 'idEstadoForo', [
            ['idEstadoForo' => 1, 'nombre' => 'abierto'],
            ['idEstadoForo' => 2, 'nombre' => 'cerrado'],
        ]);

        $this->crearCatalogo('estados_desafio', 'idEstadoDesafio', [
            ['idEstadoDesafio' => 1, 'nombre' => 'pendiente'],
            ['idEstadoDesafio' => 2, 'nombre' => 'publicado'],
        ]);

        $this->crearCatalogo('tipos_publicacion_reporte', 'idTipoPublicacion', [
            ['idTipoPublicacion' => 1, 'nombre' => 'pregunta'],
            ['idTipoPublicacion' => 2, 'nombre' => 'respuesta'],
            ['idTipoPublicacion' => 3, 'nombre' => 'material'],
        ]);

        $this->crearCatalogo('estados_solucion', 'idEstadoSolucion', [
            ['idEstadoSolucion' => 1, 'nombre' => 'aprobado'],
            ['idEstadoSolucion' => 2, 'nombre' => 'rechazado'],
            ['idEstadoSolucion' => 3, 'nombre' => 'error_compilacion'],
            ['idEstadoSolucion' => 4, 'nombre' => 'tiempo_excedido'],
            ['idEstadoSolucion' => 5, 'nombre' => 'pendiente'],
        ]);

        $this->crearCatalogo('tipos_material', 'idTipoMaterial', [
            ['idTipoMaterial' => 1, 'nombre' => 'PDF'],
            ['idTipoMaterial' => 2, 'nombre' => 'video'],
        ]);

        $this->crearCatalogo('tipos_curso', 'idTipoCurso', [
            ['idTipoCurso' => 1, 'nombre' => 'público'],
            ['idTipoCurso' => 2, 'nombre' => 'privado'],
        ]);

        $this->crearCatalogo('tipos_voto', 'idTipoVoto', [
            ['idTipoVoto' => 1, 'nombre' => 'me_gusta'],
            ['idTipoVoto' => 2, 'nombre' => 'no_me_gusta'],
        ]);

        $this->crearCatalogo('estados_quiz', 'idEstadoQuiz', [
            ['idEstadoQuiz' => 1, 'nombre' => 'borrador'],
            ['idEstadoQuiz' => 2, 'nombre' => 'publicado'],
            ['idEstadoQuiz' => 3, 'nombre' => 'cerrado'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tablas = [
            'estados_quiz',
            'tipos_voto',
            'tipos_curso',
            'tipos_material',
            'estados_solucion',
            'tipos_publicacion_reporte',
            'estados_desafio',
            'estados_foro',
            'estados_pregunta',
            'dificultades_desafio',
        ];

        foreach ($tablas as $tabla) {
            Schema::dropIfExists($tabla);
        }
    }
};
