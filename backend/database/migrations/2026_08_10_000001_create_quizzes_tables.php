<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ACTION_SET_NULL = 'set null';

    private const ACTION_CASCADE = 'cascade';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->createQuizzesTable();
        $this->createQuizPreguntasTable();
        $this->createQuizOpcionesTable();
        $this->createQuizAsignacionesTable();
        $this->createQuizIntentosTable();
        $this->createQuizRespuestasIntentosTable();
    }

    private function createQuizzesTable(): void
    {
        if (Schema::hasTable('quizzes')) {
            return;
        }

        Schema::create('quizzes', function (Blueprint $table) {
            $table->id('idQuiz');
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('idCurso');
            $table->unsignedBigInteger('idTema')->nullable();
            $table->unsignedBigInteger('idCreador');
            $table->integer('limite_tiempo_minutos')->default(0);
            $table->decimal('calificacion_maxima', 8, 2)->default(10.00);
            $table->boolean('mostrar_retroalimentacion')->default(true);
            $table->string('estado', 20)->default('publicado');
            $table->boolean('asignar_a_todos')->default(true);
            $table->timestamps();

            $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete(self::ACTION_CASCADE);
            $table->foreign('idTema')->references('idTema')->on('temas')->onDelete(self::ACTION_SET_NULL);
            $table->foreign('idCreador')->references('idUsuario')->on('usuarios')->onDelete(self::ACTION_CASCADE);
        });
    }

    private function createQuizPreguntasTable(): void
    {
        if (Schema::hasTable('quiz_preguntas')) {
            return;
        }

        Schema::create('quiz_preguntas', function (Blueprint $table) {
            $table->id('idPreguntaQuiz');
            $table->unsignedBigInteger('idQuiz');
            $table->text('enunciado');
            $table->string('tipo', 30)->default('opcion_multiple');
            $table->decimal('puntos', 5, 2)->default(1.00);
            $table->text('explicacion')->nullable();
            $table->integer('orden')->default(0);
            $table->timestamps();

            $table->foreign('idQuiz')->references('idQuiz')->on('quizzes')->onDelete(self::ACTION_CASCADE);
        });
    }

    private function createQuizOpcionesTable(): void
    {
        if (Schema::hasTable('quiz_opciones')) {
            return;
        }

        Schema::create('quiz_opciones', function (Blueprint $table) {
            $table->id('idOpcionQuiz');
            $table->unsignedBigInteger('idPreguntaQuiz');
            $table->text('texto_opcion');
            $table->boolean('es_correcta')->default(false);
            $table->integer('orden')->default(0);
            $table->timestamps();

            $table->foreign('idPreguntaQuiz')->references('idPreguntaQuiz')->on('quiz_preguntas')->onDelete(self::ACTION_CASCADE);
        });
    }

    private function createQuizAsignacionesTable(): void
    {
        if (Schema::hasTable('quiz_asignaciones')) {
            return;
        }

        Schema::create('quiz_asignaciones', function (Blueprint $table) {
            $table->id('idAsignacion');
            $table->unsignedBigInteger('idQuiz');
            $table->unsignedBigInteger('idEstudiante');
            $table->timestamps();

            $table->foreign('idQuiz')->references('idQuiz')->on('quizzes')->onDelete(self::ACTION_CASCADE);
            $table->foreign('idEstudiante')->references('idUsuario')->on('usuarios')->onDelete(self::ACTION_CASCADE);
            $table->unique(['idQuiz', 'idEstudiante']);
        });
    }

    private function createQuizIntentosTable(): void
    {
        if (Schema::hasTable('quiz_intentos')) {
            return;
        }

        Schema::create('quiz_intentos', function (Blueprint $table) {
            $table->id('idIntentoQuiz');
            $table->unsignedBigInteger('idQuiz');
            $table->unsignedBigInteger('idEstudiante');
            $table->decimal('puntaje_obtenido', 8, 2)->default(0.00);
            $table->decimal('puntaje_maximo', 8, 2)->default(0.00);
            $table->decimal('porcentaje', 5, 2)->default(0.00);
            $table->boolean('aprobado')->default(false);
            $table->integer('tiempo_segundos')->nullable();
            $table->timestamp('fecha_envio')->nullable();
            $table->timestamps();

            $table->foreign('idQuiz')->references('idQuiz')->on('quizzes')->onDelete(self::ACTION_CASCADE);
            $table->foreign('idEstudiante')->references('idUsuario')->on('usuarios')->onDelete(self::ACTION_CASCADE);
        });
    }

    private function createQuizRespuestasIntentosTable(): void
    {
        if (Schema::hasTable('quiz_respuestas_intentos')) {
            return;
        }

        Schema::create('quiz_respuestas_intentos', function (Blueprint $table) {
            $table->id('idRespuestaIntento');
            $table->unsignedBigInteger('idIntentoQuiz');
            $table->unsignedBigInteger('idPreguntaQuiz');
            $table->unsignedBigInteger('idOpcionSeleccionada')->nullable();
            $table->boolean('es_correcta')->default(false);
            $table->decimal('puntaje_ganado', 5, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('idIntentoQuiz')->references('idIntentoQuiz')->on('quiz_intentos')->onDelete(self::ACTION_CASCADE);
            $table->foreign('idPreguntaQuiz')->references('idPreguntaQuiz')->on('quiz_preguntas')->onDelete(self::ACTION_CASCADE);
            $table->foreign('idOpcionSeleccionada')->references('idOpcionQuiz')->on('quiz_opciones')->onDelete(self::ACTION_SET_NULL);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_respuestas_intentos');
        Schema::dropIfExists('quiz_intentos');
        Schema::dropIfExists('quiz_asignaciones');
        Schema::dropIfExists('quiz_opciones');
        Schema::dropIfExists('quiz_preguntas');
    }
};
