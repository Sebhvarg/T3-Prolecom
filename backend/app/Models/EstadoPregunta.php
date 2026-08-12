<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoPregunta extends Model
{
    protected $table = 'estados_pregunta';

    protected $primaryKey = 'idEstadoPregunta';

    public $timestamps = false;

    protected $fillable = ['idEstadoPregunta', 'nombre'];
}
