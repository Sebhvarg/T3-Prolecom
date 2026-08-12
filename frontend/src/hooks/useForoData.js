import { useState, useEffect, useCallback } from 'react';
import { foroService } from '../api/foroService';

export const useForoData = ({ resolveTargetForoId, initialPreguntaId }) => {
  const [foro, setForo] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPreguntaId, setSelectedPreguntaId] = useState(
    initialPreguntaId ? Number(initialPreguntaId) : null
  );
  const [preguntaDetalle, setPreguntaDetalle] = useState(null);

  const loadPreguntaDetalle = useCallback(async (idPregunta) => {
    setSelectedPreguntaId(idPregunta);
    try {
      const data = await foroService.getPreguntaDetalle(idPregunta);
      setPreguntaDetalle(data);
    } catch (err) {
      console.error(err);
      alert('Error al cargar el detalle de la pregunta.');
    }
  }, []);

  const fetchForoData = useCallback(async () => {
    const targetForoId = resolveTargetForoId();
    if (!targetForoId) {
      setLoading(false);
      setError('');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [foroData, preguntasData] = await Promise.all([
        foroService.getForo(targetForoId),
        foroService.getPreguntasForo(targetForoId),
      ]);
      setForo(foroData);
      setPreguntas(preguntasData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar los datos del foro.');
    } finally {
      setLoading(false);
    }
  }, [resolveTargetForoId]);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await fetchForoData();
      if (initialPreguntaId && !ignore) {
        await loadPreguntaDetalle(Number(initialPreguntaId));
      }
    };
    init();
    return () => { ignore = true; };
  }, [fetchForoData, initialPreguntaId, loadPreguntaDetalle]);

  return {
    foro,
    preguntas,
    loading,
    error,
    selectedPreguntaId,
    setSelectedPreguntaId,
    preguntaDetalle,
    setPreguntaDetalle,
    loadPreguntaDetalle,
    fetchForoData,
  };
};
