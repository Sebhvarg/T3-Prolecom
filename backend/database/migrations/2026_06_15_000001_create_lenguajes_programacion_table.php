<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lenguajes_programacion', function (Blueprint $table) {
            $table->id('idLenguaje');
            $table->string('nombre', 50)->unique();
            $table->string('slug', 50)->unique()->comment('Identificador corto: python, javascript, etc.');
            $table->string('icono', 10)->nullable()->comment('Emoji o código de icono');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lenguajes_programacion');
    }
};
