<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoMaterial extends Model
{
    protected $table = 'tipos_material';

    protected $primaryKey = 'idTipoMaterial';

    public $timestamps = false;

    protected $fillable = ['idTipoMaterial', 'nombre'];
}
