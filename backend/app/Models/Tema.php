<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tema extends Model
{
    use HasFactory;

    protected $table = 'temas';
    protected $primaryKey = 'idTema';

    protected $fillable = [
        'nombre',
        'descripcion',
        'idCurso',
    ];

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'idCurso', 'idCurso');
    }

    public function items()
    {
        return $this->hasMany(ItemTema::class, 'idTema', 'idTema')->orderBy('orden');
    }
}
