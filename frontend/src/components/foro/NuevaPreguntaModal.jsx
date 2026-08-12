import { useState } from 'react';
import PropTypes from 'prop-types';
import { Loader2, Code, HelpCircle, Eye, Edit3 } from 'lucide-react';
import CodeBlock from './CodeBlock';
import Modal from '../ui/Modal';
import ModalActions from '../ui/ModalActions';

const NuevaPreguntaModal = ({ isOpen, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [activeTab, setActiveTab] = useState('escribir'); // 'escribir' | 'preview'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim()) return;
    onSubmit(form);
  };

  const handleInsertCodeSnippet = () => {
    setForm((prev) => ({
      ...prev,
      descripcion: prev.descripcion + '\n```python\n# Escribe o pega tu código aquí\n\n```\n',
    }));
    setActiveTab('escribir');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publicar Nueva Pregunta"
      icon={HelpCircle}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="modal-titulo" className="block text-xs font-extrabold text-slate-900 uppercase mb-1.5">
            Título de la consulta <span className="text-red-500">*</span>
          </label>
          <input
            id="modal-titulo"
            type="text"
            required
            placeholder="Ej: ¿Por qué obtengo IndexError en este bucle for?"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-xs font-semibold text-slate-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            {/* Pestañas Escribir / Vista Previa */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('escribir')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'escribir' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Edit3 size={13} />
                <span>Escribir</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'preview' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Eye size={13} />
                <span>Vista previa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleInsertCodeSnippet}
              className="text-xs text-[#2c5364] hover:text-[#203a43] font-semibold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <Code size={13} />
              <span>Bloque de código</span>
            </button>
          </div>

          {activeTab === 'escribir' ? (
            <>
              <textarea
                id="modal-descripcion"
                required
                rows={6}
                placeholder="Explica en detalle tu problema. Puedes encerrar tu código entre ```python ... ``` para darle formato."
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-xs font-mono resize-none leading-relaxed text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Tip: Usa ```lenguaje para resaltar sintaxis (python, javascript, c, etc.)</p>
            </>
          ) : (
            <div className="w-full border border-slate-200 rounded-xl p-4 min-h-40 bg-slate-50/50 max-h-60 overflow-y-auto">
              {form.descripcion.trim() ? (
                <CodeBlock content={form.descripcion} />
              ) : (
                <span className="text-xs text-slate-400 italic">No hay contenido para previsualizar. Escribe algo primero.</span>
              )}
            </div>
          )}
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
            <span>Publicar Pregunta</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

NuevaPreguntaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default NuevaPreguntaModal;
