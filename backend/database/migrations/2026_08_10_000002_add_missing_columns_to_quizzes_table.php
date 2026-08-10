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
            if (! Schema::hasColumn('quizzes', 'idTema')) {
                $table->unsignedBigInteger('idTema')->nullable()->after('idCurso');
                $table->foreign('idTema')->references('idTema')->on('temas')->onDelete('set null');
            }
            if (! Schema::hasColumn('quizzes', 'limite_tiempo_minutos')) {
                $table->integer('limite_tiempo_minutos')->default(0)->after('idCreador');
            }
            if (! Schema::hasColumn('quizzes', 'calificacion_maxima')) {
                $table->decimal('calificacion_maxima', 8, 2)->default(10.00)->after('limite_tiempo_minutos');
            }
            if (! Schema::hasColumn('quizzes', 'mostrar_retroalimentacion')) {
                $table->boolean('mostrar_retroalimentacion')->default(true)->after('calificacion_maxima');
            }
            if (! Schema::hasColumn('quizzes', 'estado')) {
                $table->string('estado', 20)->default('publicado')->after('mostrar_retroalimentacion');
            }
            if (! Schema::hasColumn('quizzes', 'asignar_a_todos')) {
                $table->boolean('asignar_a_todos')->default(true)->after('estado');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            if (Schema::hasColumn('quizzes', 'idTema')) {
                $table->dropForeign(['idTema']);
                $table->dropColumn('idTema');
            }
            if (Schema::hasColumn('quizzes', 'limite_tiempo_minutos')) {
                $table->dropColumn('limite_tiempo_minutos');
            }
            if (Schema::hasColumn('quizzes', 'calificacion_maxima')) {
                $table->dropColumn('calificacion_maxima');
            }
            if (Schema::hasColumn('quizzes', 'mostrar_retroalimentacion')) {
                $table->dropColumn('mostrar_retroalimentacion');
            }
            if (Schema::hasColumn('quizzes', 'estado')) {
                $table->dropColumn('estado');
            }
            if (Schema::hasColumn('quizzes', 'asignar_a_todos')) {
                $table->dropColumn('asignar_a_todos');
            }
        });
    }
};
