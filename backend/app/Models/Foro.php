<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Foro extends Model
{
    use HasFactory;

    protected $table = 'foros';

    protected $primaryKey = 'idForo';

    protected $fillable = [
        'titulo',
        'descripcion',
        'idUsuarioCreador',
        'estado',
    ];

    /**
     * Relación polimórfica inversa con items_tema.
     * Permite que el Foro aparezca dentro de un Tema como itemable.
     */
    public function itemTema()
    {
        return $this->morphOne(ItemTema::class, 'itemable');
    }

    /**
     * Usuario que creó el foro.
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'idUsuarioCreador', 'idUsuario');
    }

    /**
     * Preguntas publicadas en este foro.
     * Las fijadas (pinned) aparecen primero, luego por fecha descendente.
     */
    public function preguntas()
    {
        return $this->hasMany(Pregunta::class, 'idForo', 'idForo')
                    ->orderByDesc('fijada')
                    ->orderByDesc('created_at');
    }

    /**
     * Verifica si el foro está abierto para nuevas publicaciones.
     */
    public function estaAbierto(): bool
    {
        return $this->estado === 'abierto';
    }
}
