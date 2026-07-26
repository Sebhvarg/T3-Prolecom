<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notificacion extends Model
{
    use HasFactory;

    protected $table = 'notificaciones';

    protected $primaryKey = 'idNotificacion';

    protected $fillable = [
        'idUsuario',
        'tipo',
        'titulo',
        'mensaje',
        'leida',
        'datos',
    ];

    protected $casts = [
        'leida' => 'boolean',
        'datos' => 'array',
    ];

    /**
     * Tipos de notificación disponibles en el foro.
     */
    const TIPO_NUEVA_RESPUESTA    = 'nueva_respuesta';
    const TIPO_RESPUESTA_VALIDADA = 'respuesta_validada';
    const TIPO_FORO_CERRADO       = 'foro_cerrado';
    const TIPO_PREGUNTA_OCULTADA  = 'pregunta_ocultada';

    /**
     * Usuario destinatario de la notificación.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idUsuario');
    }

    /**
     * Helper estático para crear notificaciones de foro fácilmente.
     *
     * @param int    $idUsuario   Destinatario
     * @param string $tipo        Constante TIPO_*
     * @param string $titulo
     * @param string $mensaje
     * @param array  $datos       Contexto adicional (idPregunta, idForo, etc.)
     */
    public static function crear(int $idUsuario, string $tipo, string $titulo, string $mensaje, array $datos = []): self
    {
        return self::create([
            'idUsuario' => $idUsuario,
            'tipo'      => $tipo,
            'titulo'    => $titulo,
            'mensaje'   => $mensaje,
            'leida'     => false,
            'datos'     => $datos,
        ]);
    }
}
