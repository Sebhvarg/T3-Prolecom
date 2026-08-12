import { useState } from 'react';
import PropTypes from 'prop-types';
import { Loader2, Edit } from 'lucide-react';
import Modal from '../ui/Modal';

const EditPreguntaModal = ({ isOpen, onClose, onSubmit, pregunta, submitting }) => {
  const [prevPregunta, setPrevPregunta] = useState(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });

  if (pregunta && pregunta !== prevPregunta) {
    setPrevPregunta(pregunta);
    setForm({
      titulo: pregunta.titulo || '',
      descripcion: pregunta.descripcion || '',
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim()) return;
    onSubmit(pregunta.idPregunta, form);
  };

  return (
    <Modal
      isOpen={isOpen && Boolean(pregunta)}
      onClose={onClose}
      title="Editar Pregunta"
      icon={Edit}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-modal-titulo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1.5">
            Título de la consulta <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-modal-titulo"
            type="text"
            required
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-xs font-semibold text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="edit-modal-descripcion" className="block text-xs font-extrabold text-slate-900 uppercase mb-1.5">
            Descripción o código <span className="text-red-500">*</span>
          </label>
          <textarea
            id="edit-modal-descripcion"
            required
            rows={6}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
            disabled={submitting || !form.titulo.trim() || !form.descripcion.trim()}
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

EditPreguntaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  pregunta: PropTypes.object,
  submitting: PropTypes.bool,
};

export default EditPreguntaModal;
