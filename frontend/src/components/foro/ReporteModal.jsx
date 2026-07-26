import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flag, X, Loader2, CheckCircle2 } from 'lucide-react';
import { foroService } from '../../api/foroService';

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      alert(err.message || 'Error al enviar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
        >
          <X size={18} />
        </button>

        {enviado ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Reporte Enviado</h3>
            <p className="text-sm text-gray-500">Gracias por ayudar a mantener la comunidad académica segura.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Flag size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Reportar {targetType === 'pregunta' ? 'Pregunta' : 'Respuesta'}
                </h3>
                <p className="text-xs text-gray-500">Notifica a los moderadores sobre contenido inapropiado.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reporte-motivo" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Motivo principal <span className="text-red-500">*</span>
                </label>
                <select
                  id="reporte-motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364] bg-white"
                >
                  {MOTIVOS_REPORTE.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reporte-descripcion" className="block text-sm font-bold text-gray-700 mb-1.5">
                  Detalles adicionales (Opcional)
                </label>
                <textarea
                  id="reporte-descripcion"
                  rows={3}
                  placeholder="Explica brevemente por qué consideras inadecuado este contenido..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5364] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-5 py-2 rounded-xl shadow-xs transition"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>Enviar Reporte</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

ReporteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  targetId: PropTypes.number.isRequired,
  targetType: PropTypes.oneOf(['pregunta', 'respuesta']).isRequired,
};

export default ReporteModal;
