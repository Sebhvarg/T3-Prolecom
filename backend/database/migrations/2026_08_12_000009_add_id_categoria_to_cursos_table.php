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
        if (Schema::hasTable('cursos') && ! Schema::hasColumn('cursos', 'idCategoria')) {
            Schema::table('cursos', function (Blueprint $table) {
                $table->unsignedBigInteger('idCategoria')->nullable()->default(1)->after('tipo');
                $table->foreign('idCategoria')->references('idCategoria')->on('categorias_curso')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cursos') && Schema::hasColumn('cursos', 'idCategoria')) {
            Schema::table('cursos', function (Blueprint $table) {
                $table->dropForeign(['idCategoria']);
                $table->dropColumn('idCategoria');
            });
        }
    }
};
