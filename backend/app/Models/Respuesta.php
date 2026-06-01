<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Respuesta extends Model
{
    protected $table = 'respuestas';
    protected $primaryKey = 'idRespuesta';

    protected $fillable = [
        'contenido',
        'idUsuario',
        'idPregunta',
        'validada'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'idUsuario', 'idUsuario');
    }

    public function pregunta()
    {
        return $this->belongsTo(Pregunta::class, 'idPregunta', 'idPregunta');
    }
}
