import { useState } from 'react';
import PropTypes from 'prop-types';
import { Loader2, Edit3 } from 'lucide-react';
import Modal from '../ui/Modal';

const EditRespuestaModal = ({ isOpen, onClose, onSubmit, respuesta, submitting }) => {
  const [prevRespuesta, setPrevRespuesta] = useState(null);
  const [contenido, setContenido] = useState('');

  if (respuesta && respuesta !== prevRespuesta) {
    setPrevRespuesta(respuesta);
    setContenido(respuesta.contenido || '');
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    onSubmit(respuesta.idRespuesta, { contenido });
  };

  return (
    <Modal
      isOpen={isOpen && Boolean(respuesta)}
      onClose={onClose}
      title="Editar Respuesta"
      icon={Edit3}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-respuesta-contenido" className="block text-xs font-extrabold text-slate-900 uppercase mb-1.5">
            Contenido de la respuesta <span className="text-red-500">*</span>
          </label>
          <textarea
            id="edit-respuesta-contenido"
            required
            rows={6}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-xs font-mono resize-none leading-relaxed text-slate-800"
          />
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !contenido.trim()}
            className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    </Modal>
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
