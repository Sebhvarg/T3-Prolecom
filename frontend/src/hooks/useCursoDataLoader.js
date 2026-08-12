import { useState, useEffect, useCallback } from 'react';
import { cursosService } from '../api/cursosService';
import { sortCursoTemasEItems } from '../utils/sortCursoTemas';

export const useCursoDataLoader = (id) => {
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTemas, setExpandedTemas] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  const fetchCurso = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let isMounted = true;

    const loadCursoData = async () => {
      setLoading(true);
      try {
        const data = await cursosService.getCurso(id);
        if (!isMounted) return;

        sortCursoTemasEItems(data.temas);

        setCurso(data);

        const expandMap = {};
        data.temas?.forEach((t) => {
          expandMap[t.idTema] = true;
        });
        setExpandedTemas(expandMap);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('No se pudo cargar la información del curso.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCursoData();

    return () => {
      isMounted = false;
    };
  }, [id, reloadKey]);

  const toggleTema = useCallback((idTema) => {
    setExpandedTemas((prev) => ({
      ...prev,
      [idTema]: !prev[idTema],
    }));
  }, []);

  return {
    curso,
    loading,
    error,
    setError,
    expandedTemas,
    setExpandedTemas,
    fetchCurso,
    toggleTema,
  };
};
