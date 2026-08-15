<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizOpcion extends Model
{
    use HasFactory;

    protected $table = 'quiz_opciones';

    protected $primaryKey = 'idOpcionQuiz';

    protected $fillable = [
        'idPreguntaQuiz',
        'texto_opcion',
        'es_correcta',
        'orden',
    ];

    protected $casts = [
        'es_correcta' => 'boolean',
        'orden' => 'integer',
    ];

    public function pregunta()
    {
        return $this->belongsTo(QuizPregunta::class, 'idPreguntaQuiz', 'idPreguntaQuiz');
    }
}
