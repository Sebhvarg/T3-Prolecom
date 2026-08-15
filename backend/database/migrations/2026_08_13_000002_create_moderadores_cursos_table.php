<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('moderadores_cursos')) {
            return;
        }

        Schema::create('moderadores_cursos', static function (Blueprint $table) {
            $table->foreignId('idCurso')->constrained('cursos', 'idCurso')->cascadeOnDelete();
            $table->foreignId('idUsuarioModerador')->constrained('usuarios', 'idUsuario')->cascadeOnDelete();
            $table->foreignId('idAsignador')->nullable()->constrained('usuarios', 'idUsuario')->nullOnDelete();
            $table->primary(['idCurso', 'idUsuarioModerador']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderadores_cursos');
    }
};
