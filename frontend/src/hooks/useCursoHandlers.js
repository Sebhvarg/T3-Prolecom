import { useCallback } from 'react';
import { cursosService } from '../api/cursosService';
import { desafiosService } from '../api/desafiosService';
import { validateMaterialFile } from '../utils/validateMaterialFile';
import { executeAsyncAction } from '../utils/asyncHandler';

export const useCursoHandlers = ({
  id,
  temaEditId,
  temaNombre,
  temaDescripcion,
  materialFile,
  materialTipo,
  materialNombre,
  activeTemaId,
  desafioTitulo,
  desafioDescripcion,
  desafioDificultad,
  desafioLenguaje,
  desafioPlantillaCodigo,
  desafioTestCases,
  setSubmitting,
  setError,
  setSuccess,
  setIsTemaModalOpen,
  setTemaEditId,
  setTemaNombre,
  setTemaDescripcion,
  setActiveTemaId,
  setMaterialNombre,
  setMaterialTipo,
  setMaterialFile,
  setIsMaterialModalOpen,
  setIsDesafioModalOpen,
  setDesafioTitulo,
  setDesafioDescripcion,
  setDesafioDificultad,
  setDesafioLenguaje,
  setDesafioPlantillaCodigo,
  setDesafioTestCases,
  generateTestCaseId,
  fetchCurso,
}) => {
  const handleOpenTemaModal = useCallback((tema = null) => {
    setTemaEditId(tema?.idTema || null);
    setTemaNombre(tema?.nombre || '');
    setTemaDescripcion(tema?.descripcion || '');
    setIsTemaModalOpen(true);
  }, [setTemaEditId, setTemaNombre, setTemaDescripcion, setIsTemaModalOpen]);

  const handleSaveTema = useCallback(async (e) => {
    e.preventDefault();
    await executeAsyncAction({
      action: () => temaEditId
        ? cursosService.updateTema(temaEditId, { nombre: temaNombre, descripcion: temaDescripcion })
        : cursosService.createTema(id, { nombre: temaNombre, descripcion: temaDescripcion }),
      setLoading: setSubmitting,
      setError,
      setSuccess,
      successMessage: temaEditId ? 'Tema actualizado exitosamente.' : 'Tema creado exitosamente.',
      errorMessage: 'Error al guardar el tema.',
      onSuccess: () => {
        setIsTemaModalOpen(false);
        fetchCurso();
      },
    });
  }, [id, temaEditId, temaNombre, temaDescripcion, setSubmitting, setError, setSuccess, setIsTemaModalOpen, fetchCurso]);

  const handleDeleteTema = useCallback(async (idTema) => {
    if (!window.confirm('¿Estás seguro de eliminar este tema y todo su contenido?')) return;
    await executeAsyncAction({
      action: () => cursosService.deleteTema(idTema),
      setError,
      setSuccess,
      successMessage: 'Tema eliminado exitosamente.',
      errorMessage: 'Error al eliminar el tema.',
      onSuccess: fetchCurso,
    });
  }, [setSuccess, setError, fetchCurso]);

  const handleOpenMaterialModal = useCallback((idTema) => {
    setActiveTemaId(idTema);
    setMaterialNombre('');
    setMaterialTipo('documento');
    setMaterialFile(null);
    setIsMaterialModalOpen(true);
  }, [setActiveTemaId, setMaterialNombre, setMaterialTipo, setMaterialFile, setIsMaterialModalOpen]);

  const handleSaveMaterial = useCallback(async (e) => {
    e.preventDefault();
    const valErr = validateMaterialFile(materialFile, materialTipo);
    if (valErr) { setError(valErr); return; }

    const backendTipo = materialTipo === 'video' ? 'video' : 'PDF';
    const formData = new FormData();
    formData.append('titulo', materialNombre);
    formData.append('nombre', materialNombre);
    formData.append('tipo', backendTipo);
    formData.append('archivo', materialFile);

    await executeAsyncAction({
      action: () => (cursosService.createMaterial || cursosService.uploadMaterial)(activeTemaId, formData),
      setLoading: setSubmitting,
      setError,
      setSuccess,
      successMessage: 'Material cargado exitosamente.',
      errorMessage: 'Error al subir el material.',
      onSuccess: () => {
        setIsMaterialModalOpen(false);
        fetchCurso();
      },
    });
  }, [materialFile, materialTipo, materialNombre, activeTemaId, setSubmitting, setError, setSuccess, setIsMaterialModalOpen, fetchCurso]);

  const handleDeleteMaterial = useCallback(async (item) => {
    const idMaterial = typeof item === 'object'
      ? (item?.idMaterial || item?.itemable_id || item?.itemable?.idMaterial || item?.resource?.idMaterial)
      : item;
    if (!idMaterial) { setError('ID de material no encontrado para eliminar.'); return; }
    if (!window.confirm('¿Deseas eliminar este material?')) return;
    await executeAsyncAction({
      action: () => cursosService.deleteMaterial(idMaterial),
      setError,
      setSuccess,
      successMessage: 'Material eliminado exitosamente.',
      errorMessage: 'Error al eliminar el material.',
      onSuccess: fetchCurso,
    });
  }, [setError, setSuccess, fetchCurso]);

  const handleOpenDesafioModal = useCallback((idTema) => {
    setActiveTemaId(idTema);
    setDesafioTitulo('');
    setDesafioDescripcion('');
    setDesafioDificultad('Facil');
    setDesafioLenguaje('python');
    setDesafioPlantillaCodigo('# Escribe tu solución aquí\ndef solucion():\n    pass\n');
    setDesafioTestCases([{ id: generateTestCaseId(), input: '', expected_output: '', is_public: true }]);
    setIsDesafioModalOpen(true);
  }, [setActiveTemaId, setDesafioTitulo, setDesafioDescripcion, setDesafioDificultad, setDesafioLenguaje, setDesafioPlantillaCodigo, setDesafioTestCases, setIsDesafioModalOpen, generateTestCaseId]);

  const handleSaveDesafio = useCallback(async (e) => {
    e.preventDefault();
    const payload = {
      titulo: desafioTitulo,
      descripcion: desafioDescripcion,
      dificultad: desafioDificultad,
      lenguaje_permitido: desafioLenguaje,
      plantilla_codigo: desafioPlantillaCodigo,
      test_cases: desafioTestCases.map(tc => ({
        input: tc.input,
        expected_output: tc.expected_output,
        is_public: Boolean(tc.is_public),
      })),
    };
    await executeAsyncAction({
      action: () => desafiosService.createDesafio(activeTemaId, payload),
      setLoading: setSubmitting,
      setError,
      setSuccess,
      successMessage: 'Desafío práctico creado exitosamente.',
      errorMessage: 'Error al crear el desafío.',
      onSuccess: () => {
        setIsDesafioModalOpen(false);
        fetchCurso();
      },
    });
  }, [desafioTitulo, desafioDescripcion, desafioDificultad, desafioLenguaje, desafioPlantillaCodigo, desafioTestCases, activeTemaId, setSubmitting, setError, setSuccess, setIsDesafioModalOpen, fetchCurso]);

  const handleDeleteDesafio = useCallback(async (idDesafio) => {
    if (!window.confirm('¿Estás seguro de eliminar este desafío?')) return;
    await executeAsyncAction({
      action: () => desafiosService.deleteDesafio(idDesafio),
      setError,
      setSuccess,
      successMessage: 'Desafío eliminado exitosamente.',
      errorMessage: 'Error al eliminar el desafío.',
      onSuccess: fetchCurso,
    });
  }, [setSuccess, setError, fetchCurso]);

  return {
    handleOpenTemaModal,
    handleSaveTema,
    handleDeleteTema,
    handleOpenMaterialModal,
    handleSaveMaterial,
    handleDeleteMaterial,
    handleOpenDesafioModal,
    handleSaveDesafio,
    handleDeleteDesafio,
  };
};
