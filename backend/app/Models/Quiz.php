<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $table = 'quizzes';

    protected $primaryKey = 'idQuiz';

    protected $fillable = [
        'titulo',
        'descripcion',
        'idCurso',
        'idTema',
        'idCreador',
        'limite_tiempo_minutos',
        'intentos_maximos',
        'calificacion_maxima',
        'mostrar_retroalimentacion',
        'estado',
        'asignar_a_todos',
    ];

    protected $casts = [
        'mostrar_retroalimentacion' => 'boolean',
        'asignar_a_todos' => 'boolean',
        'limite_tiempo_minutos' => 'integer',
        'intentos_maximos' => 'integer',
        'calificacion_maxima' => 'float',
    ];

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'idCurso', 'idCurso');
    }

    public function tema()
    {
        return $this->belongsTo(Tema::class, 'idTema', 'idTema');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'idCreador', 'idUsuario');
    }

    public function preguntas()
    {
        return $this->hasMany(QuizPregunta::class, 'idQuiz', 'idQuiz')->orderBy('orden', 'asc');
    }

    public function asignaciones()
    {
        return $this->hasMany(QuizAsignacion::class, 'idQuiz', 'idQuiz');
    }

    public function intentos()
    {
        return $this->hasMany(QuizIntento::class, 'idQuiz', 'idQuiz');
    }

    public function itemTema()
    {
        return $this->morphOne(ItemTema::class, 'itemable');
    }
}
