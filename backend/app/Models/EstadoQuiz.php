<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoQuiz extends Model
{
    protected $table = 'estados_quiz';

    protected $primaryKey = 'idEstadoQuiz';

    public $timestamps = false;

    protected $fillable = ['idEstadoQuiz', 'nombre'];
}
