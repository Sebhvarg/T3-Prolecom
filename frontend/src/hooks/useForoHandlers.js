import { useCallback } from 'react';
import { foroService } from '../api/foroService';
import { executeAsyncAction } from '../utils/asyncHandler';

export const useForoHandlers = ({
  idForo,
  selectedPreguntaId,
  setSelectedPreguntaId,
  setPreguntaDetalle,
  setEditingPregunta,
  setSubmittingPregunta,
  setSubmittingEditPregunta,
  setEditingRespuesta,
  setSubmittingEditRespuesta,
  loadPreguntaDetalle,
  fetchForoData,
  setIsModalNuevaOpen,
  setConfirmState,
}) => {
  const handleCreatePregunta = useCallback(async (preguntaData) => {
    await executeAsyncAction({
      action: () => foroService.createPregunta(idForo, preguntaData),
      setLoading: setSubmittingPregunta,
      errorMessage: 'Error al publicar la pregunta.',
      onSuccess: () => {
        setIsModalNuevaOpen(false);
        fetchForoData();
      },
    });
  }, [idForo, fetchForoData, setIsModalNuevaOpen, setSubmittingPregunta]);

  const handleEditPreguntaSubmit = useCallback(async (idPregunta, data) => {
    await executeAsyncAction({
      action: () => foroService.updatePregunta(idPregunta, data),
      setLoading: setSubmittingEditPregunta,
      errorMessage: 'Error al actualizar la pregunta.',
      onSuccess: () => {
        setEditingPregunta(null);
        fetchForoData();
        if (selectedPreguntaId === idPregunta) {
          loadPreguntaDetalle(idPregunta);
        }
      },
    });
  }, [fetchForoData, selectedPreguntaId, loadPreguntaDetalle, setEditingPregunta, setSubmittingEditPregunta]);

  const handleDeletePregunta = useCallback(async (idPregunta) => {
    const doDelete = async () => {
      await executeAsyncAction({
        action: () => foroService.deletePregunta(idPregunta),
        errorMessage: 'Error al eliminar la pregunta.',
        onSuccess: () => {
          if (selectedPreguntaId === idPregunta) {
            setSelectedPreguntaId(null);
            setPreguntaDetalle(null);
          }
          fetchForoData();
        },
      });
    };

    if (setConfirmState) {
      setConfirmState({
        isOpen: true,
        title: 'Eliminar Pregunta',
        message: '¿Estás seguro de que deseas eliminar esta pregunta y todas sus respuestas?',
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
  }, [setConfirmState, fetchForoData, selectedPreguntaId, setSelectedPreguntaId, setPreguntaDetalle]);

  const handleTogglePin = useCallback(async (idPregunta) => {
    await executeAsyncAction({
      action: () => foroService.toggleFijarPregunta(idPregunta),
      errorMessage: 'Error al cambiar el estado fijado.',
      onSuccess: fetchForoData,
    });
  }, [fetchForoData]);

  const handleToggleEstadoForo = useCallback(async () => {
    await executeAsyncAction({
      action: () => foroService.toggleEstadoForo(idForo),
      errorMessage: 'Error al cambiar el estado del foro.',
      onSuccess: fetchForoData,
    });
  }, [idForo, fetchForoData]);

  const handleEditRespuestaSubmit = useCallback(async (idRespuesta, data) => {
    await executeAsyncAction({
      action: () => foroService.updateRespuesta(idRespuesta, data),
      setLoading: setSubmittingEditRespuesta,
      errorMessage: 'Error al editar la respuesta.',
      onSuccess: () => {
        setEditingRespuesta(null);
        if (selectedPreguntaId) {
          loadPreguntaDetalle(selectedPreguntaId);
        }
      },
    });
  }, [selectedPreguntaId, loadPreguntaDetalle, setEditingRespuesta, setSubmittingEditRespuesta]);

  const handleDeleteRespuesta = useCallback(async (idRespuesta) => {
    const doDelete = async () => {
      await executeAsyncAction({
        action: () => foroService.deleteRespuesta(idRespuesta),
        errorMessage: 'Error al eliminar la respuesta.',
        onSuccess: () => {
          if (selectedPreguntaId) {
            loadPreguntaDetalle(selectedPreguntaId);
          }
        },
      });
    };

    if (setConfirmState) {
      setConfirmState({
        isOpen: true,
        title: 'Eliminar Respuesta',
        message: '¿Estás seguro de que deseas eliminar esta respuesta?',
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
  }, [setConfirmState, selectedPreguntaId, loadPreguntaDetalle]);

  return {
    handleCreatePregunta,
    handleEditPreguntaSubmit,
    handleDeletePregunta,
    handleTogglePin,
    handleToggleEstadoForo,
    handleEditRespuestaSubmit,
    handleDeleteRespuesta,
  };
};
