<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoVoto extends Model
{
    protected $table = 'tipos_voto';

    protected $primaryKey = 'idTipoVoto';

    public $timestamps = false;

    protected $fillable = ['idTipoVoto', 'nombre'];
}
