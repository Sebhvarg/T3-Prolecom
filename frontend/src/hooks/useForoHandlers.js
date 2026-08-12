import { useCallback } from 'react';
import { foroService } from '../api/foroService';

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
}) => {
  const handleCreatePregunta = useCallback(async (preguntaData) => {
    setSubmittingPregunta(true);
    try {
      await foroService.createPregunta(idForo, preguntaData);
      setIsModalNuevaOpen(false);
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al publicar la pregunta.');
    } finally {
      setSubmittingPregunta(false);
    }
  }, [idForo, fetchForoData, setIsModalNuevaOpen, setSubmittingPregunta]);

  const handleEditPreguntaSubmit = useCallback(async (idPregunta, data) => {
    setSubmittingEditPregunta(true);
    try {
      await foroService.updatePregunta(idPregunta, data);
      setEditingPregunta(null);
      fetchForoData();
      if (selectedPreguntaId === idPregunta) {
        loadPreguntaDetalle(idPregunta);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al actualizar la pregunta.');
    } finally {
      setSubmittingEditPregunta(false);
    }
  }, [fetchForoData, selectedPreguntaId, loadPreguntaDetalle, setEditingPregunta, setSubmittingEditPregunta]);

  const handleDeletePregunta = useCallback(async (idPregunta) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta pregunta y todas sus respuestas?')) return;
    try {
      await foroService.deletePregunta(idPregunta);
      if (selectedPreguntaId === idPregunta) {
        setSelectedPreguntaId(null);
        setPreguntaDetalle(null);
      }
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al eliminar la pregunta.');
    }
  }, [fetchForoData, selectedPreguntaId, setSelectedPreguntaId, setPreguntaDetalle]);

  const handleTogglePin = useCallback(async (idPregunta) => {
    try {
      await foroService.toggleFijarPregunta(idPregunta);
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al cambiar el estado fijado.');
    }
  }, [fetchForoData]);

  const handleToggleEstadoForo = useCallback(async () => {
    try {
      await foroService.toggleEstadoForo(idForo);
      fetchForoData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al cambiar el estado del foro.');
    }
  }, [idForo, fetchForoData]);

  const handleEditRespuestaSubmit = useCallback(async (idRespuesta, data) => {
    setSubmittingEditRespuesta(true);
    try {
      await foroService.updateRespuesta(idRespuesta, data);
      setEditingRespuesta(null);
      if (selectedPreguntaId) {
        loadPreguntaDetalle(selectedPreguntaId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al editar la respuesta.');
    } finally {
      setSubmittingEditRespuesta(false);
    }
  }, [selectedPreguntaId, loadPreguntaDetalle, setEditingRespuesta, setSubmittingEditRespuesta]);

  const handleDeleteRespuesta = useCallback(async (idRespuesta) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta respuesta?')) return;
    try {
      await foroService.deleteRespuesta(idRespuesta);
      if (selectedPreguntaId) {
        loadPreguntaDetalle(selectedPreguntaId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al eliminar la respuesta.');
    }
  }, [selectedPreguntaId, loadPreguntaDetalle]);

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
