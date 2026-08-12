import { useState, useCallback } from 'react';
import { moderacionService } from '../api/moderacionService';

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
    setLoading(true);
    setError('');
    try {
      const [statsData, reportesData, auditoriaData] = await Promise.all([
        moderacionService.getStats(),
        moderacionService.getReportes({ estado: filtroEstado, tipo: filtroTipo }),
        moderacionService.getAuditoria(),
      ]);
      setStats(statsData);
      setReportes(reportesData);
      setAuditorias(auditoriaData || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información de moderación.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo, setStats, setReportes, setAuditorias, setLoading]);

  const handleResolver = useCallback(async (idReporte) => {
    setActionLoading(true);
    try {
      await moderacionService.resolverReporte(idReporte);
      setSuccess('Reporte marcado como resuelto exitosamente.');
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('No se pudo resolver el reporte.');
    } finally {
      setActionLoading(false);
    }
  }, [fetchModeracionData]);

  const handleOcultar = useCallback(async (idReporte) => {
    setActionLoading(true);
    try {
      const res = await moderacionService.ocultarPublicacion(idReporte);
      setSuccess(res.message || 'Estado de publicación actualizado.');
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('No se pudo modificar la visibilidad de la publicación.');
    } finally {
      setActionLoading(false);
    }
  }, [fetchModeracionData]);

  const handleUnban = useCallback(async (idUsuario) => {
    setActionLoading(true);
    try {
      const res = await moderacionService.banearUsuario(idUsuario, 1);
      setSuccess(res.message || 'Usuario reactivado exitosamente.');
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('Error al reactivar cuenta del usuario.');
    } finally {
      setActionLoading(false);
    }
  }, [fetchModeracionData]);

  const handleBanearConfirm = useCallback(async (banModalUser) => {
    if (!banModalUser) return;
    setActionLoading(true);
    try {
      const res = await moderacionService.banearUsuario(banModalUser.idUsuario, 4);
      setSuccess(res.message || 'Usuario sancionado exitosamente.');
      setBanModal({ isOpen: false, user: null });
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('Error al aplicar sanción al usuario.');
    } finally {
      setActionLoading(false);
    }
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
