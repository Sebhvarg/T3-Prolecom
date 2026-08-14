<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\ItemTema;
use App\Models\MaterialAprendizaje;
use App\Models\Notificacion;
use App\Models\Tema;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MaterialController extends Controller
{
    private const MSG_NO_TEMA = 'El material no está asociado a ningún tema';

    private const MSG_INVALID_ID = 'ID de material no válido';

    /**
     * @param Curso $curso
     * @param User $user
     * @return bool
     */
    private function checkPermission(Curso $curso, User $user): bool
    {
        $roles = $user->roles->pluck('rol');
        $isAdminOrTA = $roles->contains('Administrador') || $roles->contains('Ayudante');

        return $isAdminOrTA || $curso->idProfeCreador === $user->idUsuario;
    }

    /**
     * @param Curso $curso
     * @param User $user
     * @return bool
     */
    private function isAuthorizedToView(Curso $curso, User $user): bool
    {
        if ($this->checkPermission($curso, $user)) {
            return true;
        }

        return $curso->estudiantes()->where('usuarios.idUsuario', $user->idUsuario)->exists();
    }

    /**
     * @param int|string $id
     * @return array
     */
    private function resolveItemAndCurso($id): array
    {
        if (! is_numeric($id)) {
            abort(404, self::MSG_INVALID_ID);
        }

        $material = MaterialAprendizaje::find((int) $id);
        if (! $material) {
            abort(404, 'El material solicitado no existe.');
        }

        $itemTema = $material->itemTema;
        if (! $itemTema) {
            abort(404, self::MSG_NO_TEMA);
        }

        return [$material, $itemTema, $itemTema->tema->curso];
    }

    /**
     * @param Request $request
     * @param int|string $temaId
     * @return JsonResponse
     */
    public function store(Request $request, $temaId): JsonResponse
    {
        $tema = Tema::findOrFail($temaId);
        $curso = $tema->curso;
        $user = $request->user();

        if (! $this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para agregar materiales a este curso'], 403);
        }

        $allowedMimes = config('media.allowed_mimes', 'pdf,mp4,mov,avi,mkv,webm');
        $maxSize = config('media.max_size', 512000);

        $titulo = $request->titulo ?? $request->nombre;
        $tipoInput = strtolower((string) $request->tipo);
        $isVideo = in_array($tipoInput, ['video', 'mp4', 'mov', 'mkv', 'webm']);
        $tipo = $isVideo ? 'video' : 'PDF';
        $mimes = $isVideo ? 'mp4,mov,avi,mkv,webm' : 'pdf';

        $payload = array_merge($request->all(), [
            'titulo' => $titulo,
            'tipo' => $tipo,
        ]);

        $validator = Validator::make($payload, [
            'titulo' => 'required|string|max:150',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:PDF,video',
            'archivo' => "required|file|mimes:{$mimes}|max:{$maxSize}",
        ], [
            'archivo.mimes' => $isVideo
                ? 'El archivo de video debe tener un formato válido (MP4, MOV, AVI, MKV o WEBM).'
                : 'El documento debe estar strictly en formato PDF.',
            'archivo.max' => 'El tamaño máximo permitido para archivos de material es 500 MB.',
            'titulo.required' => 'El título del material es obligatorio.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $path = $request->file('archivo')->store('materials', 'local');

        $material = MaterialAprendizaje::create([
            'titulo' => strip_tags($titulo),
            'descripcion' => strip_tags($request->descripcion ?? ''),
            'tipo' => $tipo,
            'enlaceArchivo' => $path,
            'idUsuarioCreador' => $user->idUsuario,
        ]);

        $maxOrden = ItemTema::where('idTema', $tema->idTema)->max('orden') ?? 0;
        ItemTema::create([
            'idTema' => $tema->idTema,
            'itemable_type' => MaterialAprendizaje::class,
            'itemable_id' => $material->idMaterial,
            'orden' => $maxOrden + 1,
        ]);

        AuditLogService::log('subir_material', 'MaterialAprendizaje', $material->idMaterial, "Material: {$material->titulo}");

        Notificacion::notificarEstudiantesDelCurso(
            $curso->idCurso,
            'nuevo_material',
            'Nuevo Material Publicado',
            "El profesor publicó '{$material->titulo}' en {$tema->nombre}.",
            ['idMaterial' => $material->idMaterial]
        );

        return response()->json([
            'message' => 'Material subido con éxito',
            'material' => $material,
        ], 201);
    }

    /**
     * @param Request $request
     * @param int|string $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        [$material, , $curso] = $this->resolveItemAndCurso($id);
        $user = $request->user();

        if (! $this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para editar este material'], 403);
        }

        $titulo = $request->titulo ?? $request->nombre ?? $material->titulo;
        $tipoInput = strtolower((string) ($request->tipo ?? $material->tipo));
        $isVideo = in_array($tipoInput, ['video', 'mp4', 'mov', 'mkv', 'webm']);
        $tipo = $isVideo ? 'video' : 'PDF';

        $rules = [
            'titulo' => 'sometimes|required|string|max:150',
            'descripcion' => 'nullable|string',
            'tipo' => 'nullable|in:PDF,video,documento,presentacion,codigo',
        ];

        if ($request->hasFile('archivo')) {
            $maxSize = config('media.max_size', 512000);
            $mimes = $isVideo ? 'mp4,mov,avi,mkv,webm' : 'pdf';
            $rules['archivo'] = "file|mimes:{$mimes}|max:{$maxSize}";
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        if ($request->hasFile('archivo')) {
            if (Storage::disk('local')->exists($material->enlaceArchivo)) {
                Storage::disk('local')->delete($material->enlaceArchivo);
            }
            $path = $request->file('archivo')->store('materials', 'local');
            $material->enlaceArchivo = $path;
        }

        $material->titulo = $titulo;
        $material->descripcion = $request->descripcion ?? $material->descripcion;
        $material->tipo = $tipo;
        $material->save();

        AuditLogService::log('editar_material', 'MaterialAprendizaje', $material->idMaterial, "Material actualizado: {$material->titulo}");

        return response()->json([
            'message' => 'Material actualizado con éxito',
            'material' => $material,
        ]);
    }

    /**
     * @param Request $request
     * @param int|string $id
     * @return JsonResponse
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        [$material, $itemTema, $curso] = $this->resolveItemAndCurso($id);
        $user = $request->user();

        if (! $this->checkPermission($curso, $user)) {
            return response()->json(['message' => 'No tienes permisos para eliminar este material'], 403);
        }

        if (Storage::disk('local')->exists($material->enlaceArchivo)) {
            Storage::disk('local')->delete($material->enlaceArchivo);
        }

        $materialId = $material->idMaterial;
        $materialTitulo = $material->titulo;

        $itemTema->delete();
        $material->delete();

        AuditLogService::log('eliminar_material', 'MaterialAprendizaje', $materialId, "Material eliminado: {$materialTitulo}");

        return response()->json(['message' => 'Material eliminado con éxito']);
    }

    /**
     * @param Request $request
     * @param int|string $id
     * @return JsonResponse|BinaryFileResponse
     */
    public function stream(Request $request, $id)
    {
        [$material, , $curso] = $this->resolveItemAndCurso($id);
        $user = $request->user();

        if (! $this->isAuthorizedToView($curso, $user)) {
            return response()->json(['message' => 'No estás matriculado en este curso para ver este recurso'], 403);
        }

        if (! Storage::disk('local')->exists($material->enlaceArchivo)) {
            return response()->json(['message' => 'El archivo no existe o fue removido'], 404);
        }

        $absolutePath = Storage::disk('local')->path($material->enlaceArchivo);

        return response()->file($absolutePath);
    }

    /**
     * @param Request $request
     * @param int|string $id
     * @return JsonResponse|BinaryFileResponse
     */
    public function download(Request $request, $id)
    {
        [$material, , $curso] = $this->resolveItemAndCurso($id);
        $user = $request->user();

        if (! $this->isAuthorizedToView($curso, $user)) {
            return response()->json(['message' => 'No estás autorizado para descargar este archivo'], 403);
        }

        if (! Storage::disk('local')->exists($material->enlaceArchivo)) {
            return response()->json(['message' => 'El archivo solicitado no existe'], 404);
        }

        $ext = pathinfo($material->enlaceArchivo, PATHINFO_EXTENSION);
        $safeName = str_replace(['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'], '-', $material->titulo);
        $filename = $safeName.($ext ? '.'.$ext : '');

        $absolutePath = Storage::disk('local')->path($material->enlaceArchivo);

        return response()->download($absolutePath, $filename);
    }
}
