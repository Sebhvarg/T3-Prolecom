<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Foro;
use App\Models\ItemTema;
use App\Models\Notificacion;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Tema;
use App\Models\VotoRespuesta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ForoController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────
    // HELPERS RBAC
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Verifica si el usuario autenticado puede modificar un recurso.
     * Regla: el creador/autor puede modificar lo suyo; Admin y Moderador pueden modificar cualquiera.
     */
    private function puedeModificar(Request $request, $recurso, string $campoOwner): bool
    {
        $user = $request->user();
        $esOwner = $recurso->{$campoOwner} === $user->idUsuario;
        $esSuperior = $user->roles->pluck('rol')
            ->intersect(['Administrador', 'Moderador'])
            ->isNotEmpty();

        return $esOwner || $esSuperior;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CRUD FOROS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Crear un foro dentro de un tema (Admin, Profesor, Ayudante).
     * El foro se registra también como itemable en items_tema.
     */
    public function store(Request $request, $idTema)
    {
        Tema::findOrFail($idTema);

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
        ], [
            'titulo.required' => 'El título del foro es obligatorio.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $foro = Foro::create([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'idUsuarioCreador' => $request->user()->idUsuario,
                'estado' => 'abierto',
            ]);

            DB::table('items_tema')->insert([
                'idTema' => $idTema,
                'itemable_type' => Foro::class,
                'itemable_id' => $foro->idForo,
                'orden' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            $foro->load('creador:idUsuario,nombreCompleto,usuario,avatar_path');

            return response()->json([
                'message' => 'Foro creado exitosamente.',
                'foro' => $foro,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear foro: '.$e->getMessage());

            return response()->json(['error' => 'No se pudo crear el foro.'], 500);
        }
    }

    /**
     * Consultar detalle de un foro con sus estadísticas.
     */
    public function show($idForo)
    {
        if (! is_numeric($idForo)) {
            return response()->json(['message' => 'No se encontró el foro especificado.'], 404);
        }

        $foro = Foro::with('creador:idUsuario,nombreCompleto,usuario,avatar_path')
            ->withCount('preguntas')
            ->findOrFail($idForo);

        return response()->json($foro);
    }

    /**
     * Editar título/descripción de un foro (Creador, Admin, Moderador).
     */
    public function update(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        if (! $this->puedeModificar($request, $foro, 'idUsuarioCreador')) {
            return response()->json(['error' => 'No tienes permisos para modificar este foro.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:200',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $foro->update($request->only(['titulo', 'descripcion']));

        return response()->json([
            'message' => 'Foro actualizado exitosamente.',
            'foro' => $foro,
        ]);
    }

    /**
     * Eliminar un foro y desvincularlo de los temas (Creador, Admin, Moderador).
     */
    public function destroy(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        if (! $this->puedeModificar($request, $foro, 'idUsuarioCreador')) {
            return response()->json(['error' => 'No tienes permisos para eliminar este foro.'], 403);
        }

        DB::beginTransaction();
        try {
            ItemTema::where('itemable_type', Foro::class)
                ->where('itemable_id', $idForo)
                ->delete();

            $foro->delete();

            DB::commit();

            return response()->json(['message' => 'Foro eliminado exitosamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar foro: '.$e->getMessage());

            return response()->json(['error' => 'No se pudo eliminar el foro.'], 500);
        }
    }

    /**
     * Abrir o cerrar un foro (Cambiar estado abierto <-> cerrado).
     */
    public function toggleEstado(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        $hasRole = $request->user()->roles->pluck('rol')
            ->intersect(['Administrador', 'Moderador', 'Profesor'])
            ->isNotEmpty();

        $puedeGestionar = $this->puedeModificar($request, $foro, 'idUsuarioCreador') || $hasRole;

        if (! $puedeGestionar) {
            return response()->json(['error' => 'No tienes permisos para cambiar el estado de este foro.'], 403);
        }

        $nuevoEstado = $foro->estado === 'abierto' ? 'cerrado' : 'abierto';
        $foro->update(['estado' => $nuevoEstado]);

        if ($nuevoEstado === 'cerrado') {
            try {
                $preguntaIds = Pregunta::where('idForo', $foro->idForo)->pluck('idPregunta');
                $autoresPregunta = Pregunta::where('idForo', $foro->idForo)->pluck('idUsuarioCreador');
                $autoresRespuesta = Respuesta::whereIn('idPregunta', $preguntaIds)->pluck('idUsuario');

                $participantes = $autoresPregunta->merge($autoresRespuesta)
                    ->push($foro->idUsuarioCreador)
                    ->unique()
                    ->values();

                foreach ($participantes as $idUsuario) {
                    Notificacion::crear(
                        $idUsuario,
                        Notificacion::TIPO_FORO_CERRADO,
                        "Foro cerrado: \"{$foro->titulo}\"",
                        "El foro \"{$foro->titulo}\" ha sido cerrado. Ya no se pueden publicar nuevas preguntas.",
                        ['idForo' => $foro->idForo]
                    );
                }
            } catch (\Exception $e) {
                Log::warning('Error al notificar cierre de foro: '.$e->getMessage());
            }
        }

        return response()->json([
            'message' => "Foro {$nuevoEstado} exitosamente.",
            'foro' => $foro,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // PREGUNTAS (Q&A)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Listar preguntas de un foro.
     */
    public function indexPreguntas($idForo)
    {
        if (! is_numeric($idForo)) {
            return response()->json([]);
        }

        Foro::findOrFail($idForo);

        $preguntas = Pregunta::where('idForo', $idForo)
            ->where('estado', '!=', 'oculta')
            ->with(['creador:idUsuario,nombreCompleto,usuario,avatar_path', 'creador.roles:idRol,rol'])
            ->withCount('respuestas')
            ->orderByDesc('fijada')
            ->orderByDesc('created_at')
            ->get();

        foreach ($preguntas as $pregunta) {
            $pregunta->tiene_respuesta_validada = Respuesta::where('idPregunta', $pregunta->idPregunta)
                ->where('validada', true)
                ->exists();
        }

        return response()->json($preguntas);
    }

    /**
     * Publicar una nueva pregunta en el foro (Cualquier usuario autenticado).
     */
    public function storePregunta(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        if ($foro->estado === 'cerrado') {
            return response()->json(['error' => 'Este foro está cerrado. No se permiten nuevas preguntas.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:250',
            'descripcion' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pregunta = Pregunta::create([
            'idForo' => $idForo,
            'idUsuarioCreador' => $request->user()->idUsuario,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'estado' => 'abierta',
            'fijada' => false,
            'vistas' => 0,
        ]);

        $pregunta->load('creador:idUsuario,nombreCompleto,usuario,avatar_path');

        return response()->json([
            'message' => 'Pregunta publicada exitosamente.',
            'pregunta' => $pregunta,
            'idPregunta' => $pregunta->idPregunta,
        ], 201);
    }

    /**
     * Ver hilo completo de una pregunta con sus respuestas e incrementa vistas.
     */
    public function showPregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::with([
            'creador:idUsuario,nombreCompleto,usuario,avatar_path',
            'respuestas' => function ($q) {
                $q->where('oculta', false)
                    ->with('usuario:idUsuario,nombreCompleto,usuario,avatar_path', 'usuario.roles:idRol,rol')
                    ->orderByDesc('validada')
                    ->orderByDesc('created_at');
            },
        ])->findOrFail($idPregunta);

        $pregunta->incrementarVistas();

        $userId = $request->user()->idUsuario;
        foreach ($pregunta->respuestas as $respuesta) {
            $votos = $respuesta->votos;
            $respuesta->likes_count = $votos->where('valor', VotoRespuesta::LIKE)->count();
            $respuesta->dislikes_count = $votos->where('valor', VotoRespuesta::DISLIKE)->count();
            $votoPropio = $votos->firstWhere('idUsuario', $userId);

            $miVotoStr = null;
            if ($votoPropio) {
                $miVotoStr = ($votoPropio->valor === VotoRespuesta::LIKE) ? 'like' : 'dislike';
            }
            $respuesta->mi_voto = $miVotoStr;

            unset($respuesta->votos);
        }

        return response()->json($pregunta);
    }

    /**
     * Editar título o descripción de una pregunta (Autor, Admin, Moderador).
     */
    public function updatePregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        if (! $this->puedeModificar($request, $pregunta, 'idUsuarioCreador')) {
            return response()->json(['error' => 'No tienes permisos para editar esta pregunta.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:250',
            'descripcion' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pregunta->fill($request->only(['titulo', 'descripcion']));
        $pregunta->editado = true;
        $pregunta->save();

        return response()->json([
            'message' => 'Pregunta actualizada exitosamente.',
            'pregunta' => $pregunta,
        ]);
    }

    /**
     * Eliminar una pregunta (Autor, Admin, Moderador).
     */
    public function destroyPregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        if (! $this->puedeModificar($request, $pregunta, 'idUsuarioCreador')) {
            return response()->json(['error' => 'No tienes permisos para eliminar esta pregunta.'], 403);
        }

        $pregunta->delete();

        return response()->json(['message' => 'Pregunta eliminada exitosamente.']);
    }

    /**
     * Fijar/Desfijar pregunta (Admin, Moderador, Profesor).
     */
    public function toggleFijar(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        $hasRole = $request->user()->roles->pluck('rol')
            ->intersect(['Administrador', 'Moderador', 'Profesor'])
            ->isNotEmpty();

        if (! $hasRole) {
            return response()->json(['error' => 'Solo profesores o administradores pueden fijar preguntas.'], 403);
        }

        $pregunta->update(['fijada' => ! $pregunta->fijada]);

        return response()->json([
            'message' => $pregunta->fijada ? 'Pregunta fijada al inicio del foro.' : 'Pregunta desmarcada.',
            'fijada' => $pregunta->fijada,
        ]);
    }

    /**
     * Cambiar estado de la pregunta (abierta <-> resuelta).
     */
    public function toggleEstadoPregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        $hasRole = $request->user()->roles->pluck('rol')
            ->intersect(['Administrador', 'Moderador', 'Profesor'])
            ->isNotEmpty();

        if (! $hasRole) {
            return response()->json(['error' => 'No autorizado para cambiar el estado de la pregunta.'], 403);
        }

        $nuevoEstado = $pregunta->estado === 'resuelta' ? 'abierta' : 'resuelta';
        $pregunta->update(['estado' => $nuevoEstado]);

        return response()->json([
            'message' => "Estado de la pregunta cambiado a {$nuevoEstado}.",
            'estado' => $nuevoEstado,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // RESPUESTAS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Responder a una pregunta.
     */
    public function storeRespuesta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        if ($pregunta->foro->estado === 'cerrado') {
            return response()->json(['error' => 'El foro correspondiente está cerrado.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'contenido' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        $respuesta = Respuesta::create([
            'idPregunta' => $idPregunta,
            'idUsuario' => $user->idUsuario,
            'contenido' => $request->contenido,
            'validada' => false,
        ]);

        $respuesta->load('usuario:idUsuario,nombreCompleto,usuario,avatar_path', 'usuario.roles:idRol,rol');

        // Notificar al autor de la pregunta si no es él mismo quien respondió
        if ($pregunta->idUsuarioCreador !== $user->idUsuario) {
            $itemTema = DB::table('items_tema')
                ->where('itemable_type', Foro::class)
                ->where('itemable_id', $pregunta->idForo)
                ->first();

            $idCurso = null;
            if ($itemTema) {
                $tema = Tema::find($itemTema->idTema);
                $idCurso = $tema ? $tema->idCurso : null;
            }

            Notificacion::crear(
                $pregunta->idUsuarioCreador,
                Notificacion::TIPO_NUEVA_RESPUESTA,
                "Nueva respuesta a tu pregunta: \"{$pregunta->titulo}\"",
                "{$user->nombreCompleto} ha respondido a tu consulta.",
                [
                    'idCurso' => $idCurso,
                    'idForo' => $pregunta->idForo,
                    'idPregunta' => $pregunta->idPregunta,
                    'idRespuesta' => $respuesta->idRespuesta,
                ]
            );
        }

        return response()->json([
            'message' => 'Respuesta publicada exitosamente.',
            'respuesta' => $respuesta,
            'idRespuesta' => $respuesta->idRespuesta,
        ], 201);
    }

    /**
     * Editar contenido de una respuesta (Autor, Admin, Moderador).
     */
    public function updateRespuesta(Request $request, $idRespuesta)
    {
        $respuesta = Respuesta::findOrFail($idRespuesta);

        if (! $this->puedeModificar($request, $respuesta, 'idUsuario')) {
            return response()->json(['error' => 'No tienes permisos para editar esta respuesta.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'contenido' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $respuesta->update([
            'contenido' => $request->contenido,
            'editado' => true,
        ]);

        return response()->json([
            'message' => 'Respuesta actualizada exitosamente.',
            'respuesta' => $respuesta,
        ]);
    }

    /**
     * Eliminar una respuesta (Autor, Admin, Moderador).
     */
    public function destroyRespuesta(Request $request, $idRespuesta)
    {
        $respuesta = Respuesta::findOrFail($idRespuesta);

        if (! $this->puedeModificar($request, $respuesta, 'idUsuario')) {
            return response()->json(['error' => 'No tienes permisos para eliminar esta respuesta.'], 403);
        }

        $respuesta->delete();

        return response()->json(['message' => 'Respuesta eliminada exitosamente.']);
    }

    /**
     * Marcar/Desmarcar respuesta como Solución Oficial Validada (Admin, Profesor, Ayudante).
     */
    public function toggleValidarRespuesta(Request $request, $idRespuesta)
    {
        $respuesta = Respuesta::with('pregunta')->findOrFail($idRespuesta);

        $hasRole = $request->user()->roles->pluck('rol')
            ->intersect(['Administrador', 'Moderador', 'Profesor', 'Ayudante'])
            ->isNotEmpty();

        if (! $hasRole) {
            return response()->json(['error' => 'Solo personal docente o ayudantes pueden validar soluciones.'], 403);
        }

        $nuevoEstado = ! $respuesta->validada;
        $respuesta->update(['validada' => $nuevoEstado]);

        if ($nuevoEstado) {
            $respuesta->pregunta->update(['estado' => 'resuelta']);

            if ($respuesta->idUsuario !== $request->user()->idUsuario) {
                Notificacion::crear(
                    $respuesta->idUsuario,
                    Notificacion::TIPO_RESPUESTA_VALIDADA,
                    '¡Tu respuesta fue marcada como Solución Oficial! ⭐',
                    "Un docente o ayudante validó tu aporte en \"{$respuesta->pregunta->titulo}\".",
                    [
                        'idForo' => $respuesta->pregunta->idForo,
                        'idPregunta' => $respuesta->idPregunta,
                        'idRespuesta' => $respuesta->idRespuesta,
                    ]
                );
            }
        }

        return response()->json([
            'message' => $nuevoEstado ? 'Respuesta marcada como Solución Oficial.' : 'Validación removida.',
            'validada' => $nuevoEstado,
            'respuesta' => $respuesta,
        ]);
    }

    /**
     * Votar positivo (like) o negativo (dislike) en una respuesta.
     */
    public function votar(Request $request, $idRespuesta)
    {
        $respuesta = Respuesta::findOrFail($idRespuesta);
        $userId = $request->user()->idUsuario;

        if ($respuesta->idUsuario === $userId) {
            return response()->json(['error' => 'No puedes votar en tu propia respuesta.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'tipo' => 'required|in:like,dislike',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $valorNuevo = $request->tipo === 'like' ? VotoRespuesta::LIKE : VotoRespuesta::DISLIKE;
        $votoExistente = VotoRespuesta::where('idRespuesta', $idRespuesta)
            ->where('idUsuario', $userId)
            ->first();

        if ($votoExistente) {
            if ($votoExistente->valor === $valorNuevo) {
                $votoExistente->delete();
                $accion = 'removido';
            } else {
                $votoExistente->update(['valor' => $valorNuevo]);
                $accion = 'actualizado';
            }
        } else {
            VotoRespuesta::create([
                'idRespuesta' => $idRespuesta,
                'idUsuario' => $userId,
                'valor' => $valorNuevo,
            ]);
            $accion = 'registrado';
        }

        $likes = VotoRespuesta::where('idRespuesta', $idRespuesta)->where('valor', VotoRespuesta::LIKE)->count();
        $dislikes = VotoRespuesta::where('idRespuesta', $idRespuesta)->where('valor', VotoRespuesta::DISLIKE)->count();
        $miVotoRaw = VotoRespuesta::where('idRespuesta', $idRespuesta)->where('idUsuario', $userId)->value('valor');

        $miVoto = null;
        if ($miVotoRaw !== null) {
            $miVoto = ($miVotoRaw === VotoRespuesta::LIKE) ? 'like' : 'dislike';
        }

        return response()->json([
            'message' => "Voto {$accion}.",
            'likes_count' => $likes,
            'dislikes_count' => $dislikes,
            'mi_voto' => $miVoto,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // REPORTES
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Reportar una pregunta por contenido inapropiado.
     */
    public function reportarPregunta(Request $request, $idPregunta)
    {
        Pregunta::findOrFail($idPregunta);

        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::table('reportes')->insert([
            'motivo' => $request->motivo,
            'descripcion' => $request->descripcion,
            'idUsuarioReportador' => $request->user()->idUsuario,
            'tipoPublicacion' => 'pregunta',
            'idPublicacionReportada' => $idPregunta,
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Reporte enviado. Nuestro equipo lo revisará pronto.'], 201);
    }

    /**
     * Reportar una respuesta por contenido inapropiado.
     */
    public function reportarRespuesta(Request $request, $idRespuesta)
    {
        Respuesta::findOrFail($idRespuesta);

        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::table('reportes')->insert([
            'motivo' => $request->motivo,
            'descripcion' => $request->descripcion,
            'idUsuarioReportador' => $request->user()->idUsuario,
            'tipoPublicacion' => 'respuesta',
            'idPublicacionReportada' => $idRespuesta,
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Reporte enviado. Nuestro equipo lo revisará pronto.'], 201);
    }
}
