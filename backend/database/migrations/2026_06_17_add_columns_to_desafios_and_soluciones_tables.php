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
        // 1. Agregar columnas a desafios
        Schema::table('desafios', function (Blueprint $table) {
            $table->unsignedInteger('puntos')->default(10)->after('salidaEsperada');
            $table->text('starter_code')->nullable()->after('puntos');
        });

        // 2. Agregar columnas a soluciones
        Schema::table('soluciones', function (Blueprint $table) {
            // Mapear los estados adicionales para Judge0
            $table->string('estado', 50)->default('pendiente')->change();

            $table->unsignedBigInteger('idLenguaje')->nullable()->after('idDesafio');
            $table->unsignedInteger('casos_pasados')->default(0)->after('idLenguaje');
            $table->unsignedInteger('casos_totales')->default(0)->after('casos_pasados');
            $table->unsignedInteger('tiempo_ejecucion_ms')->nullable()->after('casos_totales');
            $table->unsignedInteger('memoria_ejecucion_kb')->nullable()->after('tiempo_ejecucion_ms');
            $table->text('stdout')->nullable()->after('memoria_ejecucion_kb');
            $table->text('stderr')->nullable()->after('stdout');
            $table->unsignedInteger('puntos_otorgados')->default(0)->after('stderr');

            $table->foreign('idLenguaje')->references('idLenguaje')->on('lenguajes_programacion')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soluciones', function (Blueprint $table) {
            $table->dropForeign(['idLenguaje']);
            $table->dropColumn([
                'idLenguaje',
                'casos_pasados',
                'casos_totales',
                'tiempo_ejecucion_ms',
                'memoria_ejecucion_kb',
                'stdout',
                'stderr',
                'puntos_otorgados',
            ]);
            $table->enum('estado', ['enviado', 'aprobado', 'rechazado'])->default('enviado')->change();
        });

        Schema::table('desafios', function (Blueprint $table) {
            $table->dropColumn(['puntos', 'starter_code']);
        });
    }
};
