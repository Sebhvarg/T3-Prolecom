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
        Schema::create('estudiantes_metadata', function (Blueprint $table) {
            $table->unsignedBigInteger('idUsuario')->primary();
            $table->integer('puntosExperiencia')->default(0);
            $table->foreign('idUsuario')->references('idUsuario')->on('usuarios')->onDelete('cascade');
        });

        Schema::create('profesores_metadata', function (Blueprint $table) {
            $table->unsignedBigInteger('idUsuario')->primary();
            $table->string('especialidad', 150)->nullable();
            $table->foreign('idUsuario')->references('idUsuario')->on('usuarios')->onDelete('cascade');
        });

        Schema::create('reportes', function (Blueprint $table) {
            $table->id('idReporte');
            $table->string('motivo', 255);
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('idUsuarioReportador');
            $table->enum('tipoPublicacion', ['pregunta', 'respuesta', 'material']);
            $table->unsignedBigInteger('idPublicacionReportada');
            $table->enum('estado', ['pendiente', 'resuelto', 'escalado'])->default('pendiente');
            $table->foreign('idUsuarioReportador')->references('idUsuario')->on('usuarios');
            $table->timestamps();
        });

        Schema::create('logs_actividad', function (Blueprint $table) {
            $table->id('idLog');
            $table->string('accion', 255);
            $table->unsignedBigInteger('idUsuario');
            $table->foreign('idUsuario')->references('idUsuario')->on('usuarios')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logs_actividad');
        Schema::dropIfExists('reportes');
        Schema::dropIfExists('profesores_metadata');
        Schema::dropIfExists('estudiantes_metadata');
    }
};
