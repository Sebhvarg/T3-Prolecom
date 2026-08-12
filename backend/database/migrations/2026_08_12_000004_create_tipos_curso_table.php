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
        if (! Schema::hasTable('tipos_curso')) {
            Schema::create('tipos_curso', function (Blueprint $table) {
                $table->id('idTipoCurso');
                $table->string('nombre', 50)->unique();
            });

            DB::table('tipos_curso')->insertOrIgnore([
                ['idTipoCurso' => 1, 'nombre' => 'público'],
                ['idTipoCurso' => 2, 'nombre' => 'privado'],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_curso');
    }
};
