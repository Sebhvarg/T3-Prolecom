<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Respuesta extends Model
{
    use HasFactory;

    protected $table = 'respuestas';

    protected $primaryKey = 'idRespuesta';

    protected $fillable = [
        'contenido',
        'idUsuario',
        'idPregunta',
        'validada',
        'editado',
    ];

    protected $casts = [
        'validada' => 'boolean',
        'editado'  => 'boolean',
    ];

    /**
     * Usuario que publicó la respuesta.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    /**
     * Pregunta a la que pertenece esta respuesta.
     */
    public function pregunta()
    {
        return $this->belongsTo(Pregunta::class, 'idPregunta', 'idPregunta');
    }

    /**
     * Votos (likes/dislikes) recibidos por esta respuesta.
     * Tabla real: votos_respuestas, campo valor: 1=like, -1=dislike.
     */
    public function votos()
    {
        return $this->hasMany(VotoRespuesta::class, 'idRespuesta', 'idRespuesta');
    }

    /**
     * Retorna el conteo de likes (valor = 1) de esta respuesta.
     */
    public function getLikesCountAttribute(): int
    {
        return $this->votos()->where('valor', VotoRespuesta::LIKE)->count();
    }

    /**
     * Retorna el conteo de dislikes (valor = -1) de esta respuesta.
     */
    public function getDislikesCountAttribute(): int
    {
        return $this->votos()->where('valor', VotoRespuesta::DISLIKE)->count();
    }
}
