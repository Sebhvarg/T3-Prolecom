<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Tema;

class TemaController extends Controller
{
    /**
     * Listar temas de un curso
     */
    public function index(Request $request)
    {
        $request->validate(['idCurso' => 'required|exists:cursos,idCurso']);
        
        $temas = Tema::where('idCurso', $request->idCurso)
            ->with('materiales')
            ->get();

        return response()->json($temas);
    }

    /**
     * Crear un tema (Solo Profesores)
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'idCurso' => 'required|exists:cursos,idCurso'
        ]);

        $tema = Tema::create($request->all());

        return response()->json($tema, 201);
    }
}
