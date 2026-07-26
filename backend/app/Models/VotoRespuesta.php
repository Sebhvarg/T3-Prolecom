<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VotoRespuesta extends Model
{
    use HasFactory;

    /**
     * La tabla usa `votos_respuestas` (plural con 's') — nombre existente en DB.
     * El campo `valor` es un tinyint: 1 = like, -1 = dislike.
     */
    protected $table = 'votos_respuestas';

    protected $fillable = [
        'idRespuesta',
        'idUsuario',
        'valor',
    ];

    protected $casts = [
        'valor' => 'integer',
    ];

    /**
     * Constantes de valor de voto.
     */
    const LIKE = 1;

    const DISLIKE = -1;

    /**
     * Retorna si el voto es un like.
     */
    public function esLike(): bool
    {
        return $this->valor === self::LIKE;
    }

    /**
     * Retorna si el voto es un dislike.
     */
    public function esDislike(): bool
    {
        return $this->valor === self::DISLIKE;
    }

    /**
     * Respuesta a la que pertenece este voto.
     */
    public function respuesta()
    {
        return $this->belongsTo(Respuesta::class, 'idRespuesta', 'idRespuesta');
    }

    /**
     * Usuario que emitió el voto.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }
}
