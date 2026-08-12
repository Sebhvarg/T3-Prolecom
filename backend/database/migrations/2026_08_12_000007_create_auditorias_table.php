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
        if (! Schema::hasTable('auditorias')) {
            Schema::create('auditorias', function (Blueprint $table) {
                $table->id('idAuditoria');
                $table->unsignedBigInteger('idUsuario')->nullable();
                $table->string('nombreUsuario', 100)->nullable();
                $table->string('rolUsuario', 50)->nullable();
                $table->string('accion', 100);
                $table->string('entidad', 50);
                $table->unsignedBigInteger('entidad_id')->nullable();
                $table->text('detalles')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();

                $table->foreign('idUsuario')->references('idUsuario')->on('usuarios')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auditorias');
    }
};
