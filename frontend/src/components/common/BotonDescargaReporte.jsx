import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { authService } from '../../api/authService';

const BotonDescargaReporte = ({ tipoReporte, label = 'Exportar Reporte (CSV)', variant = 'secondary' }) => {
  const [loading, setLoading] = useState(false);

  const handleDescarga = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const url = `${apiBase}/reportes/${tipoReporte}?export=csv`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el reporte desde la base de datos');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseStyles = "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-50",
    emerald: "bg-emerald-700 text-white hover:bg-emerald-800",
  };

  return (
    <button
      type="button"
      onClick={handleDescarga}
      disabled={loading}
      className={`${baseStyles} ${variants[variant] || variants.secondary} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-current" />
      ) : (
        <FileSpreadsheet size={14} className="text-current" />
      )}
      <span>{loading ? 'Generando...' : label}</span>
    </button>
  );
};

export default BotonDescargaReporte;
