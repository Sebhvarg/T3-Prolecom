<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\Pregunta;
use App\Models\Respuesta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ForoController extends Controller
{
    /**
     * Listar todas las preguntas de un curso.
     */
    public function indexPreguntas(Request $request, $idCurso)
    {
        Curso::findOrFail($idCurso);

        $preguntas = Pregunta::where('idCurso', $idCurso)
            ->with(['creador:idUsuario,nombreCompleto,usuario,avatar_path', 'creador.roles:idRol,rol'])
            ->withCount('respuestas')
            ->orderBy('created_at', 'desc')
            ->get();

        // Adjuntar si tiene respuesta validada por instructor/ayudante
        foreach ($preguntas as $pregunta) {
            $pregunta->tiene_respuesta_validada = Respuesta::where('idPregunta', $pregunta->idPregunta)
                ->where('validada', true)
                ->exists();
        }

        return response()->json($preguntas);
    }

    /**
     * Crear una nueva pregunta en un curso.
     */
    public function storePregunta(Request $request, $idCurso)
    {
        Curso::findOrFail($idCurso);

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
            'idCurso' => $idCurso,
            'estado' => 'abierta',
        ]);

        $pregunta->load(['creador:idUsuario,nombreCompleto,usuario,avatar_path', 'creador.roles:idRol,rol']);
        $pregunta->respuestas_count = 0;
        $pregunta->tiene_respuesta_validada = false;

        return response()->json($pregunta, 201);
    }

    /**
     * Obtener el detalle de una pregunta con sus respuestas.
     */
    public function showPregunta(Request $request, $idPregunta)
    {
        $pregunta = Pregunta::with([
            'creador:idUsuario,nombreCompleto,usuario,avatar_path',
            'creador.roles:idRol,rol',
            'curso:idCurso,titulo,lp',
            'respuestas.usuario:idUsuario,nombreCompleto,usuario,avatar_path',
            'respuestas.usuario.roles:idRol,rol',
        ])->findOrFail($idPregunta);

        return response()->json($pregunta);
    }

    /**
     * Publicar una respuesta a una pregunta.
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

        return response()->json($respuesta, 201);
    }

    /**
     * Validar / Desvalidar una respuesta (Instructor / Ayudante / Administrador RBAC).
     */
    public function toggleValidarRespuesta(Request $request, $idRespuesta)
    {
        $user = $request->user();

        // Verificación estricta de RBAC (Profesores, Ayudantes y Administradores)
        $userRoles = $user->roles->pluck('rol')->toArray();
        $authorizedRoles = ['Administrador', 'Profesor', 'Ayudante'];
        $isAuthorized = ! empty(array_intersect($authorizedRoles, $userRoles));

        if (! $isAuthorized) {
            return response()->json([
                'message' => 'No tienes permisos para validar respuestas. Solo instructores y ayudantes pueden realizar esta acción.',
            ], 403);
        }

        $respuesta = Respuesta::findOrFail($idRespuesta);

        // Si se envía un valor booleano explícito en el request, usarlo; de lo contrario toggle
        if ($request->has('validada')) {
            $respuesta->validada = filter_var($request->input('validada'), FILTER_VALIDATE_BOOLEAN);
        } else {
            $respuesta->validada = ! $respuesta->validada;
        }

        $respuesta->save();

        // Actualizar el estado de la pregunta asociada
        $pregunta = Pregunta::find($respuesta->idPregunta);
        if ($pregunta) {
            $hasValidatedAnswer = Respuesta::where('idPregunta', $pregunta->idPregunta)
                ->where('validada', true)
                ->exists();

            $pregunta->estado = $hasValidatedAnswer ? 'resuelta' : 'abierta';
            $pregunta->save();
        }

        $respuesta->load(['usuario:idUsuario,nombreCompleto,usuario,avatar_path', 'usuario.roles:idRol,rol']);

        return response()->json([
            'message' => $respuesta->validada ? 'Respuesta validada como Oficial correctamente.' : 'Validación de respuesta removida.',
            'respuesta' => $respuesta,
        ]);
    }
}
