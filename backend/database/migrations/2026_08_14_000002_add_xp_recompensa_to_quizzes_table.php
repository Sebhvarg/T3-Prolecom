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
        Schema::table('quizzes', function (Blueprint $table) {
            if (! Schema::hasColumn('quizzes', 'xp_recompensa')) {
                $table->integer('xp_recompensa')->default(50)->after('intentos_maximos');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            if (Schema::hasColumn('quizzes', 'xp_recompensa')) {
                $table->dropColumn('xp_recompensa');
            }
        });
    }
};
