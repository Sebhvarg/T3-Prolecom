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
        Schema::create('preguntas', function (Blueprint $table) {
            $table->id('idPregunta');
            $table->string('titulo', 200);
            $table->text('descripcion');
            $table->unsignedBigInteger('idUsuarioCreador');
            $table->unsignedBigInteger('idCurso');
            $table->enum('estado', ['abierta', 'resuelta', 'oculta'])->default('abierta');
            $table->foreign('idUsuarioCreador')->references('idUsuario')->on('usuarios')->onUpdate('cascade');
            $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('respuestas', function (Blueprint $table) {
            $table->id('idRespuesta');
            $table->text('contenido');
            $table->unsignedBigInteger('idUsuario');
            $table->unsignedBigInteger('idPregunta');
            $table->boolean('validada')->default(false);
            $table->foreign('idUsuario')->references('idUsuario')->on('usuarios')->onUpdate('cascade');
            $table->foreign('idPregunta')->references('idPregunta')->on('preguntas')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('desafios', function (Blueprint $table) {
            $table->id('idDesafio');
            $table->string('titulo', 150);
            $table->text('descripcionProblema');
            $table->enum('dificultad', ['Easy', 'Medium', 'Hard']);
            $table->json('testCases');
            $table->text('salidaEsperada');
            $table->enum('estado', ['pendiente', 'publicado'])->default('pendiente');
            $table->unsignedBigInteger('idCreador');
            $table->unsignedBigInteger('idCurso');
            $table->foreign('idCreador')->references('idUsuario')->on('usuarios')->onUpdate('cascade');
            $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('soluciones', function (Blueprint $table) {
            $table->id('idSolucion');
            $table->text('codigoFuente');
            $table->enum('estado', ['enviado', 'aprobado', 'rechazado'])->default('enviado');
            $table->unsignedBigInteger('idEstudiante');
            $table->unsignedBigInteger('idDesafio');
            $table->foreign('idEstudiante')->references('idUsuario')->on('usuarios')->onUpdate('cascade');
            $table->foreign('idDesafio')->references('idDesafio')->on('desafios')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('quizzes', function (Blueprint $table) {
            $table->id('idQuiz');
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('idCurso');
            $table->unsignedBigInteger('idCreador');
            $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
            $table->foreign('idCreador')->references('idUsuario')->on('usuarios')->onUpdate('cascade');
            $table->timestamps();
        });

        Schema::create('flashcards', function (Blueprint $table) {
            $table->id('idFlashcard');
            $table->text('pregunta');
            $table->text('respuesta');
            $table->unsignedBigInteger('idEstudiante');
            $table->unsignedBigInteger('idCurso');
            $table->foreign('idEstudiante')->references('idUsuario')->on('usuarios')->onDelete('cascade');
            $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flashcards');
        Schema::dropIfExists('quizzes');
        Schema::dropIfExists('soluciones');
        Schema::dropIfExists('desafios');
        Schema::dropIfExists('respuestas');
        Schema::dropIfExists('preguntas');
    }
};
