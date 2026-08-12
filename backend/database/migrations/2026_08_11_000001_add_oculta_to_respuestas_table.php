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
        Schema::table('respuestas', function (Blueprint $table) {
            if (! Schema::hasColumn('respuestas', 'oculta')) {
                $table->boolean('oculta')->default(false)->after('validada');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('respuestas', function (Blueprint $table) {
            if (Schema::hasColumn('respuestas', 'oculta')) {
                $table->dropColumn('oculta');
            }
        });
    }
};
