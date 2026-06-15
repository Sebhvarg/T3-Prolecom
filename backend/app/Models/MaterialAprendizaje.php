<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialAprendizaje extends Model
{
    use HasFactory;

    protected $table = 'materiales_aprendizaje';
    protected $primaryKey = 'idMaterial';

    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo',
        'enlaceArchivo',
        'idUsuarioCreador',
    ];

    public function itemTema()
    {
        return $this->morphOne(ItemTema::class, 'itemable');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'idUsuarioCreador', 'idUsuario');
    }
}
