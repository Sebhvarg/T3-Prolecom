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
        if (! Schema::hasTable('tipos_material')) {
            Schema::create('tipos_material', function (Blueprint $table) {
                $table->id('idTipoMaterial');
                $table->string('nombre', 50)->unique();
            });

            DB::table('tipos_material')->insertOrIgnore([
                ['idTipoMaterial' => 1, 'nombre' => 'PDF'],
                ['idTipoMaterial' => 2, 'nombre' => 'video'],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_material');
    }
};
