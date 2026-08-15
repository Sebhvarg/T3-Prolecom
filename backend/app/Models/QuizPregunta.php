<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizPregunta extends Model
{
    use HasFactory;

    protected $table = 'quiz_preguntas';

    protected $primaryKey = 'idPreguntaQuiz';

    protected $fillable = [
        'idQuiz',
        'enunciado',
        'tipo',
        'puntos',
        'explicacion',
        'orden',
    ];

    protected $casts = [
        'puntos' => 'float',
        'orden' => 'integer',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'idQuiz', 'idQuiz');
    }

    public function opciones()
    {
        return $this->hasMany(QuizOpcion::class, 'idPreguntaQuiz', 'idPreguntaQuiz')->orderBy('orden', 'asc');
    }
}
