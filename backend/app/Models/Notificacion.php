<?php

namespace App\Models;

use App\Events\NotificacionCreada;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
    const TIPO_NUEVA_RESPUESTA = 'nueva_respuesta';

    const TIPO_RESPUESTA_VALIDADA = 'respuesta_validada';

    const TIPO_FORO_CERRADO = 'foro_cerrado';

    const TIPO_PREGUNTA_OCULTADA = 'pregunta_ocultada';

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
     * @param  int  $idUsuario  Destinatario
     * @param  string  $tipo  Constante TIPO_*
     * @param  array  $datos  Contexto adicional (idPregunta, idForo, etc.)
     */
    public static function crear(int $idUsuario, string $tipo, string $titulo, string $mensaje, array $datos = []): self
    {
        $notificacion = self::create([
            'idUsuario' => $idUsuario,
            'tipo'      => $tipo,
            'titulo'    => $titulo,
            'mensaje'   => $mensaje,
            'leida'     => false,
            'datos'     => $datos,
        ]);

        // Patrón Observer: notificar a los suscriptores en tiempo real
        try {
            broadcast(new NotificacionCreada($notificacion))->toOthers();
        } catch (\Exception $e) {
            Log::warning('Broadcasting de notificación falló (no crítico): '.$e->getMessage());
        }

        return $notificacion;
    }

    /**
     * Envía una notificación a todos los estudiantes matriculados en un curso.
     */
    public static function notificarEstudiantesDelCurso(int $idCurso, string $tipo, string $titulo, string $mensaje, array $datos = []): void
    {
        try {
            $curso = Curso::find($idCurso);
            if (! $curso) {
                return;
            }

            $estudianteIds = DB::table('inscripciones_cursos')
                ->where('idCurso', $idCurso)
                ->pluck('idUsuarioEstudiante');

            foreach ($estudianteIds as $idEstudiante) {
                $notificacion = self::create([
                    'idUsuario' => $idEstudiante,
                    'tipo'      => $tipo,
                    'titulo'    => $titulo,
                    'mensaje'   => "{$curso->titulo}: {$mensaje}",
                    'leida'     => false,
                    'datos'     => array_merge(['idCurso' => $idCurso], $datos),
                ]);

                try {
                    broadcast(new NotificacionCreada($notificacion));
                } catch (\Exception) {
                    // Broadcasting no crítico — no interrumpir el flujo
                }
            }
        } catch (\Exception $e) {
            Log::error("Error notificando estudiantes del curso {$idCurso}: ".$e->getMessage());
        }
    }
}
