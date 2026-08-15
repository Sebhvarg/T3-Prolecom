<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizAsignacion extends Model
{
    use HasFactory;

    protected $table = 'quiz_asignaciones';

    protected $primaryKey = 'idAsignacion';

    protected $fillable = [
        'idQuiz',
        'idEstudiante',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'idQuiz', 'idQuiz');
    }

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'idEstudiante', 'idUsuario');
    }
}
