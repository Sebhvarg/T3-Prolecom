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
        if (! Schema::hasTable('moderadores_cursos')) {
            Schema::create('moderadores_cursos', function (Blueprint $table) {
                $table->unsignedBigInteger('idCurso');
                $table->unsignedBigInteger('idUsuarioModerador');
                $table->unsignedBigInteger('idAsignador')->nullable();
                $table->primary(['idCurso', 'idUsuarioModerador']);
                $table->foreign('idCurso')->references('idCurso')->on('cursos')->onDelete('cascade');
                $table->foreign('idUsuarioModerador')->references('idUsuario')->on('usuarios')->onDelete('cascade');
                $table->foreign('idAsignador')->references('idUsuario')->on('usuarios')->onDelete('set null');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moderadores_cursos');
    }
};
