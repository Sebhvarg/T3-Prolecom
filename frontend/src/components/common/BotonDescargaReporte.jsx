import { useState } from 'react';
import PropTypes from 'prop-types';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { downloadCsvReport } from '../../utils/downloadCsvReport';

const BotonDescargaReporte = ({ tipoReporte, label = 'Exportar Reporte (CSV)', variant = 'secondary' }) => {
  const [loading, setLoading] = useState(false);

  const handleDescarga = async () => {
    setLoading(true);
    try {
      await downloadCsvReport(tipoReporte);
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseStyles = 'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs';
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-50',
    emerald: 'bg-emerald-700 text-white hover:bg-emerald-800',
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
      <span>{label}</span>
    </button>
  );
};

BotonDescargaReporte.propTypes = {
  tipoReporte: PropTypes.string.isRequired,
  label: PropTypes.string,
  variant: PropTypes.string,
};

export default BotonDescargaReporte;
