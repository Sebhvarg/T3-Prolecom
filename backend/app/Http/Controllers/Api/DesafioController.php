<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Desafio;
use App\Models\Curso;
use App\Models\Tema;
use App\Models\Solucion;
use App\Models\LenguajeProgramacion;
use App\Jobs\ProcesarIntentoDesafio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DesafioController extends Controller
{
    /**
     * Listar desafíos asociados a un tema del curso
     */
    public function indexByTema(Request $request, $idTema)
    {
        Tema::findOrFail($idTema);
        $user = $request->user();

        // Obtener los desafíos a través de items_tema
        $items = DB::table('items_tema')
            ->where('idTema', $idTema)
            ->where('itemable_type', Desafio::class)
            ->pluck('itemable_id');

        $query = Desafio::whereIn('idDesafio', $items)->with('creador');

        // Si es un Estudiante, solo ver desafíos publicados
        $isStaff = $user->roles->pluck('rol')->intersect(['Administrador', 'Profesor', 'Ayudante'])->isNotEmpty();
        if (!$isStaff) {
            $query->where('estado', 'publicado');
        }

        $desafios = $query->get();

        // Ocultar casos de prueba ocultos para estudiantes
        if (!$isStaff) {
            foreach ($desafios as $desafio) {
                $testCases = $desafio->testCases ?? [];
                $testCases = array_values(array_filter($testCases, function ($tc) {
                    return !($tc['is_hidden'] ?? false);
                }));
                $desafio->testCases = $testCases;
            }
        }

        return response()->json($desafios);
    }

    /**
     * Mostrar un desafío en particular (filtra los casos ocultos para estudiantes)
     */
    public function show(Request $request, $id)
    {
        $desafio = Desafio::with('creador', 'curso')->findOrFail($id);
        $user = $request->user();

        $isStaff = $user->roles->pluck('rol')->intersect(['Administrador', 'Profesor', 'Ayudante'])->isNotEmpty();

        // Filtrar casos ocultos si el usuario es estudiante
        $testCases = $desafio->testCases ?? [];
        if (!$isStaff) {
            $testCases = array_values(array_filter($testCases, function ($tc) {
                return !($tc['is_hidden'] ?? false);
            }));
        }
        $desafio->testCases = $testCases;

        // Adjuntar si ya está aprobado por el usuario autenticado
        $resuelto = Solucion::where('idEstudiante', $user->idUsuario)
            ->where('idDesafio', $desafio->idDesafio)
            ->where('estado', 'aprobado')
            ->exists();
        $desafio->resuelto = $resuelto;

        return response()->json($desafio);
    }

    /**
     * Crear un desafío (Profesor o Ayudante)
     */
    public function store(Request $request, $idTema)
    {
        $request->validate([
            'titulo' => 'required|string|max:150',
            'descripcionProblema' => 'required|string',
            'dificultad' => 'required|in:Easy,Medium,Hard',
            'testCases' => 'required|array',
            'testCases.*.input' => 'nullable|string',
            'testCases.*.expected_output' => 'required|string',
            'testCases.*.is_hidden' => 'required|boolean',
            'puntos' => 'integer|min:1',
            'starter_code' => 'nullable|string',
        ]);

        $tema = Tema::findOrFail($idTema);
        $user = $request->user();

        $isProfessor = $user->roles->pluck('rol')->contains('Profesor');
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');

        DB::beginTransaction();
        try {
            // Crear el desafío
            $desafio = Desafio::create([
                'titulo' => $request->titulo,
                'descripcionProblema' => $request->descripcionProblema,
                'dificultad' => $request->dificultad,
                'testCases' => $request->testCases,
                'salidaEsperada' => 'OK', // Valor por defecto requerido en la migración original
                'estado' => ($isProfessor || $isAdmin) ? 'publicado' : 'pendiente',
                'idCreador' => $user->idUsuario,
                'idCurso' => $tema->idCurso,
                'puntos' => $request->puntos ?? 10,
                'starter_code' => $request->starter_code,
            ]);

            // Crear el ítem de tema (Composite)
            DB::table('items_tema')->insert([
                'idTema' => $idTema,
                'itemable_type' => Desafio::class,
                'itemable_id' => $desafio->idDesafio,
                'orden' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => ($isProfessor || $isAdmin) ? 'Desafío creado y publicado exitosamente.' : 'Desafío enviado a revisión del profesor.',
                'desafio' => $desafio
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error al crear desafío: " . $e->getMessage());
            return response()->json(['message' => 'Error al crear el desafío en la base de datos.'], 500);
        }
    }

    /**
     * Enviar solución (Estudiante)
     */
    public function enviarSolucion(Request $request, $idDesafio)
    {
        $request->validate([
            'codigoFuente' => 'required|string',
            'idLenguaje' => 'required|exists:lenguajes_programacion,idLenguaje',
        ]);

        $user = $request->user();
        Desafio::findOrFail($idDesafio);

        // Crear registro en la tabla de soluciones
        $solucion = Solucion::create([
            'codigoFuente' => $request->codigoFuente,
            'estado' => 'pendiente', // Por defecto pendiente de evaluación por Judge0
            'idEstudiante' => $user->idUsuario,
            'idDesafio' => $idDesafio,
            'idLenguaje' => $request->idLenguaje,
            'casos_pasados' => 0,
            'casos_totales' => 0,
            'puntos_otorgados' => 0,
        ]);

        // Encolar evaluación
        ProcesarIntentoDesafio::dispatch($solucion);

        return response()->json([
            'message' => 'Solución recibida. Evaluando código...',
            'solucion' => $solucion
        ], 201);
    }

    /**
     * Listar intentos previos de un estudiante para un desafío
     */
    public function listarIntentos(Request $request, $idDesafio)
    {
        $user = $request->user();
        $intentos = Solucion::where('idDesafio', $idDesafio)
            ->where('idEstudiante', $user->idUsuario)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($intentos);
    }

    /**
     * Modificar reto (Profesor / TA)
     */
    public function update(Request $request, $id)
    {
        $desafio = Desafio::findOrFail($id);
        $user = $request->user();

        // Solo profesores creadores o admins pueden modificar el reto
        $isStaff = $user->roles->pluck('rol')->intersect(['Administrador', 'Profesor', 'Ayudante'])->isNotEmpty();
        if (!$isStaff) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $validated = $request->validate([
            'titulo' => 'string|max:150',
            'descripcionProblema' => 'string',
            'dificultad' => 'in:Easy,Medium,Hard',
            'testCases' => 'array',
            'testCases.*.input' => 'nullable|string',
            'testCases.*.expected_output' => 'required|string',
            'testCases.*.is_hidden' => 'required|boolean',
            'puntos' => 'integer|min:1',
            'starter_code' => 'nullable|string',
            'estado' => 'in:pendiente,publicado',
        ]);

        $desafio->update($validated);

        return response()->json([
            'message' => 'Desafío actualizado con éxito.',
            'desafio' => $desafio
        ]);
    }

    /**
     * Eliminar reto (Profesor)
     */
    public function destroy(Request $request, $id)
    {
        $desafio = Desafio::findOrFail($id);
        $user = $request->user();

        $isProfessor = $user->roles->pluck('rol')->contains('Profesor');
        $isAdmin = $user->roles->pluck('rol')->contains('Administrador');

        if (!$isProfessor && !$isAdmin) {
            return response()->json(['message' => 'Acceso denegado. Solo profesores pueden eliminar retos.'], 403);
        }

        DB::beginTransaction();
        try {
            // Eliminar de items_tema
            DB::table('items_tema')
                ->where('itemable_type', Desafio::class)
                ->where('itemable_id', $desafio->idDesafio)
                ->delete();

            // Eliminar el desafío
            $desafio->delete();

            DB::commit();
            return response()->json(['message' => 'Desafío eliminado correctamente.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al eliminar el desafío.'], 500);
        }
    }
}
