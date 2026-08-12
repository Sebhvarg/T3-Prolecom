import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flag, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { foroService } from '../../api/foroService';
import Modal from '../ui/Modal';

const MOTIVOS_REPORTE = [
  'Contenido ofensivo o inapropiado',
  'Información falsa o engañosa',
  'Spam o contenido comercial',
  'Lenguaje no académico',
  'Plagio o copia no atribuida',
  'Otro motivo',
];

const ReporteModal = ({ isOpen, onClose, targetId, targetType }) => {
  const [motivo, setMotivo] = useState(MOTIVOS_REPORTE[0]);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (targetType === 'pregunta') {
        await foroService.reportarPregunta(targetId, { motivo, descripcion });
      } else {
        await foroService.reportarRespuesta(targetId, { motivo, descripcion });
      }

      setEnviado(true);
      setTimeout(() => {
        setEnviado(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al enviar reporte:', err);
      setErrorMsg(err.message || 'Error al enviar el reporte. Por favor reintenta.');
    } finally {
      setLoading(false);
    }
  };

  const titleText = `Reportar ${targetType === 'pregunta' ? 'Pregunta' : 'Respuesta'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText} icon={Flag} maxWidth="max-w-md">
      {enviado ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-lg font-black text-slate-900">Reporte Enviado</h3>
          <p className="text-xs text-slate-500 font-medium">Gracias por ayudar a mantener un ambiente académico sano.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="reporte-motivo" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Motivo principal <span className="text-red-500">*</span>
            </label>
            <select
              id="reporte-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2c5364] bg-white text-slate-800"
            >
              {MOTIVOS_REPORTE.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reporte-descripcion" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Detalles adicionales (Opcional)
            </label>
            <textarea
              id="reporte-descripcion"
              rows={3}
              placeholder="Explica brevemente por qué consideras inadecuado este contenido..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#2c5364] resize-none leading-relaxed text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>Enviar Reporte</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

ReporteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  targetId: PropTypes.number.isRequired,
  targetType: PropTypes.oneOf(['pregunta', 'respuesta']).isRequired,
};

export default ReporteModal;
