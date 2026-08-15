import { useState } from 'react';
import { authService } from '../api/authService';
import { storage } from '../utils/crypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const resolveIdMaterial = (item) =>
  item?.idMaterial || item?.itemable_id || item?.itemable?.idMaterial || item?.resource?.idMaterial;

const fetchAuthToken = () =>
  authService.getToken() || storage.get('token') || storage.get('auth_token');

export const useSecureViewer = () => {
  const [activeViewerMaterial, setActiveViewerMaterial] = useState(null);
  const [viewerBlobUrl, setViewerBlobUrl] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');

  const handleOpenSecureViewer = async (item) => {
    const idMaterial = resolveIdMaterial(item);
    if (!idMaterial) {
      setViewerError('ID de material no encontrado.');
      return;
    }
    setActiveViewerMaterial(item.itemable || item.resource || item);
    setViewerLoading(true);
    setViewerError('');
    setViewerBlobUrl('');

    try {
      const token = fetchAuthToken();
      const response = await fetch(`${API_URL}/materiales/${idMaterial}/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json, */*' },
      });
      if (!response.ok) throw new Error('No se pudo cargar el recurso protegido.');
      const blob = await response.blob();
      setViewerBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setViewerError(err.message || 'Error al visualizar el archivo.');
    } finally {
      setViewerLoading(false);
    }
  };

  const handleCloseSecureViewer = () => {
    if (viewerBlobUrl) URL.revokeObjectURL(viewerBlobUrl);
    setActiveViewerMaterial(null);
    setViewerBlobUrl('');
    setViewerError('');
  };

  const handleDownloadMaterial = async (item) => {
    const idMaterial = resolveIdMaterial(item);
    if (!idMaterial) {
      alert('ID de material no encontrado.');
      return;
    }
    try {
      const token = fetchAuthToken();
      const response = await fetch(`${API_URL}/materiales/${idMaterial}/download`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json, */*' },
      });
      if (!response.ok) throw new Error('Error al descargar el archivo.');
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = item.titulo || item.nombre_archivo_original || item.nombre || 'material';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert('No se pudo descargar el material.');
    }
  };

  return {
    activeViewerMaterial,
    viewerBlobUrl,
    viewerLoading,
    viewerError,
    handleOpenSecureViewer,
    handleCloseSecureViewer,
    handleDownloadMaterial,
  };
};
