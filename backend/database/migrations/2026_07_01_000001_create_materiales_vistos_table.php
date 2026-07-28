<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materiales_vistos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idEstudiante');
            $table->unsignedBigInteger('idMaterial');
            $table->timestamp('visto_en')->useCurrent();
            $table->timestamps();

            $table->unique(['idEstudiante', 'idMaterial']);

            $table->foreign('idEstudiante')
                ->references('idUsuario')
                ->on('usuarios')
                ->onDelete('cascade');

            $table->foreign('idMaterial')
                ->references('idMaterial')
                ->on('materiales_aprendizaje')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materiales_vistos');
    }
};
