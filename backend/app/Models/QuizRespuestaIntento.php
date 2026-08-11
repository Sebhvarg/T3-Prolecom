<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizRespuestaIntento extends Model
{
    use HasFactory;

    protected $table = 'quiz_respuestas_intentos';

    protected $primaryKey = 'idRespuestaIntento';

    protected $fillable = [
        'idIntentoQuiz',
        'idPreguntaQuiz',
        'idOpcionSeleccionada',
        'es_correcta',
        'puntaje_ganado',
    ];

    protected $casts = [
        'es_correcta' => 'boolean',
        'puntaje_ganado' => 'float',
    ];

    public function intento()
    {
        return $this->belongsTo(QuizIntento::class, 'idIntentoQuiz', 'idIntentoQuiz');
    }

    public function pregunta()
    {
        return $this->belongsTo(QuizPregunta::class, 'idPreguntaQuiz', 'idPreguntaQuiz');
    }

    public function opcionSeleccionada()
    {
        return $this->belongsTo(QuizOpcion::class, 'idOpcionSeleccionada', 'idOpcionQuiz');
    }
}
