import { useCallback } from 'react';
import { cursosService } from '../api/cursosService';
import { desafiosService } from '../api/desafiosService';
import { validateMaterialFile } from '../utils/validateMaterialFile';

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
    if (tema) {
      setTemaEditId(tema.idTema);
      setTemaNombre(tema.nombre);
      setTemaDescripcion(tema.descripcion || '');
    } else {
      setTemaEditId(null);
      setTemaNombre('');
      setTemaDescripcion('');
    }
    setIsTemaModalOpen(true);
  }, [setTemaEditId, setTemaNombre, setTemaDescripcion, setIsTemaModalOpen]);

  const handleSaveTema = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (temaEditId) {
        await cursosService.updateTema(temaEditId, { nombre: temaNombre, descripcion: temaDescripcion });
        setSuccess('Tema actualizado exitosamente.');
      } else {
        await cursosService.createTema(id, { nombre: temaNombre, descripcion: temaDescripcion });
        setSuccess('Tema creado exitosamente.');
      }
      setIsTemaModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el tema.');
    } finally {
      setSubmitting(false);
    }
  }, [id, temaEditId, temaNombre, temaDescripcion, setSubmitting, setError, setSuccess, setIsTemaModalOpen, fetchCurso]);

  const handleDeleteTema = useCallback(async (idTema) => {
    if (!window.confirm('¿Estás seguro de eliminar este tema y todo su contenido?')) return;
    try {
      await cursosService.deleteTema(idTema);
      setSuccess('Tema eliminado exitosamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el tema.');
    }
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

    setSubmitting(true);
    setError('');
    const backendTipo = materialTipo === 'video' ? 'video' : 'PDF';
    const formData = new FormData();
    formData.append('titulo', materialNombre);
    formData.append('nombre', materialNombre);
    formData.append('tipo', backendTipo);
    formData.append('archivo', materialFile);

    try {
      await (cursosService.createMaterial || cursosService.uploadMaterial)(activeTemaId, formData);
      setSuccess('Material cargado exitosamente.');
      setIsMaterialModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : null;
      setError(backendErr || err.response?.data?.message || 'Error al subir el material.');
    } finally {
      setSubmitting(false);
    }
  }, [materialFile, materialTipo, materialNombre, activeTemaId, setSubmitting, setError, setSuccess, setIsMaterialModalOpen, fetchCurso]);

  const handleDeleteMaterial = useCallback(async (item) => {
    const idMaterial = typeof item === 'object'
      ? (item?.idMaterial || item?.itemable_id || item?.itemable?.idMaterial || item?.resource?.idMaterial)
      : item;
    if (!idMaterial) { setError('ID de material no encontrado para eliminar.'); return; }
    if (!window.confirm('¿Deseas eliminar este material?')) return;
    try {
      await cursosService.deleteMaterial(idMaterial);
      setSuccess('Material eliminado exitosamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el material.');
    }
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
    setSubmitting(true);
    setError('');
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
    try {
      await desafiosService.createDesafio(activeTemaId, payload);
      setSuccess('Desafío práctico creado exitosamente.');
      setIsDesafioModalOpen(false);
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al crear el desafío.');
    } finally {
      setSubmitting(false);
    }
  }, [desafioTitulo, desafioDescripcion, desafioDificultad, desafioLenguaje, desafioPlantillaCodigo, desafioTestCases, activeTemaId, setSubmitting, setError, setSuccess, setIsDesafioModalOpen, fetchCurso]);

  const handleDeleteDesafio = useCallback(async (idDesafio) => {
    if (!window.confirm('¿Estás seguro de eliminar este desafío?')) return;
    try {
      await desafiosService.deleteDesafio(idDesafio);
      setSuccess('Desafío eliminado exitosamente.');
      fetchCurso();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el desafío.');
    }
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
