<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ayudantes_cursos')) {
            return;
        }

        Schema::create('ayudantes_cursos', static function (Blueprint $table) {
            $table->foreignId('idCurso')->constrained('cursos', 'idCurso')->cascadeOnDelete();
            $table->foreignId('idUsuarioAyudante')->constrained('usuarios', 'idUsuario')->cascadeOnDelete();
            $table->foreignId('idAsignador')->nullable()->constrained('usuarios', 'idUsuario')->nullOnDelete();
            $table->primary(['idCurso', 'idUsuarioAyudante']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ayudantes_cursos');
    }
};
