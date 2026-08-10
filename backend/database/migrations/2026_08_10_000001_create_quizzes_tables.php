<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('quizzes')) {
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

                $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
                $table->foreign('idTema')->references('idTema')->on('temas')->onDelete('set null');
                $table->foreign('idCreador')->references('idUsuario')->on('usuarios')->onDelete('cascade');
            });
        } else {
            Schema::table('quizzes', function (Blueprint $table) {
                if (! Schema::hasColumn('quizzes', 'idTema')) {
                    $table->unsignedBigInteger('idTema')->nullable()->after('idCurso');
                    $table->foreign('idTema')->references('idTema')->on('temas')->onDelete('set null');
                }
                if (! Schema::hasColumn('quizzes', 'limite_tiempo_minutos')) {
                    $table->integer('limite_tiempo_minutos')->default(0)->after('idCreador');
                }
                if (! Schema::hasColumn('quizzes', 'calificacion_maxima')) {
                    $table->decimal('calificacion_maxima', 8, 2)->default(10.00)->after('limite_tiempo_minutos');
                }
                if (! Schema::hasColumn('quizzes', 'mostrar_retroalimentacion')) {
                    $table->boolean('mostrar_retroalimentacion')->default(true)->after('calificacion_maxima');
                }
                if (! Schema::hasColumn('quizzes', 'estado')) {
                    $table->string('estado', 20)->default('publicado')->after('mostrar_retroalimentacion');
                }
                if (! Schema::hasColumn('quizzes', 'asignar_a_todos')) {
                    $table->boolean('asignar_a_todos')->default(true)->after('estado');
                }
            });
        }

        if (! Schema::hasTable('quiz_preguntas')) {
            Schema::create('quiz_preguntas', function (Blueprint $table) {
                $table->id('idPreguntaQuiz');
                $table->unsignedBigInteger('idQuiz');
                $table->text('enunciado');
                $table->string('tipo', 30)->default('opcion_multiple');
                $table->decimal('puntos', 5, 2)->default(1.00);
                $table->text('explicacion')->nullable();
                $table->integer('orden')->default(0);
                $table->timestamps();

                $table->foreign('idQuiz')->references('idQuiz')->on('quizzes')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('quiz_opciones')) {
            Schema::create('quiz_opciones', function (Blueprint $table) {
                $table->id('idOpcionQuiz');
                $table->unsignedBigInteger('idPreguntaQuiz');
                $table->text('texto_opcion');
                $table->boolean('es_correcta')->default(false);
                $table->integer('orden')->default(0);
                $table->timestamps();

                $table->foreign('idPreguntaQuiz')->references('idPreguntaQuiz')->on('quiz_preguntas')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('quiz_asignaciones')) {
            Schema::create('quiz_asignaciones', function (Blueprint $table) {
                $table->id('idAsignacion');
                $table->unsignedBigInteger('idQuiz');
                $table->unsignedBigInteger('idEstudiante');
                $table->timestamps();

                $table->foreign('idQuiz')->references('idQuiz')->on('quizzes')->onDelete('cascade');
                $table->foreign('idEstudiante')->references('idUsuario')->on('usuarios')->onDelete('cascade');
                $table->unique(['idQuiz', 'idEstudiante']);
            });
        }

        if (! Schema::hasTable('quiz_intentos')) {
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

                $table->foreign('idQuiz')->references('idQuiz')->on('quizzes')->onDelete('cascade');
                $table->foreign('idEstudiante')->references('idUsuario')->on('usuarios')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('quiz_respuestas_intentos')) {
            Schema::create('quiz_respuestas_intentos', function (Blueprint $table) {
                $table->id('idRespuestaIntento');
                $table->unsignedBigInteger('idIntentoQuiz');
                $table->unsignedBigInteger('idPreguntaQuiz');
                $table->unsignedBigInteger('idOpcionSeleccionada')->nullable();
                $table->boolean('es_correcta')->default(false);
                $table->decimal('puntaje_ganado', 5, 2)->default(0.00);
                $table->timestamps();

                $table->foreign('idIntentoQuiz')->references('idIntentoQuiz')->on('quiz_intentos')->onDelete('cascade');
                $table->foreign('idPreguntaQuiz')->references('idPreguntaQuiz')->on('quiz_preguntas')->onDelete('cascade');
                $table->foreign('idOpcionSeleccionada')->references('idOpcionQuiz')->on('quiz_opciones')->onDelete('set null');
            });
        }
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
