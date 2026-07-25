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
    ];

    protected $casts = [
        'validada' => 'boolean',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    public function pregunta()
    {
        return $this->belongsTo(Pregunta::class, 'idPregunta', 'idPregunta');
    }
}
