<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizIntento extends Model
{
    use HasFactory;

    protected $table = 'quiz_intentos';

    protected $primaryKey = 'idIntentoQuiz';

    protected $fillable = [
        'idQuiz',
        'idEstudiante',
        'puntaje_obtenido',
        'puntaje_maximo',
        'porcentaje',
        'aprobado',
        'tiempo_segundos',
        'fecha_envio',
    ];

    protected $casts = [
        'puntaje_obtenido' => 'float',
        'puntaje_maximo' => 'float',
        'porcentaje' => 'float',
        'aprobado' => 'boolean',
        'tiempo_segundos' => 'integer',
        'fecha_envio' => 'datetime',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'idQuiz', 'idQuiz');
    }

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'idEstudiante', 'idUsuario');
    }

    public function respuestas()
    {
        return $this->hasMany(QuizRespuestaIntento::class, 'idIntentoQuiz', 'idIntentoQuiz');
    }
}
