import { useState, useCallback } from 'react';
import { moderacionService } from '../api/moderacionService';
import { executeAsyncAction } from '../utils/asyncHandler';

export const useModeracionActions = ({
  filtroEstado,
  filtroTipo,
  setStats,
  setReportes,
  setAuditorias,
  setLoading,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [banModal, setBanModal] = useState({ isOpen: false, user: null });

  const fetchModeracionData = useCallback(async () => {
    await executeAsyncAction({
      action: async () => {
        const [statsData, reportesData, auditoriaData] = await Promise.all([
          moderacionService.getStats(),
          moderacionService.getReportes({ estado: filtroEstado, tipo: filtroTipo }),
          moderacionService.getAuditoria(),
        ]);
        setStats(statsData);
        setReportes(reportesData);
        setAuditorias(auditoriaData || []);
      },
      setLoading,
      setError,
      errorMessage: 'Error al cargar la información de moderación.',
    });
  }, [filtroEstado, filtroTipo, setStats, setReportes, setAuditorias, setLoading]);

  const handleResolver = useCallback(async (idReporte) => {
    await executeAsyncAction({
      action: () => moderacionService.resolverReporte(idReporte),
      setLoading: setActionLoading,
      setError,
      setSuccess,
      successMessage: 'Reporte marcado como resuelto exitosamente.',
      errorMessage: 'No se pudo resolver el reporte.',
      onSuccess: fetchModeracionData,
    });
  }, [fetchModeracionData]);

  const handleOcultar = useCallback(async (idReporte) => {
    await executeAsyncAction({
      action: () => moderacionService.ocultarPublicacion(idReporte),
      setLoading: setActionLoading,
      setError,
      setSuccess,
      successMessage: (res) => res.message || 'Estado de publicación actualizado.',
      errorMessage: 'No se pudo modificar la visibilidad de la publicación.',
      onSuccess: fetchModeracionData,
    });
  }, [fetchModeracionData]);

  const handleUnban = useCallback(async (idUsuario) => {
    await executeAsyncAction({
      action: () => moderacionService.banearUsuario(idUsuario, 1),
      setLoading: setActionLoading,
      setError,
      setSuccess,
      successMessage: (res) => res.message || 'Usuario reactivado exitosamente.',
      errorMessage: 'Error al reactivar cuenta del usuario.',
      onSuccess: fetchModeracionData,
    });
  }, [fetchModeracionData]);

  const handleBanearConfirm = useCallback(async (banModalUser) => {
    if (!banModalUser) return;
    await executeAsyncAction({
      action: () => moderacionService.banearUsuario(banModalUser.idUsuario, 4),
      setLoading: setActionLoading,
      setError,
      setSuccess,
      successMessage: (res) => res.message || 'Usuario sancionado exitosamente.',
      errorMessage: 'Error al aplicar sanción al usuario.',
      onSuccess: () => {
        setBanModal({ isOpen: false, user: null });
        fetchModeracionData();
      },
    });
  }, [fetchModeracionData]);

  return {
    actionLoading,
    error,
    setError,
    success,
    setSuccess,
    banModal,
    setBanModal,
    fetchModeracionData,
    handleResolver,
    handleOcultar,
    handleUnban,
    handleBanearConfirm,
  };
};
