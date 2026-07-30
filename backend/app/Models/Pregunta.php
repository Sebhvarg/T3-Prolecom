<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    use HasFactory;

    protected $table = 'preguntas';

    protected $primaryKey = 'idPregunta';

    protected $fillable = [
        'titulo',
        'descripcion',
        'idUsuarioCreador',
        'idForo',
        'estado',
        'fijada',
        'editado',
    ];

    protected $casts = [
        'fijada' => 'boolean',
        'editado' => 'boolean',
        'vistas' => 'integer',
    ];

    /**
     * Usuario que creó la pregunta.
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'idUsuarioCreador', 'idUsuario');
    }

    /**
     * Foro al que pertenece esta pregunta.
     */
    public function foro()
    {
        return $this->belongsTo(Foro::class, 'idForo', 'idForo');
    }

    /**
     * Respuestas publicadas en esta pregunta.
     * Las respuestas validadas/oficiales aparecen primero.
     */
    public function respuestas()
    {
        return $this->hasMany(Respuesta::class, 'idPregunta', 'idPregunta')
            ->orderByDesc('validada')
            ->orderBy('created_at');
    }

    /**
     * Incrementa el contador de vistas de forma atómica (evita race conditions).
     */
    public function incrementarVistas(): void
    {
        $this->increment('vistas');
    }
}
