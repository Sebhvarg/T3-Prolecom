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
        if (! Schema::hasTable('estados_quiz')) {
            Schema::create('estados_quiz', function (Blueprint $table) {
                $table->id('idEstadoQuiz');
                $table->string('nombre', 50)->unique();
            });

            DB::table('estados_quiz')->insertOrIgnore([
                ['idEstadoQuiz' => 1, 'nombre' => 'borrador'],
                ['idEstadoQuiz' => 2, 'nombre' => 'publicado'],
                ['idEstadoQuiz' => 3, 'nombre' => 'cerrado'],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estados_quiz');
    }
};
