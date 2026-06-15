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
        Schema::create('cursos', function (Blueprint $table) {
            $table->id('idCurso');
            $table->string('titulo', 150);
            $table->text('descripcion');
            $table->string('lp', 50);
            $table->enum('tipo', ['público', 'privado'])->default('público');
            $table->unsignedBigInteger('idProfeCreador');
            $table->foreign('idProfeCreador')->references('idUsuario')->on('usuarios')->onUpdate('cascade');
            $table->timestamps();
        });

        Schema::create('inscripciones_cursos', function (Blueprint $table) {
            $table->unsignedBigInteger('idUsuarioEstudiante');
            $table->unsignedBigInteger('idCurso');
            $table->primary(['idUsuarioEstudiante', 'idCurso']);
            $table->foreign('idUsuarioEstudiante')->references('idUsuario')->on('usuarios')->onDelete('cascade');
            $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
            $table->timestamp('fechaInscripcion')->useCurrent();
        });

        Schema::create('temas', function (Blueprint $table) {
            $table->id('idTema');
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('idCurso');
            $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('materiales_aprendizaje', function (Blueprint $table) {
            $table->id('idMaterial');
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['PDF', 'video']);
            $table->string('enlaceArchivo', 255);
            $table->unsignedBigInteger('idUsuarioCreador');
            $table->foreign('idUsuarioCreador')->references('idUsuario')->on('usuarios')->onUpdate('cascade');
            $table->timestamps();
        });

        Schema::create('items_tema', function (Blueprint $table) {
            $table->id('idItemTema');
            $table->unsignedBigInteger('idTema');
            $table->string('itemable_type');
            $table->unsignedBigInteger('itemable_id');
            $table->integer('orden')->default(0);
            $table->foreign('idTema')->references('idTema')->on('temas')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items_tema');
        Schema::dropIfExists('materiales_aprendizaje');
        Schema::dropIfExists('temas');
        Schema::dropIfExists('inscripciones_cursos');
        Schema::dropIfExists('cursos');
    }
};
