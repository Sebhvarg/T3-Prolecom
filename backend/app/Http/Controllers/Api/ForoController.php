<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pregunta;
use App\Models\Respuesta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ForoController extends Controller
{
    public function index(Request $request)
    {
        $preguntas = Pregunta::with(['creador:idUsuario,usuario', 'curso:idCurso,titulo'])
            ->withCount('respuestas')
            ->when($request->idCurso, function ($query, $idCurso) {
                return $query->where('idCurso', $idCurso);
            })
            ->where('estado', '!=', 'oculta')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($preguntas);
    }

    public function show($id)
    {
        $pregunta = Pregunta::with(['creador', 'curso', 'respuestas.usuario'])
            ->findOrFail($id);

        return response()->json($pregunta);
    }

    public function storePregunta(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|max:200',
            'descripcion' => 'required',
            'idCurso' => 'required|exists:cursos,idCurso'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $pregunta = Pregunta::create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'idUsuarioCreador' => $request->user()->idUsuario,
            'idCurso' => $request->idCurso,
            'estado' => 'abierta'
        ]);

        return response()->json($pregunta, 201);
    }

    public function storeRespuesta(Request $request, $idPregunta)
    {
        $validator = Validator::make($request->all(), [
            'contenido' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $pregunta = Pregunta::findOrFail($idPregunta);

        $respuesta = Respuesta::create([
            'contenido' => $request->contenido,
            'idUsuario' => $request->user()->idUsuario,
            'idPregunta' => $idPregunta
        ]);

        return response()->json($respuesta, 201);
    }
}
