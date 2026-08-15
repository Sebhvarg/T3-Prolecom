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

  const confirmAndDelete = useCallback(
    async ({ title, message, deleteAction, successMessage, errorMessage }) => {
      const doDelete = async () => {
        await executeAsyncAction({
          action: deleteAction,
          setError,
          setSuccess,
          successMessage,
          errorMessage,
          onSuccess: fetchCurso,
        });
      };

      if (setConfirmState) {
        setConfirmState({
          isOpen: true,
          title,
          message,
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
    },
    [setConfirmState, setError, setSuccess, fetchCurso]
  );

  const handleDeleteTema = useCallback(
    (idTema) =>
      confirmAndDelete({
        title: 'Eliminar Tema',
        message: '¿Estás seguro de eliminar este tema y todo su contenido?',
        deleteAction: () => cursosService.deleteTema(idTema),
        successMessage: 'Tema eliminado exitosamente.',
        errorMessage: 'Error al eliminar el tema.',
      }),
    [confirmAndDelete]
  );

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

  const handleDeleteMaterial = useCallback(
    (item) => {
      const idMaterial =
        typeof item === 'object'
          ? item?.idMaterial || item?.itemable_id || item?.itemable?.idMaterial || item?.resource?.idMaterial
          : item;
      if (!idMaterial) {
        setError('ID de material no encontrado para eliminar.');
        return;
      }
      confirmAndDelete({
        title: 'Eliminar Material',
        message: '¿Estás seguro de que deseas eliminar este material de estudio?',
        deleteAction: () => cursosService.deleteMaterial(idMaterial),
        successMessage: 'Material eliminado exitosamente.',
        errorMessage: 'Error al eliminar el material.',
      });
    },
    [confirmAndDelete, setError]
  );

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

  const handleDeleteDesafio = useCallback(
    (idDesafio) =>
      confirmAndDelete({
        title: 'Eliminar Desafío',
        message: '¿Estás seguro de eliminar este desafío práctico?',
        deleteAction: () => desafiosService.deleteDesafio(idDesafio),
        successMessage: 'Desafío eliminado exitosamente.',
        errorMessage: 'Error al eliminar el desafío.',
      }),
    [confirmAndDelete]
  );

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

  const handleDeleteForo = useCallback(
    (idForo) =>
      confirmAndDelete({
        title: 'Eliminar Foro',
        message: '¿Estás seguro de eliminar este foro de discusión?',
        deleteAction: () => foroService.deleteForo(idForo),
        successMessage: 'Foro eliminado exitosamente.',
        errorMessage: 'Error al eliminar el foro.',
      }),
    [confirmAndDelete]
  );

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

