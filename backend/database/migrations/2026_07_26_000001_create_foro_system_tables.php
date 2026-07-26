<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Soporta tanto bases de datos existentes como ejecuciones en limpio (RefreshDatabase en PHPUnit).
     */
    public function up(): void
    {
        // 1. TABLA FOROS
        if (! Schema::hasTable('foros')) {
            Schema::create('foros', function (Blueprint $table) {
                $table->id('idForo');
                $table->string('titulo', 200);
                $table->text('descripcion')->nullable();
                $table->unsignedBigInteger('idUsuarioCreador');
                $table->enum('estado', ['abierto', 'cerrado'])->default('abierto');
                $table->foreign('idUsuarioCreador')
                      ->references('idUsuario')
                      ->on('usuarios')
                      ->onUpdate('cascade');
                $table->timestamps();
            });
        } else {
            Schema::table('foros', function (Blueprint $table) {
                if (! Schema::hasColumn('foros', 'estado')) {
                    $table->enum('estado', ['abierto', 'cerrado'])->default('abierto')->after('idUsuarioCreador');
                }
            });
        }

        // 2. TABLA NOTIFICACIONES
        if (! Schema::hasTable('notificaciones')) {
            Schema::create('notificaciones', function (Blueprint $table) {
                $table->id('idNotificacion');
                $table->unsignedBigInteger('idUsuario');
                $table->string('tipo', 60);
                $table->string('titulo', 200);
                $table->text('mensaje');
                $table->boolean('leida')->default(false);
                $table->json('datos')->nullable();
                $table->foreign('idUsuario')
                      ->references('idUsuario')
                      ->on('usuarios')
                      ->onDelete('cascade');
                $table->timestamps();
            });
        }

        // 3. TABLA VOTOS_RESPUESTAS
        if (! Schema::hasTable('votos_respuestas')) {
            Schema::create('votos_respuestas', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('idUsuario');
                $table->unsignedBigInteger('idRespuesta');
                $table->tinyInteger('valor');
                $table->unique(['idUsuario', 'idRespuesta'], 'votos_respuestas_idusuario_idrespuesta_unique');
                $table->foreign('idRespuesta')
                      ->references('idRespuesta')
                      ->on('respuestas')
                      ->onDelete('cascade');
                $table->foreign('idUsuario')
                      ->references('idUsuario')
                      ->on('usuarios')
                      ->onDelete('cascade');
                $table->timestamps();
            });
        }

        // 4. MODIFICAR TABLA PREGUNTAS
        Schema::table('preguntas', function (Blueprint $table) {
            if (Schema::hasColumn('preguntas', 'idCurso')) {
                $table->dropForeign(['idCurso']);
                $table->dropColumn('idCurso');
            }

            if (! Schema::hasColumn('preguntas', 'idForo')) {
                $table->unsignedBigInteger('idForo')->after('idUsuarioCreador');
                $table->foreign('idForo')
                      ->references('idForo')
                      ->on('foros')
                      ->onDelete('cascade');
            }

            if (! Schema::hasColumn('preguntas', 'fijada')) {
                $table->boolean('fijada')->default(false)->after('estado');
            }

            if (! Schema::hasColumn('preguntas', 'vistas')) {
                $table->unsignedInteger('vistas')->default(0)->after('fijada');
            }

            if (! Schema::hasColumn('preguntas', 'editado')) {
                $table->boolean('editado')->default(false)->after('vistas');
            }
        });

        // 5. MODIFICAR TABLA RESPUESTAS
        Schema::table('respuestas', function (Blueprint $table) {
            if (! Schema::hasColumn('respuestas', 'editado')) {
                $table->boolean('editado')->default(false)->after('validada');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
        Schema::dropIfExists('votos_respuestas');

        Schema::table('respuestas', function (Blueprint $table) {
            if (Schema::hasColumn('respuestas', 'editado')) {
                $table->dropColumn('editado');
            }
        });

        Schema::table('preguntas', function (Blueprint $table) {
            if (Schema::hasColumn('preguntas', 'idForo')) {
                $table->dropForeign(['idForo']);
                $table->dropColumn(['idForo', 'fijada', 'editado']);
            }
        });

        Schema::dropIfExists('foros');
    }
};
