<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoCuenta extends Model
{
    protected $table = 'estadosCuenta';
    protected $primaryKey = 'idEstado';
    public $timestamps = false;

    protected $fillable = ['estado'];

    public function usuarios()
    {
        return $this->hasMany(User::class, 'idEstado', 'idEstado');
    }
}
