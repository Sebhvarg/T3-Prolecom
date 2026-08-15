<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('quizzes', 'xp_recompensa')) {
            Schema::table('quizzes', static function (Blueprint $table) {
                $table->integer('xp_recompensa')->default(50)->after('intentos_maximos');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('quizzes', 'xp_recompensa')) {
            Schema::table('quizzes', static function (Blueprint $table) {
                $table->dropColumn('xp_recompensa');
            });
        }
    }
};
