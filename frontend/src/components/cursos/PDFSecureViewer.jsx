import PropTypes from 'prop-types';
import { X, Loader2, AlertCircle } from 'lucide-react';

/**
 * PDFSecureViewer Component (TC-SP2-05)
 * Renders an in-browser secure PDF viewer using a blob URL stream without direct HTML download buttons.
 */
const PDFSecureViewer = ({
  material,
  blobUrl,
  loading,
  error,
  onClose,
}) => {
  if (!material) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h3 className="font-extrabold text-sm truncate">{material.nombre || material.titulo}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
            aria-label="Cerrar visor seguro"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 bg-slate-100 flex items-center justify-center relative">
          {loading && (
            <div className="space-y-3 text-center">
              <Loader2 size={36} className="animate-spin text-[#2c5364] mx-auto" />
              <p className="text-xs font-bold text-slate-700">Cargando visualización segura...</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center space-y-2">
              <AlertCircle size={32} className="mx-auto" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <iframe
              src={blobUrl}
              title={material.nombre || material.titulo}
              className="w-full h-full border-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};

PDFSecureViewer.propTypes = {
  material: PropTypes.object,
  blobUrl: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default PDFSecureViewer;
