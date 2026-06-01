<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = 'roles';
    protected $primaryKey = 'idRol';
    public $timestamps = false; // El script original no tenía timestamps en roles

    protected $fillable = ['rol'];

    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'rolUsuario', 'idRol', 'idUsuario');
    }

    public function rutas()
    {
        return $this->hasMany(Ruta::class, 'idRol', 'idRol');
    }
}
