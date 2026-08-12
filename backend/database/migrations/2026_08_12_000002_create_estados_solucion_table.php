<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('estados_solucion')) {
            Schema::create('estados_solucion', function (Blueprint $table) {
                $table->id('idEstadoSolucion');
                $table->string('nombre', 50)->unique();
            });

            DB::table('estados_solucion')->insertOrIgnore([
                ['idEstadoSolucion' => 1, 'nombre' => 'aprobado'],
                ['idEstadoSolucion' => 2, 'nombre' => 'rechazado'],
                ['idEstadoSolucion' => 3, 'nombre' => 'error_compilacion'],
                ['idEstadoSolucion' => 4, 'nombre' => 'tiempo_excedido'],
                ['idEstadoSolucion' => 5, 'nombre' => 'pendiente'],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estados_solucion');
    }
};
