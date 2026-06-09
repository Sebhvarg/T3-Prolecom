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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id('idUsuario');
            $table->string('nombreCompleto', 500);
            $table->string('usuario', 120)->unique();
            $table->string('email', 120)->unique();
            $table->string('password');
            $table->date('fechaDeNacimiento')->nullable();
            $table->unsignedBigInteger('idEstado')->default(1);
            $table->string('avatar_path')->nullable();
            $table->integer('xp')->default(0);
            $table->foreign('idEstado')->references('idEstado')->on('estadosCuenta')->onDelete('restrict');
            $table->timestamps(); // Esto añadirá created_at (fechaDeRegistro) y updated_at
        });

        Schema::create('rolUsuario', function (Blueprint $table) {
            $table->unsignedBigInteger('idUsuario');
            $table->unsignedBigInteger('idRol');
            $table->primary(['idUsuario', 'idRol']);
            $table->foreign('idUsuario')->references('idUsuario')->on('usuarios')->onDelete('cascade');
            $table->foreign('idRol')->references('idRol')->on('roles')->onDelete('cascade');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rolUsuario');
        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
