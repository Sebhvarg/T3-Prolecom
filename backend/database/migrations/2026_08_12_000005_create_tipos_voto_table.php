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
        if (! Schema::hasTable('tipos_voto')) {
            Schema::create('tipos_voto', function (Blueprint $table) {
                $table->id('idTipoVoto');
                $table->string('nombre', 50)->unique();
            });

            DB::table('tipos_voto')->insertOrIgnore([
                ['idTipoVoto' => 1, 'nombre' => 'me_gusta'],
                ['idTipoVoto' => 2, 'nombre' => 'no_me_gusta'],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_voto');
    }
};
