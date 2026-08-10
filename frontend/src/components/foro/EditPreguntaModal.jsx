import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Loader2, Edit } from 'lucide-react';

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

  if (!isOpen || !pregunta) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim()) return;
    onSubmit(pregunta.idPregunta, form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl">
              <Edit size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Editar Pregunta</h3>
              <p className="text-xs text-gray-500">Actualiza el contenido o el título de tu consulta.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-modal-titulo" className="block text-sm font-bold text-gray-700 mb-1.5">
              Título de la consulta <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-modal-titulo"
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-modal-descripcion" className="block text-sm font-bold text-gray-700 mb-1.5">
              Descripción o código <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-modal-descripcion"
              required
              rows={6}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm font-mono resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 text-gray-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.titulo.trim() || !form.descripcion.trim()}
              className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
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
