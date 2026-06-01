<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    protected $table = 'preguntas';
    protected $primaryKey = 'idPregunta';

    protected $fillable = [
        'titulo',
        'descripcion',
        'idUsuarioCreador',
        'idCurso',
        'estado'
    ];

    public function creador()
    {
        return $this->belongsTo(Usuario::class, 'idUsuarioCreador', 'idUsuario');
    }

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'idCurso', 'idCurso');
    }

    public function respuestas()
    {
        return $this->hasMany(Respuesta::class, 'idPregunta', 'idPregunta');
    }
}
