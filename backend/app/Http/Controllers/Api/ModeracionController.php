<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialAprendizaje;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ModeracionController extends Controller
{
    /**
     * Listar todos los reportes con relaciones enriquecidas.
     */
    public function indexReportes(Request $request)
    {
        $estado = $request->query('estado', 'pendiente');
        $tipo = $request->query('tipo', 'todos');

        $query = DB::table('reportes');

        if ($estado !== 'todos') {
            $query->where('estado', $estado);
        }

        if ($tipo !== 'todos') {
            $query->where('tipoPublicacion', $tipo);
        }

        $reportesRaw = $query->orderByDesc('created_at')->get();

        $reportes = $reportesRaw->map(function ($rep) {
            $reportador = User::select('idUsuario', 'nombreCompleto', 'usuario', 'email')
                ->find($rep->idUsuarioReportador);

            $contenidoReportado = null;
            $autorContenido = null;

            if ($rep->tipoPublicacion === 'pregunta') {
                $preg = Pregunta::with('creador:idUsuario,nombreCompleto,usuario,email,idEstado')->find($rep->idPublicacionReportada);
                if ($preg) {
                    $contenidoReportado = [
                        'id' => $preg->idPregunta,
                        'titulo' => $preg->titulo,
                        'texto' => $preg->descripcion,
                        'estado' => $preg->estado,
                        'idForo' => $preg->idForo,
                    ];
                    $autorContenido = $preg->creador;
                }
            } elseif ($rep->tipoPublicacion === 'respuesta') {
                $resp = Respuesta::with(['usuario:idUsuario,nombreCompleto,usuario,email,idEstado', 'pregunta:idPregunta,titulo,idForo'])->find($rep->idPublicacionReportada);
                if ($resp) {
                    $contenidoReportado = [
                        'id' => $resp->idRespuesta,
                        'titulo' => 'Respuesta en: '.($resp->pregunta->titulo ?? 'Pregunta'),
                        'texto' => $resp->contenido,
                        'oculta' => (bool) $resp->oculta,
                        'idPregunta' => $resp->idPregunta,
                        'idForo' => $resp->pregunta->idForo ?? null,
                    ];
                    $autorContenido = $resp->usuario;
                }
            } elseif ($rep->tipoPublicacion === 'material') {
                $mat = MaterialAprendizaje::with('creador:idUsuario,nombreCompleto,usuario,email,idEstado')->find($rep->idPublicacionReportada);
                if ($mat) {
                    $contenidoReportado = [
                        'id' => $mat->idMaterial,
                        'titulo' => $mat->nombre,
                        'texto' => $mat->tipo_archivo,
                    ];
                    $autorContenido = $mat->creador;
                }
            }

            return [
                'idReporte' => $rep->idReporte,
                'motivo' => $rep->motivo,
                'descripcion' => $rep->descripcion,
                'tipoPublicacion' => $rep->tipoPublicacion,
                'idPublicacionReportada' => $rep->idPublicacionReportada,
                'estado' => $rep->estado,
                'fecha' => $rep->created_at,
                'reportador' => $reportador,
                'contenido' => $contenidoReportado,
                'autor' => $autorContenido,
            ];
        });

        return response()->json($reportes);
    }

    /**
     * Marcar reporte como resuelto o desestimado.
     */
    public function resolverReporte(Request $request, $idReporte)
    {
        $afectados = DB::table('reportes')
            ->where('idReporte', $idReporte)
            ->update([
                'estado' => 'resuelto',
                'updated_at' => now(),
            ]);

        if (! $afectados) {
            return response()->json(['error' => 'Reporte no encontrado.'], 404);
        }

        return response()->json(['message' => 'Reporte marcado como resuelto.']);
    }

    /**
     * Ocultar o desocultar publicación reportada.
     */
    public function ocultarPublicacion(Request $request, $idReporte)
    {
        $reporte = DB::table('reportes')->where('idReporte', $idReporte)->first();

        if (! $reporte) {
            return response()->json(['error' => 'Reporte no encontrado.'], 404);
        }

        $nuevoEstadoOculto = false;

        if ($reporte->tipoPublicacion === 'pregunta') {
            $preg = Pregunta::find($reporte->idPublicacionReportada);
            if ($preg) {
                $nuevoEstado = ($preg->estado === 'oculta') ? 'abierta' : 'oculta';
                $preg->estado = $nuevoEstado;
                $preg->save();
                $nuevoEstadoOculto = ($nuevoEstado === 'oculta');
            }
        } elseif ($reporte->tipoPublicacion === 'respuesta') {
            $resp = Respuesta::find($reporte->idPublicacionReportada);
            if ($resp) {
                $resp->oculta = ! $resp->oculta;
                $resp->save();
                $nuevoEstadoOculto = (bool) $resp->oculta;
            }
        }

        // Auto-marcar reporte como resuelto al ocultar
        DB::table('reportes')->where('idReporte', $idReporte)->update([
            'estado' => 'resuelto',
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => $nuevoEstadoOculto ? 'Contenido ocultado exitosamente.' : 'Contenido restaurado exitosamente.',
            'oculto' => $nuevoEstadoOculto,
        ]);
    }

    /**
     * Banear o suspender usuario infractor.
     */
    public function banearUsuario(Request $request, $idUsuario)
    {
        $user = User::findOrFail($idUsuario);

        $validator = Validator::make($request->all(), [
            'idEstado' => 'sometimes|integer|in:1,2,3,4', // 1: Activo, 3: Suspendido, 4: Baneado
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $targetEstado = (int) $request->input('idEstado', 4); // Default 4 = Baneado

        $user->update(['idEstado' => $targetEstado]);

        if (in_array($targetEstado, [3, 4], true)) {
            // Revocar todos los tokens activos del usuario infractor
            DB::table('personal_access_tokens')
                ->where('tokenable_id', $idUsuario)
                ->delete();
        }

        $estadoNombre = match ($targetEstado) {
            1 => 'Activo',
            3 => 'Suspendido',
            4 => 'Baneado',
            default => 'Modificado',
        };

        return response()->json([
            'message' => "El usuario {$user->usuario} ha sido marcado como {$estadoNombre}.",
            'usuario' => [
                'idUsuario' => $user->idUsuario,
                'usuario' => $user->usuario,
                'idEstado' => $user->idEstado,
            ],
        ]);
    }

    /**
     * Métricas y estadísticas para el Dashboard de Moderación.
     */
    public function stats()
    {
        $pendientes = DB::table('reportes')->where('estado', 'pendiente')->count();
        $resueltos = DB::table('reportes')->where('estado', 'resuelto')->count();
        $preguntasOcultas = Pregunta::where('estado', 'oculta')->count();
        $respuestasOcultas = Respuesta::where('oculta', true)->count();
        $usuariosBaneados = User::whereIn('idEstado', [3, 4])->count();

        return response()->json([
            'pendientes' => $pendientes,
            'resueltos' => $resueltos,
            'contenidosOcultos' => $preguntasOcultas + $respuestasOcultas,
            'usuariosSancionados' => $usuariosBaneados,
        ]);
    }
}
