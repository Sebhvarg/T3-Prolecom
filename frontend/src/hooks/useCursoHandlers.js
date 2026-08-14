import { useCallback } from 'react';
import { cursosService } from '../api/cursosService';
import { desafiosService } from '../api/desafiosService';
import { foroService } from '../api/foroService';
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
  foroEditId,
  foroTitulo,
  foroDescripcion,
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
  setIsForoModalOpen,
  setForoEditId,
  setForoTitulo,
  setForoDescripcion,
  setDesafioTitulo,
  setDesafioDescripcion,
  setDesafioDificultad,
  setDesafioLenguaje,
  setDesafioPlantillaCodigo,
  setDesafioTestCases,
  generateTestCaseId,
  fetchCurso,
  setConfirmState,
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
    const payload = { nombre: temaNombre, descripcion: temaDescripcion };
    await executeAsyncAction({
      action: () => (temaEditId ? cursosService.updateTema(temaEditId, payload) : cursosService.createTema(id, payload)),
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
    const doDelete = async () => {
      await executeAsyncAction({
        action: () => cursosService.deleteTema(idTema),
        setError,
        setSuccess,
        successMessage: 'Tema eliminado exitosamente.',
        errorMessage: 'Error al eliminar el tema.',
        onSuccess: fetchCurso,
      });
    };

    if (setConfirmState) {
      setConfirmState({
        isOpen: true,
        title: 'Eliminar Tema',
        message: '¿Estás seguro de eliminar este tema y todo su contenido?',
        variant: 'danger',
        confirmText: 'Sí, eliminar',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          await doDelete();
        },
      });
    } else {
      await doDelete();
    }
  }, [setConfirmState, setSuccess, setError, fetchCurso]);

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
    
    const doDelete = async () => {
      await executeAsyncAction({
        action: () => cursosService.deleteMaterial(idMaterial),
        setError,
        setSuccess,
        successMessage: 'Material eliminado exitosamente.',
        errorMessage: 'Error al eliminar el material.',
        onSuccess: fetchCurso,
      });
    };

    if (setConfirmState) {
      setConfirmState({
        isOpen: true,
        title: 'Eliminar Material',
        message: '¿Estás seguro de que deseas eliminar este material de estudio?',
        variant: 'danger',
        confirmText: 'Sí, eliminar',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          await doDelete();
        },
      });
    } else {
      await doDelete();
    }
  }, [setConfirmState, setError, setSuccess, fetchCurso]);

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
    const doDelete = async () => {
      await executeAsyncAction({
        action: () => desafiosService.deleteDesafio(idDesafio),
        setError,
        setSuccess,
        successMessage: 'Desafío eliminado exitosamente.',
        errorMessage: 'Error al eliminar el desafío.',
        onSuccess: fetchCurso,
      });
    };

    if (setConfirmState) {
      setConfirmState({
        isOpen: true,
        title: 'Eliminar Desafío',
        message: '¿Estás seguro de eliminar este desafío práctico?',
        variant: 'danger',
        confirmText: 'Sí, eliminar',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          await doDelete();
        },
      });
    } else {
      await doDelete();
    }
  }, [setConfirmState, setSuccess, setError, fetchCurso]);

  const handleOpenForoModal = useCallback((idTema = null, foro = null) => {
    setActiveTemaId(idTema);
    setForoEditId(foro?.idForo || null);
    setForoTitulo(foro?.titulo || '');
    setForoDescripcion(foro?.descripcion || '');
    setIsForoModalOpen(true);
  }, [setActiveTemaId, setForoEditId, setForoTitulo, setForoDescripcion, setIsForoModalOpen]);

  const handleSaveForo = useCallback(async (e) => {
    e.preventDefault();
    if (!foroTitulo) {
      setError('El título del foro es obligatorio.');
      return;
    }
    const payload = {
      titulo: foroTitulo,
      descripcion: foroDescripcion,
      idTema: activeTemaId,
      idCurso: id,
    };
    await executeAsyncAction({
      action: () => (foroEditId ? foroService.updateForo(foroEditId, payload) : foroService.createForo(activeTemaId, payload)),
      setLoading: setSubmitting,
      setError,
      setSuccess,
      successMessage: foroEditId ? 'Foro actualizado exitosamente.' : 'Foro creado exitosamente.',
      errorMessage: 'Error al guardar el foro.',
      onSuccess: () => {
        setIsForoModalOpen(false);
        fetchCurso();
      },
    });
  }, [foroTitulo, foroDescripcion, activeTemaId, id, foroEditId, setSubmitting, setError, setSuccess, setIsForoModalOpen, fetchCurso]);

  const handleDeleteForo = useCallback(async (idForo) => {
    const doDelete = async () => {
      await executeAsyncAction({
        action: () => foroService.deleteForo(idForo),
        setError,
        setSuccess,
        successMessage: 'Foro eliminado exitosamente.',
        errorMessage: 'Error al eliminar el foro.',
        onSuccess: fetchCurso,
      });
    };

    if (setConfirmState) {
      setConfirmState({
        isOpen: true,
        title: 'Eliminar Foro',
        message: '¿Estás seguro de eliminar este foro de discusión?',
        variant: 'danger',
        confirmText: 'Sí, eliminar',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          await doDelete();
        },
      });
    } else {
      await doDelete();
    }
  }, [setConfirmState, setError, setSuccess, fetchCurso]);

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
    handleOpenForoModal,
    handleSaveForo,
    handleDeleteForo,
  };
};

