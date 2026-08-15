import { authService } from '../api/authService';

export const downloadCsvReport = async (tipoReporte) => {
  const token = authService.getToken();
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const url = `${apiBase}/reportes/${tipoReporte}?export=csv`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error('Error al generar el reporte desde la base de datos');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
