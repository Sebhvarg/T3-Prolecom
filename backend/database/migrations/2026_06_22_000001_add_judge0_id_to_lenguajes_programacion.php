<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lenguajes_programacion', function (Blueprint $table) {
            if (! Schema::hasColumn('lenguajes_programacion', 'judge0_id')) {
                $table->integer('judge0_id')->nullable()->after('icono');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lenguajes_programacion', function (Blueprint $table) {
            if (Schema::hasColumn('lenguajes_programacion', 'judge0_id')) {
                $table->dropColumn('judge0_id');
            }
        });
    }
};
