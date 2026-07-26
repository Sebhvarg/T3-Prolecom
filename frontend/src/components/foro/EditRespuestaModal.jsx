import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Loader2, Edit3 } from 'lucide-react';

const EditRespuestaModal = ({ isOpen, onClose, onSubmit, respuesta, submitting }) => {
  const [contenido, setContenido] = useState('');

  useEffect(() => {
    if (respuesta) {
      setContenido(respuesta.contenido || '');
    }
  }, [respuesta]);

  if (!isOpen || !respuesta) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    onSubmit(respuesta.idRespuesta, { contenido });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Editar Respuesta</h3>
              <p className="text-xs text-gray-500">Actualiza el contenido de tu respuesta.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-resp-contenido" className="block text-sm font-bold text-gray-700 mb-1.5">
              Contenido de la respuesta <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-resp-contenido"
              required
              rows={5}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm font-mono resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !contenido.trim()}
              className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>Guardar Respuesta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditRespuestaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  respuesta: PropTypes.object,
  submitting: PropTypes.bool,
};

export default EditRespuestaModal;
