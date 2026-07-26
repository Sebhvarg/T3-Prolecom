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

    /**
     * Verifica si el usuario tiene alguno de los roles indicados.
     */
    private function tieneRol(Request $request, array $roles): bool
    {
        return $request->user()->roles->pluck('rol')->intersect($roles)->isNotEmpty();
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
        $tema = Tema::findOrFail($idTema);

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

            // Registrar como itemable en items_tema (mismo patrón que Desafio y MaterialAprendizaje)
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

            return response()->json(['message' => 'Error al crear el foro.'], 500);
        }
    }

    /**
     * Obtener los datos de un foro.
     */
    public function show($idForo)
    {
        $foro = Foro::with('creador:idUsuario,nombreCompleto,usuario,avatar_path')
            ->findOrFail($idForo);

        return response()->json($foro);
    }

    /**
     * Editar un foro (creador, Admin o Moderador).
     */
    public function update(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        if (! $this->puedeModificar($request, $foro, 'idUsuarioCreador')) {
            return response()->json(['message' => 'No tenés permiso para editar este foro.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $foro->update([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
        ]);

        return response()->json(['message' => 'Foro actualizado.', 'foro' => $foro]);
    }

    /**
     * Eliminar un foro (creador, Admin o Moderador).
     * Cascade elimina preguntas, respuestas y votos asociados.
     */
    public function destroy(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        if (! $this->puedeModificar($request, $foro, 'idUsuarioCreador')) {
            return response()->json(['message' => 'No tenés permiso para eliminar este foro.'], 403);
        }

        DB::beginTransaction();
        try {
            // Eliminar el itemable asociado en items_tema
            ItemTema::where('itemable_type', Foro::class)
                ->where('itemable_id', $foro->idForo)
                ->delete();

            $foro->delete();
            DB::commit();

            return response()->json(['message' => 'Foro eliminado correctamente.']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar foro: '.$e->getMessage());

            return response()->json(['message' => 'Error al eliminar el foro.'], 500);
        }
    }

    /**
     * Cambiar el estado del foro: abierto ↔ cerrado (creador Profe/Admin/Moderador).
     */
    public function toggleEstado(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        $puedeGestionar = $this->puedeModificar($request, $foro, 'idUsuarioCreador')
                       || $this->tieneRol($request, ['Administrador', 'Moderador', 'Profesor']);

        if (! $puedeGestionar) {
            return response()->json(['message' => 'No tenés permiso para cambiar el estado de este foro.'], 403);
        }

        $nuevoEstado = $foro->estado === 'abierto' ? 'cerrado' : 'abierto';
        $foro->estado = $nuevoEstado;
        $foro->save();

        // Notificar a todos los participantes únicos del foro si se cierra
        if ($nuevoEstado === 'cerrado') {
            $this->notificarParticipantesForo($foro);
        }

        return response()->json([
            'message' => "Foro {$nuevoEstado} correctamente.",
            'foro' => $foro,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // CRUD PREGUNTAS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Listar preguntas de un foro.
     * Las fijadas (pinned) aparecen primero, luego por fecha descendente.
     */
    public function indexPreguntas(Request $request, $idForo)
    {
        Foro::findOrFail($idForo);

        $preguntas = Pregunta::where('idForo', $idForo)
            ->where('estado', '!=', 'oculta')                                // ocultas solo las ven Admin/Moderador
            ->with(['creador:idUsuario,nombreCompleto,usuario,avatar_path', 'creador.roles:idRol,rol'])
            ->withCount('respuestas')
            ->orderByDesc('fijada')
            ->orderByDesc('created_at')
            ->get();

        // Adjuntar si tiene respuesta validada (para el badge de la card)
        foreach ($preguntas as $pregunta) {
            $pregunta->tiene_respuesta_validada = Respuesta::where('idPregunta', $pregunta->idPregunta)
                ->where('validada', true)
                ->exists();
        }

        return response()->json($preguntas);
    }

    /**
     * Crear una pregunta en un foro (todos los roles autenticados, foro debe estar abierto).
     */
    public function storePregunta(Request $request, $idForo)
    {
        $foro = Foro::findOrFail($idForo);

        if (! $foro->estaAbierto()) {
            return response()->json(['message' => 'Este foro está cerrado. No se pueden publicar nuevas preguntas.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:200',
            'descripcion' => 'required|string',
        ], [
            'titulo.required' => 'El título de la pregunta es obligatorio.',
            'descripcion.required' => 'La descripción de la pregunta es obligatoria.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pregunta = Pregunta::create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'idUsuarioCreador' => $request->user()->idUsuario,
            'idForo' => $idForo,
            'estado' => 'abierta',
        ]);

        $pregunta->load(['creador:idUsuario,nombreCompleto,usuario,avatar_path', 'creador.roles:idRol,rol']);
        $pregunta->respuestas_count = 0;
        $pregunta->tiene_respuesta_validada = false;

        return response()->json($pregunta, 201);
    }

    /**
     * Detalle de una pregunta con sus respuestas, votos y datos del autor.
     * Incrementa el contador de vistas de forma atómica.
     */
    public function showPregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::with([
            'creador:idUsuario,nombreCompleto,usuario,avatar_path',
            'creador.roles:idRol,rol',
            'foro:idForo,titulo,estado',
            'respuestas.usuario:idUsuario,nombreCompleto,usuario,avatar_path',
            'respuestas.usuario.roles:idRol,rol',
            'respuestas.votos',
        ])->findOrFail($idPregunta);

        // Incrementar vistas de forma atómica (evita race conditions)
        $pregunta->incrementarVistas();

        // Adjuntar conteo de votos y voto propio del usuario autenticado en cada respuesta
        $userId = $request->user()->idUsuario;
        foreach ($pregunta->respuestas as $respuesta) {
            $votos = $respuesta->votos;
            $respuesta->likes_count = $votos->where('valor', VotoRespuesta::LIKE)->count();
            $respuesta->dislikes_count = $votos->where('valor', VotoRespuesta::DISLIKE)->count();
            $votoPropio = $votos->firstWhere('idUsuario', $userId);
            $respuesta->mi_voto = $votoPropio ? ($votoPropio->valor === VotoRespuesta::LIKE ? 'like' : 'dislike') : null;
            unset($respuesta->votos);    // Limpiar la colección cruda antes de devolver
        }

        return response()->json($pregunta);
    }

    /**
     * Editar una pregunta (autor, Admin o Moderador).
     */
    public function updatePregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        if (! $this->puedeModificar($request, $pregunta, 'idUsuarioCreador')) {
            return response()->json(['message' => 'No tenés permiso para editar esta pregunta.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:200',
            'descripcion' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pregunta->update([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'editado' => true,
        ]);

        return response()->json(['message' => 'Pregunta actualizada.', 'pregunta' => $pregunta]);
    }

    /**
     * Eliminar una pregunta (autor, Admin o Moderador).
     * Cascade elimina respuestas y votos asociados.
     */
    public function destroyPregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        if (! $this->puedeModificar($request, $pregunta, 'idUsuarioCreador')) {
            return response()->json(['message' => 'No tenés permiso para eliminar esta pregunta.'], 403);
        }

        $pregunta->delete();

        return response()->json(['message' => 'Pregunta eliminada correctamente.']);
    }

    /**
     * Fijar / Desfijar una pregunta al tope del foro (Admin, Moderador, Profesor).
     */
    public function toggleFijar(Request $request, $idPregunta)
    {
        if (! $this->tieneRol($request, ['Administrador', 'Moderador', 'Profesor'])) {
            return response()->json(['message' => 'No tenés permiso para fijar preguntas.'], 403);
        }

        $pregunta = Pregunta::findOrFail($idPregunta);
        $pregunta->fijada = ! $pregunta->fijada;
        $pregunta->save();

        $accion = $pregunta->fijada ? 'fijada' : 'desfijada';

        return response()->json([
            'message' => "Pregunta {$accion} correctamente.",
            'pregunta' => $pregunta,
        ]);
    }

    /**
     * Cambiar estado de una pregunta: ocultar/mostrar (Admin, Moderador, Profesor).
     */
    public function toggleEstadoPregunta(Request $request, $idPregunta)
    {
        if (! $this->tieneRol($request, ['Administrador', 'Moderador', 'Profesor'])) {
            return response()->json(['message' => 'No tenés permiso para ocultar preguntas.'], 403);
        }

        $pregunta = Pregunta::findOrFail($idPregunta);
        $pregunta->estado = $pregunta->estado === 'oculta' ? 'abierta' : 'oculta';
        $pregunta->save();

        return response()->json([
            'message' => "Pregunta {$pregunta->estado} correctamente.",
            'pregunta' => $pregunta,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // CRUD RESPUESTAS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Publicar una respuesta a una pregunta.
     * Dispara notificación al autor de la pregunta.
     */
    public function storeRespuesta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::findOrFail($idPregunta);

        $validator = Validator::make($request->all(), [
            'contenido' => 'required|string',
        ], [
            'contenido.required' => 'El contenido de la respuesta es obligatorio.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $respuesta = Respuesta::create([
            'contenido' => $request->contenido,
            'idUsuario' => $request->user()->idUsuario,
            'idPregunta' => $idPregunta,
            'validada' => false,
        ]);

        $respuesta->load(['usuario:idUsuario,nombreCompleto,usuario,avatar_path', 'usuario.roles:idRol,rol']);
        $respuesta->likes_count = 0;
        $respuesta->dislikes_count = 0;
        $respuesta->mi_voto = null;

        // Notificar al autor de la pregunta (si no es el mismo que responde)
        $autorPregunta = $pregunta->idUsuarioCreador;
        if ($autorPregunta !== $request->user()->idUsuario) {
            $idCurso = $pregunta->foro?->itemTema?->tema?->idCurso;
            Notificacion::crear(
                $autorPregunta,
                Notificacion::TIPO_NUEVA_RESPUESTA,
                'Nueva respuesta en tu pregunta',
                "\"{$request->user()->nombreCompleto}\" respondió tu pregunta: \"{$pregunta->titulo}\"",
                [
                    'idPregunta' => $idPregunta,
                    'idForo' => $pregunta->idForo,
                    'idCurso' => $idCurso,
                ]
            );
        }

        return response()->json($respuesta, 201);
    }

    /**
     * Editar una respuesta (autor, Admin o Moderador).
     */
    public function updateRespuesta(Request $request, $idRespuesta)
    {
        $respuesta = Respuesta::findOrFail($idRespuesta);

        if (! $this->puedeModificar($request, $respuesta, 'idUsuario')) {
            return response()->json(['message' => 'No tenés permiso para editar esta respuesta.'], 403);
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

        return response()->json(['message' => 'Respuesta actualizada.', 'respuesta' => $respuesta]);
    }

    /**
     * Eliminar una respuesta (autor, Admin o Moderador).
     */
    public function destroyRespuesta(Request $request, $idRespuesta)
    {
        $respuesta = Respuesta::findOrFail($idRespuesta);

        if (! $this->puedeModificar($request, $respuesta, 'idUsuario')) {
            return response()->json(['message' => 'No tenés permiso para eliminar esta respuesta.'], 403);
        }

        // Si era la única respuesta validada, cambiar estado de la pregunta a abierta
        if ($respuesta->validada) {
            $pregunta = Pregunta::find($respuesta->idPregunta);
            if ($pregunta) {
                $hayOtraValidada = Respuesta::where('idPregunta', $pregunta->idPregunta)
                    ->where('idRespuesta', '!=', $idRespuesta)
                    ->where('validada', true)
                    ->exists();
                if (! $hayOtraValidada) {
                    $pregunta->estado = 'abierta';
                    $pregunta->save();
                }
            }
        }

        $respuesta->delete();

        return response()->json(['message' => 'Respuesta eliminada correctamente.']);
    }

    /**
     * Validar / Desvalidar una respuesta como Oficial.
     * Roles: Admin, Moderador, Profesor, Ayudante.
     * Dispara notificación al autor de la respuesta.
     */
    public function toggleValidarRespuesta(Request $request, $idRespuesta)
    {
        if (! $this->tieneRol($request, ['Administrador', 'Moderador', 'Profesor', 'Ayudante'])) {
            return response()->json([
                'message' => 'No tenés permisos para validar respuestas. Solo instructores y ayudantes pueden realizar esta acción.',
            ], 403);
        }

        $respuesta = Respuesta::findOrFail($idRespuesta);

        // Permitir forzar un valor booleano o hacer toggle
        $respuesta->validada = $request->has('validada')
            ? filter_var($request->input('validada'), FILTER_VALIDATE_BOOLEAN)
            : ! $respuesta->validada;

        $respuesta->save();

        // Actualizar estado de la pregunta asociada
        $pregunta = Pregunta::find($respuesta->idPregunta);
        if ($pregunta) {
            $tieneValidada = Respuesta::where('idPregunta', $pregunta->idPregunta)->where('validada', true)->exists();
            $pregunta->estado = $tieneValidada ? 'resuelta' : 'abierta';
            $pregunta->save();
        }

        // Notificar al autor de la respuesta si fue validada (no si fue desvalidada)
        if ($respuesta->validada && $respuesta->idUsuario !== $request->user()->idUsuario) {
            $idCurso = $pregunta?->foro?->itemTema?->tema?->idCurso;
            Notificacion::crear(
                $respuesta->idUsuario,
                Notificacion::TIPO_RESPUESTA_VALIDADA,
                '¡Tu respuesta fue marcada como Oficial! ✅',
                "Tu respuesta en la pregunta \"{$pregunta?->titulo}\" fue validada como Respuesta Oficial por {$request->user()->nombreCompleto}.",
                [
                    'idPregunta' => $respuesta->idPregunta,
                    'idRespuesta' => $idRespuesta,
                    'idForo' => $pregunta?->idForo,
                    'idCurso' => $idCurso,
                ]
            );
        }

        $respuesta->load(['usuario:idUsuario,nombreCompleto,usuario,avatar_path', 'usuario.roles:idRol,rol']);

        return response()->json([
            'message' => $respuesta->validada ? 'Respuesta validada como Oficial correctamente.' : 'Validación de respuesta removida.',
            'respuesta' => $respuesta,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // VOTOS (LIKES / DISLIKES)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Votar una respuesta (like o dislike).
     * Lógica de toggle:
     *   - Mismo tipo → elimina el voto
     *   - Tipo diferente → actualiza el voto
     *   - Sin voto previo → crea el voto
     * No se puede votar la propia respuesta.
     */
    public function votar(Request $request, $idRespuesta)
    {
        $respuesta = Respuesta::findOrFail($idRespuesta);
        $userId = $request->user()->idUsuario;

        // No se puede votar la propia respuesta
        if ($respuesta->idUsuario === $userId) {
            return response()->json(['message' => 'No podés votar tu propia respuesta.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'tipo' => 'required|in:like,dislike',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Convertir tipo string a valor int (1=like, -1=dislike)
        $valorNuevo = $request->tipo === 'like' ? VotoRespuesta::LIKE : VotoRespuesta::DISLIKE;

        $votoExistente = VotoRespuesta::where('idRespuesta', $idRespuesta)
            ->where('idUsuario', $userId)
            ->first();

        if ($votoExistente) {
            if ($votoExistente->valor === $valorNuevo) {
                // Toggle: mismo tipo → eliminar voto
                $votoExistente->delete();
                $accion = 'eliminado';
            } else {
                // Cambiar de like a dislike o viceversa
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

        // Devolver conteos actualizados
        $likes = VotoRespuesta::where('idRespuesta', $idRespuesta)->where('valor', VotoRespuesta::LIKE)->count();
        $dislikes = VotoRespuesta::where('idRespuesta', $idRespuesta)->where('valor', VotoRespuesta::DISLIKE)->count();
        $miVotoRaw = VotoRespuesta::where('idRespuesta', $idRespuesta)->where('idUsuario', $userId)->value('valor');
        $miVoto = $miVotoRaw === null ? null : ($miVotoRaw === VotoRespuesta::LIKE ? 'like' : 'dislike');

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

    // ─────────────────────────────────────────────────────────────────────
    // NOTIFICACIONES (HELPERS INTERNOS)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Notifica a todos los usuarios que participaron en el foro cuando este se cierra.
     */
    private function notificarParticipantesForo(Foro $foro): void
    {
        try {
            // Obtener IDs únicos de todos los que preguntaron o respondieron en el foro
            $preguntaIds = Pregunta::where('idForo', $foro->idForo)->pluck('idPregunta');

            $autoresPregunta = Pregunta::where('idForo', $foro->idForo)
                ->pluck('idUsuarioCreador');

            $autoresRespuesta = Respuesta::whereIn('idPregunta', $preguntaIds)
                ->pluck('idUsuario');

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
}
