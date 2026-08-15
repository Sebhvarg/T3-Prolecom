<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DificultadDesafio extends Model
{
    protected $table = 'dificultades_desafio';

    protected $primaryKey = 'idDificultad';

    public $timestamps = false;

    protected $fillable = ['idDificultad', 'nombre'];
}
